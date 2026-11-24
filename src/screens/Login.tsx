import React, { useEffect, useRef, useState } from "react";
import { BackHandler, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { HorizontalLogo } from "../components/brand/BrandLockup";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton, { TextButton } from "../components/PillButton";
import TextField from "../components/TextField";
import CountryPicker from "../components/CountryPicker";
import { BackButton, Body, Eyebrow, Heading } from "../components/Primitives";
import { useAuth } from "../state/Auth";
import { sendLoginOtp } from "../services/session";
import { ApiError, userMessage } from "../services/http";
import { RootNav } from "../navigation/types";
import { formatPhone, nationalDigits, phonePlaceholder, phoneProblem, toE164 } from "../utils/phone";
import { countryByIso, DEFAULT_COUNTRY_ISO } from "../data/countries";

const RESEND_SECONDS = 60;
// The backend accepts 4–8 digit codes.
const OTP_MIN_LENGTH = 4;
const OTP_MAX_LENGTH = 8;

type Busy = "sending" | "verifying" | null;

function ErrorMessage({ message }: { message: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start", marginTop: 16 }}>
      <Ionicons name="alert-circle" size={18} color={colors.coralInk} style={{ marginTop: 2 }} />
      <Body color={colors.coralInk} size={14} style={{ flex: 1 }}>
        {message}
      </Body>
    </View>
  );
}

const formatCountdown = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** Seconds left until `at` (a Date.now() timestamp), ticking down once a second. */
function useSecondsUntil(at: number) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    // Measured against the clock, so time spent in the background still counts.
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((at - Date.now()) / 1000));
      setLeft(seconds);
      if (seconds === 0) clearInterval(timer);
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [at]);
  return left;
}

/**
 * The first logged-out screen. Logging in with a code sent to the member's phone comes first, in two
 * steps on this screen (the number, then the code); email and password is on its own screen.
 */
