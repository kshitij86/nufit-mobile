import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadSession, logIn, logOut, onSessionExpired, register } from "../services/session";
import { RegisterRequest } from "../utils/registration";

type AuthStatus = "loading" | "signedOut" | "signedIn";

interface AuthContextValue {
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  /** Creates the account; rejects with AccountCreatedError if the follow-up login fails. */
  signUp: (request: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
}

export class AccountCreatedError extends Error {
  constructor(readonly cause: unknown) {
    super("Your account was created. Please log in.");
    this.name = "AccountCreatedError";
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;
    loadSession()
      .then((hasSession) => active && setStatus(hasSession ? "signedIn" : "signedOut"))
      .catch(() => active && setStatus("signedOut"));
    const unsubscribe = onSessionExpired(() => setStatus("signedOut"));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await logIn(email, password);
    setStatus("signedIn");
  }, []);

  const signUp = useCallback(async (request: RegisterRequest) => {
    await register(request);
    try {
      await logIn(request.email, request.password);
    } catch (e) {
      throw new AccountCreatedError(e);
    }
    setStatus("signedIn");
  }, []);

  const signOut = useCallback(async () => {
    await logOut();
    setStatus("signedOut");
  }, []);

  const value = useMemo(() => ({ status, signIn, signUp, signOut }), [status, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
