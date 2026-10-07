import React, { useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, LayoutChangeEvent, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton, { TextButton } from "../components/PillButton";
import TextField from "../components/TextField";
import { BackButton, Body, Eyebrow, Heading } from "../components/Primitives";
import { AccountCreatedError, useAuth } from "../state/Auth";
import { ApiError, userMessage } from "../services/http";
import { RootNav } from "../navigation/types";
import {
  fieldOrder,
  NAME_MAX_LENGTH,
  formatDateInput,
  genderOptions,
  PHONE_COUNTRY_CODE,
  phoneDigits,
  RegistrationErrors,
  RegistrationField,
  RegistrationForm,
  serverFieldMap,
  toRegisterRequest,
  validateRegistration,
} from "../utils/registration";

const emptyForm: RegistrationForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: null,
  password: "",
  passwordConfirm: "",
};

// Splits a 422 into inline field errors plus anything that doesn't belong to a single field.
function serverErrors(e: ApiError): { fields: RegistrationErrors; form: string | null } {
  const fields: RegistrationErrors = {};
  const other: string[] = [];
  for (const [key, message] of Object.entries(e.fieldErrors)) {
    const field = serverFieldMap[key as keyof typeof serverFieldMap];
    if (field) fields[field] = message;
    else other.push(message);
  }
  const hasFields = Object.keys(fields).length > 0;
  return { fields, form: other[0] ?? (hasFields ? null : e.message) };
}

export default function Register() {
  const navigation = useNavigation<RootNav>();
  const { signUp } = useAuth();
  const [form, setForm] = useState<RegistrationForm>(emptyForm);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const dateOfBirthRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const passwordConfirmRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  // Each field's offset within the fields container, and the container's offset in the scroll content.
  const fieldsY = useRef(0);
  const fieldY = useRef<Partial<Record<RegistrationField, number>>>({});

  const recordY = (e: LayoutChangeEvent, ...names: RegistrationField[]) => {
    for (const name of names) fieldY.current[name] = e.nativeEvent.layout.y;
  };

  // Brings the first invalid field into view, so errors below the fold (like the password) aren't missed.
  const revealFirstError = (found: RegistrationErrors) => {
    const first = fieldOrder.find((name) => found[name]);
    if (!first) return;
    const y = fieldY.current[first];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, fieldsY.current + y - 16), animated: true });
    const inputs: Partial<Record<RegistrationField, React.RefObject<TextInput | null>>> = {
      firstName: firstNameRef,
      lastName: lastNameRef,
      email: emailRef,
      phone: phoneRef,
      dateOfBirth: dateOfBirthRef,
      password: passwordRef,
      passwordConfirm: passwordConfirmRef,
    };
    inputs[first]?.current?.focus();
  };

  const set = <K extends RegistrationField>(field: K, value: RegistrationForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async () => {
    if (busy) return;
    const found = validateRegistration(form);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      revealFirstError(found);
      return;
    }

    setBusy(true);
    try {
      await signUp(toRegisterRequest(form));
    } catch (e) {
      setBusy(false);
      if (e instanceof AccountCreatedError) {
        Alert.alert("Account created", "Please log in with your new email and password.");
        navigation.navigate("Login", { email: form.email.trim() });
      } else if (e instanceof ApiError && e.status === 422) {
        const { fields, form: message } = serverErrors(e);
        setErrors(fields);
        setFormError(message);
        revealFirstError(fields);
      } else {
        setFormError(userMessage(e));
      }
    }
  };

  const field = (name: Exclude<RegistrationField, "gender">) => ({
    value: form[name],
    onChangeText: (text: string) => set(name, text),
    error: errors[name],
    editable: !busy,
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenScaffold
        scrollRef={scrollRef}
        header={<BackButton />}
        footer={
          <>
            <PillButton label="Create account" loading={busy} onPress={submit} />
            <TextButton label="Already have an account? Log in" onPress={() => navigation.navigate("Login")} />
          </>
        }
      >
        <View style={{ marginBottom: 24 }}>
          <Eyebrow>New to Nufit</Eyebrow>
          <Heading size={28}>Create your account</Heading>
        </View>

        <View style={{ gap: 16 }} onLayout={(e) => (fieldsY.current = e.nativeEvent.layout.y)}>
          <View style={{ flexDirection: "row", gap: 12 }} onLayout={(e) => recordY(e, "firstName", "lastName")}>
            <View style={{ flex: 1 }}>
              <TextField
                ref={firstNameRef}
                label="First name"
                {...field("firstName")}
                autoComplete="given-name"
                textContentType="givenName"
                maxLength={NAME_MAX_LENGTH}
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                ref={lastNameRef}
                label="Last name"
                {...field("lastName")}
                autoComplete="family-name"
                textContentType="familyName"
                maxLength={NAME_MAX_LENGTH}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>
          </View>
          <View onLayout={(e) => recordY(e, "email")}>
            <TextField
              ref={emailRef}
              label="Email"
              {...field("email")}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </View>
          <View onLayout={(e) => recordY(e, "phone")}>
            <TextField
              ref={phoneRef}
              label="Phone number"
              {...field("phone")}
              onChangeText={(text) => set("phone", phoneDigits(text))}
              prefix={
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingLeft: 14,
                    paddingRight: 12,
                    alignSelf: "stretch",
                    borderRightWidth: 1,
                    borderRightColor: colors.hairline,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>🇮🇳</Text>
                  <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 15, color: colors.ink }}>
                    {PHONE_COUNTRY_CODE}
                  </Text>
                </View>
              }
              placeholder="98765 43210"
              autoComplete="tel-national"
              keyboardType="number-pad"
              textContentType="telephoneNumber"
            />
          </View>
          <View onLayout={(e) => recordY(e, "dateOfBirth")}>
            <TextField
              ref={dateOfBirthRef}
              label="Date of birth"
              {...field("dateOfBirth")}
              onChangeText={(text) => set("dateOfBirth", formatDateInput(text))}
              placeholder="DD/MM/YYYY"
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          <View style={{ gap: 8 }} onLayout={(e) => recordY(e, "gender")}>
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: colors.secondary }}>
              Gender <Text style={{ color: colors.muted, fontFamily: "Nunito_600SemiBold" }}>· optional</Text>
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {genderOptions.map((opt) => {
                const selected = form.gender === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    disabled={busy}
                    onPress={() => set("gender", selected ? null : opt.id)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: selected ? colors.orange : colors.hairline,
                      backgroundColor: selected ? colors.orangeTint : colors.card,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: selected ? "Nunito_700Bold" : "Nunito_600SemiBold",
                        color: colors.ink,
                        fontSize: 14,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View onLayout={(e) => recordY(e, "password")}>
            <TextField
              ref={passwordRef}
              label="Password"
              {...field("password")}
              hint="8+ characters with upper and lower case, a number and a symbol."
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => passwordConfirmRef.current?.focus()}
            />
          </View>
          <View onLayout={(e) => recordY(e, "passwordConfirm")}>
            <TextField
              ref={passwordConfirmRef}
              label="Confirm password"
              {...field("passwordConfirm")}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
          </View>
        </View>

        {formError && (
          <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start", marginTop: 16 }}>
            <Ionicons name="alert-circle" size={18} color={colors.coralInk} style={{ marginTop: 2 }} />
            <Body color={colors.coralInk} size={14} style={{ flex: 1 }}>
              {formError}
            </Body>
          </View>
        )}
        {busy && (
          <Body size={13} style={{ marginTop: 16 }}>
            Creating your account. This can take a few seconds.
          </Body>
        )}
      </ScreenScaffold>
    </KeyboardAvoidingView>
  );
}