export default function Login() {
  const navigation = useNavigation<RootNav>();
  const { signInWithOtp } = useAuth();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [country, setCountry] = useState(DEFAULT_COUNTRY_ISO);
  const countryCode = countryByIso(country).dial;
  const [national, setNational] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);
  // The number the current code was sent to, so editing the field later can't change it.
  const [sentTo, setSentTo] = useState<{ e164: string; display: string } | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [resendAt, setResendAt] = useState(0);
  const resendIn = useSecondsUntil(resendAt);
  const nationalRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const codeRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const backToPhone = () => {
    setStep("phone");
    setCode("");
    setCodeError(null);
    setLocked(false);
    setResent(false);
    setError(null);
  };

  // This is the first screen, so Android's back button would close the app; on the code step it
  // goes back to the number instead. While a request is in flight it does nothing, like the header button.
  useEffect(() => {
    if (step !== "code") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (busy === null) backToPhone();
      return true;
    });
    return () => subscription.remove();
  }, [step, busy]);

  const sendCode = async () => {
    if (busy) return;
    const problem = phoneProblem(countryCode, national);
    setPhoneError(problem);
    setError(null);
    setNotRegistered(false);
    if (problem) {
      nationalRef.current?.focus();
      return;
    }
    const e164 = toE164(countryCode, national);
    setBusy("sending");
    try {
      await sendLoginOtp(e164);
      setSentTo({ e164, display: formatPhone(countryCode, national) });
      setResendAt(Date.now() + RESEND_SECONDS * 1000);
      setStep("code");
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotRegistered(true);
      const fieldMessage = e instanceof ApiError ? e.fieldErrors.phone_number : undefined;
      if (fieldMessage) setPhoneError(fieldMessage);
      else setError(userMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const resendCode = async () => {
    if (busy || resendIn > 0 || !sentTo) return;
    setBusy("sending");
    setError(null);
    setCodeError(null);
    setResent(false);
    try {
      await sendLoginOtp(sentTo.e164);
      // The server only sends when the number isn't locked, so a new code can be tried.
      setLocked(false);
      setCode("");
      setResent(true);
      setResendAt(Date.now() + RESEND_SECONDS * 1000);
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    if (busy || locked || !sentTo) return;
    if (code.length < OTP_MIN_LENGTH) {
      setCodeError("Enter the full code.");
      codeRef.current?.focus();
      return;
    }
    setBusy("verifying");
    setError(null);
    setCodeError(null);
    setResent(false);
    try {
      // On success the app switches to the signed-in screens, as after an email login.
      await signInWithOtp(sentTo.e164, code);
    } catch (e) {
      setBusy(null);
      if (e instanceof ApiError && e.status === 429) {
        // The number is locked for a while; no code can work until then.
        setLocked(true);
        setError(userMessage(e));
      } else if (e instanceof ApiError && (e.status === 400 || e.fieldErrors.otp)) {
        // Wrong or expired code: clear it so the next one can be typed straight in.
        setCodeError(e.fieldErrors.otp ?? e.message);
        setCode("");
        codeRef.current?.focus();
      } else {
        setError(userMessage(e));
      }
    }
  };

  if (step === "code" && sentTo) {
    return (
      <ScreenScaffold
        header={<BackButton onPress={busy ? () => {} : backToPhone} />}
        footer={
          <>
            <PillButton
              label="Log in"
              loading={busy === "verifying"}
              disabled={locked || code.length < OTP_MIN_LENGTH || busy !== null}
              onPress={verify}
            />
            <PillButton
              label={resendIn > 0 ? `Resend code in ${formatCountdown(resendIn)}` : "Resend code"}
              variant="outline"
              loading={busy === "sending"}
              disabled={resendIn > 0 || busy !== null}
              onPress={resendCode}
            />
            <TextButton label="Change number" onPress={busy ? undefined : backToPhone} />
          </>
        }
      >
        <View style={{ marginBottom: 24 }}>
          <Eyebrow>Check your phone</Eyebrow>
          <Heading size={28}>Enter your code</Heading>
          <Body style={{ marginTop: 8 }}>
            {`We've sent a code to ${sentTo.display} by SMS or call.`}
          </Body>
        </View>

        <TextField
          ref={codeRef}
          label="Code"
          value={code}
          onChangeText={(text) => {
            setCode(text.replace(/\D/g, "").slice(0, OTP_MAX_LENGTH));
            setCodeError(null);
          }}
          error={codeError ?? undefined}
          placeholder="Enter the code"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={OTP_MAX_LENGTH}
          autoFocus
          returnKeyType="go"
          onSubmitEditing={verify}
          editable={!locked && busy === null}
        />

        {error && <ErrorMessage message={error} />}
        {resent && !error && (
          <Body size={13} style={{ marginTop: 16 }}>
            {`We've sent a new code to ${sentTo.display}.`}
          </Body>
        )}
        {busy === "verifying" && (
          <Body size={13} style={{ marginTop: 16 }}>
            Signing you in. The first sign-in can take a few seconds.
          </Body>
        )}
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      footer={
        <>
          <PillButton label="Send code" loading={busy === "sending"} onPress={sendCode} />
          <PillButton
            label="Log in with email and password"
            variant="outline"
            disabled={busy !== null}
            onPress={() => navigation.navigate("EmailLogin")}
          />
          <TextButton label="Create account" onPress={() => navigation.navigate("Register")} />
        </>
      }
    >
      <View style={{ marginTop: 24, marginBottom: 28 }}>
        <View style={{ marginBottom: 28 }}>
          <HorizontalLogo size={56} />
        </View>
        <Eyebrow>Welcome back</Eyebrow>
        <Heading size={28}>Log in to your account</Heading>
        <Body style={{ marginTop: 8 }}>{"We'll send a code to the mobile number on your account."}</Body>
      </View>

      <TextField
        ref={nationalRef}
        label="Mobile number"
        value={national}
        onChangeText={(text) => {
          setNational(nationalDigits(countryCode, text));
          setPhoneError(null);
          setNotRegistered(false);
        }}
        error={phoneError ?? undefined}
        prefix={
          <CountryPicker
            value={country}
            disabled={busy !== null}
            onChange={(picked) => {
              setCountry(picked.iso);
              setNational((prev) => nationalDigits(picked.dial, prev));
              setPhoneError(null);
              setNotRegistered(false);
            }}
          />
        }
        placeholder={phonePlaceholder(countryCode)}
        keyboardType="number-pad"
        autoComplete="tel-national"
        textContentType="telephoneNumber"
        returnKeyType="go"
        onSubmitEditing={sendCode}
        editable={busy === null}
      />

      {error && <ErrorMessage message={error} />}
      {notRegistered && (
        <View style={{ marginTop: 12, alignItems: "flex-start" }}>
          <TextButton
            label="Create an account with this number"
            onPress={() => navigation.navigate("Register", { country, phone: national })}
          />
        </View>
      )}
      {busy === "sending" && (
        <Body size={13} style={{ marginTop: 16 }}>
          Sending your code. This can take a few seconds.
        </Body>
      )}
    </ScreenScaffold>
  );
}
