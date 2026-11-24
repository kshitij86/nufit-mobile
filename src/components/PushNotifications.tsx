import { useEffect } from "react";
import { AppState } from "react-native";
import { useAuth } from "../state/Auth";
import { pushSupported } from "../services/pushSupport";

// Required only when used: importing Firebase at all crashes Expo Go.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadPush = (): typeof import("../services/push") => require("../services/push");

/**
 * Registers the phone for push notifications while someone is signed in. Renders nothing.
 *
 * On sign-in and every app start it asks for permission if notifications aren't allowed. Coming
 * back to the app (e.g. from Settings) it checks again without asking, and registers as soon as
 * they're on.
 */
export default function PushNotifications() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "signedIn" || !pushSupported) return;
    let active = true;
    let stop: (() => void) | null = null;
    let starting = false;

    const start = (prompt: boolean) => {
      if (stop || starting) return;
      starting = true;
      Promise.resolve()
        .then(() => loadPush().startPushNotifications({ prompt }))
        .then((started) => {
          if (!active) started.stop();
          else if (started.granted) stop = started.stop;
        })
        .catch((e) => console.warn("Push notifications unavailable", e))
        .finally(() => {
          starting = false;
        });
    };

    start(true);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") start(false);
    });
    return () => {
      active = false;
      subscription.remove();
      stop?.();
    };
  }, [status]);

  return null;
}
