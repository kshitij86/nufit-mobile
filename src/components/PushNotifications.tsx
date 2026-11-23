import { useEffect } from "react";
import { useAuth } from "../state/Auth";
import { useAppState } from "../state/AppState";
import { startPushNotifications } from "../services/push";

/** Registers the phone for push notifications while someone is signed in. Renders nothing. */
export default function PushNotifications() {
  const { status } = useAuth();
  const { toast } = useAppState();
  const showToast = toast.show;

  useEffect(() => {
    if (status !== "signedIn") return;
    let active = true;
    let stop: (() => void) | null = null;
    startPushNotifications(({ title, body }) => showToast(title && body ? `${title}: ${body}` : title || body))
      .then((cleanup) => {
        if (active) stop = cleanup;
        else cleanup();
      })
      .catch((e) => console.warn("Push notifications unavailable", e));
    return () => {
      active = false;
      stop?.();
    };
  }, [status, showToast]);

  return null;
}
