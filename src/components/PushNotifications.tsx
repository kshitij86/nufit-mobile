import { useEffect } from "react";
import { useAuth } from "../state/Auth";
import { pushSupported } from "../services/pushSupport";

/** Registers the phone for push notifications while someone is signed in. Renders nothing. */
export default function PushNotifications() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "signedIn" || !pushSupported) return;
    let active = true;
    let stop: (() => void) | null = null;
    // Loaded only here: importing Firebase at all crashes Expo Go.
    import("../services/push")
      .then(({ startPushNotifications }) => startPushNotifications())
      .then((cleanup) => {
        if (active) stop = cleanup;
        else cleanup();
      })
      .catch((e) => console.warn("Push notifications unavailable", e));
    return () => {
      active = false;
      stop?.();
    };
  }, [status]);

  return null;
}
