import { PermissionsAndroid, Platform } from "react-native";
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import { DevicePlatform, registerDevice } from "./devices";

// Firebase Cloud Messaging on the phone: permission, the FCM token, and incoming messages.
// The token is registered with our API (services/devices), never sent to Firebase from here.

export interface ForegroundPush {
  title: string;
  body: string;
}

const platform = (): DevicePlatform | null =>
  Platform.OS === "android" || Platform.OS === "ios" ? Platform.OS : null;

/** Asks for permission to show notifications; resolves whether they may be shown. */
async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    // Android 13+ asks at runtime; older versions grant it at install.
    if (Platform.Version < 33) return true;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  const status = await requestPermission(getMessaging());
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

/**
 * Registers this phone for the signed-in user's notifications, keeps the registration current when
 * FCM rotates the token, and reports messages that arrive while the app is open (the OS only shows
 * notifications itself when the app is in the background). Resolves to a function that stops it.
 */
export async function startPushNotifications(onForeground: (push: ForegroundPush) => void): Promise<() => void> {
  const os = platform();
  if (!os || !(await ensurePermission())) return () => {};

  const messaging = getMessaging();
  const register = (token: string) =>
    registerDevice(os, token).catch((e) => console.warn("Push registration failed", e));

  const stopRefresh = onTokenRefresh(messaging, register);
  const stopMessages = onMessage(messaging, (message) => {
    const { title, body } = message.notification ?? {};
    if (title || body) onForeground({ title: title ?? "", body: body ?? "" });
  });
  try {
    await register(await getToken(messaging));
  } catch (e) {
    console.warn("Couldn't get an FCM token", e);
  }
  return () => {
    stopRefresh();
    stopMessages();
  };
}

/**
 * Must run at startup, outside React: Android may start the app headless to deliver a message.
 * Notification messages are shown by the OS on their own, so there's nothing more to do yet.
 */
export function handleBackgroundPushes() {
  setBackgroundMessageHandler(getMessaging(), async () => {});
}
