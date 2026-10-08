import React, { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton, { TextButton } from "../components/PillButton";
import TextField from "../components/TextField";
import { Body, Eyebrow, Heading } from "../components/Primitives";
import { useAuth } from "../state/Auth";
import { userMessage } from "../services/http";
import { RootNav, RootStackParamList } from "../navigation/types";

export default function Login() {
  const navigation = useNavigation<RootNav>();
  const { params } = useRoute<RouteProp<RootStackParamList, "Login">>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState(params?.email ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(userMessage(e));
      setBusy(false);
    }
  };

  return (
    <ScreenScaffold
      footer={
        <>
          <PillButton label="Log in" loading={busy} disabled={!canSubmit} onPress={submit} />
          <PillButton label="Log in with phone · coming soon" variant="outline" disabled />
          <TextButton label="New to Nufit? Create an account" onPress={() => navigation.navigate("Register")} />
        </>
      }
    >
      <View style={{ marginTop: 24, marginBottom: 28 }}>
        <Text style={{ fontFamily: "Outfit_800ExtraBold", fontSize: 32, color: colors.ink, letterSpacing: -1, marginBottom: 24 }}>
          nufit<Text style={{ color: colors.orange }}>.</Text>
        </Text>
        <Eyebrow>Welcome back</Eyebrow>
        <Heading size={28}>Log in to your account</Heading>
      </View>

      <View style={{ gap: 16 }}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!busy}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!busy}
        />
      </View>

      {error && (
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start", marginTop: 16 }}>
          <Ionicons name="alert-circle" size={18} color={colors.coralInk} style={{ marginTop: 2 }} />
          <Body color={colors.coralInk} size={14} style={{ flex: 1 }}>
            {error}
          </Body>
        </View>
      )}
      {busy && (
        <Body size={13} style={{ marginTop: 16 }}>
          Signing you in. The first sign-in can take a few seconds.
        </Body>
      )}
    </ScreenScaffold>
  );
}
