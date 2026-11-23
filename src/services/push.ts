import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import { DevicePlatform, registerDevice } from "./devices";

// Firebase Cloud Messaging receives pushes and supplies the token we register with our API
// (services/devices). expo-notifications only shows notifications and owns the Android channel:
// Android doesn't show FCM notifications itself while the app is in the foreground, so we post
// those ourselves, and every push goes to one high-importance channel so it pops up as a banner.

/** Also set as FCM's default channel in app.json (expo-notifications plugin `defaultChannel`). */
export const PUSH_CHANNEL_ID = "general";

// Show notifications we post while the app is open, as a banner and in the notification shade.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const platform = (): DevicePlatform | null =>
  Platform.OS === "android" || Platform.OS === "ios" ? Platform.OS : null;

async function ensureChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
    name: "Updates from 360° Fitness",
    importance: AndroidImportance.HIGH,
  });
}

/** Asks for permission to show notifications (Android 13+ and iOS); resolves whether it was granted. */
async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Registers this phone for the signed-in user's notifications and keeps the registration current
 * when FCM rotates the token. Pushes that arrive while the app is open are posted to the
 * notification shade (the OS does that itself when the app is in the background). Resolves to a
 * function that stops it.
 */
export async function startPushNotifications(): Promise<() => void> {
  const os = platform();
  if (!os) return () => {};
  // First, so the channel exists before any push can arrive.
  await ensureChannel();
  if (!(await ensurePermission())) return () => {};

  const messaging = getMessaging();
  const register = (token: string) =>
    registerDevice(os, token).catch((e) => console.warn("Push registration failed", e));

  const stopRefresh = onTokenRefresh(messaging, register);
  const stopMessages = onMessage(messaging, (message) => {
    const { title, body } = message.notification ?? {};
    if (!title && !body) return;
    Notifications.scheduleNotificationAsync({
      content: { title: title ?? "", body: body ?? "", data: message.data ?? {} },
      trigger: Platform.OS === "android" ? { channelId: PUSH_CHANNEL_ID } : null,
    }).catch((e) => console.warn("Couldn't show the notification", e));
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
