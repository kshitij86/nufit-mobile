import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { DEVICES_BASE_URL } from "../config";
import { authDelete, authPost, authPut } from "./session";

// Registers this phone with the API for push notifications. The API stores it as an Azure
// Notification Hubs installation tagged with the signed-in user, so pushes addressed to them reach
// every phone they're signed in on. Kept free of Firebase so it runs (and tests) anywhere.

const INSTALLATION_ID_KEY = "nufit.pushInstallationId";
const UNREGISTER_TIMEOUT_MS = 10_000;

export type DevicePlatform = "android" | "ios";

let installationId: Promise<string> | null = null;

/** A random id for this install of the app, made once and kept; re-registering replaces, never duplicates. */
export function getInstallationId(): Promise<string> {
  if (!installationId) {
    installationId = (async () => {
      const saved = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
      if (saved) return saved;
      const id = Crypto.randomUUID();
      await SecureStore.setItemAsync(INSTALLATION_ID_KEY, id);
      return id;
    })().catch((e) => {
      installationId = null;
      throw e;
    });
  }
  return installationId;
}

/** Points this phone's installation at the signed-in user, with its current FCM token. */
export async function registerDevice(platform: DevicePlatform, pushToken: string): Promise<void> {
  const id = await getInstallationId();
  await authPut(
    `${DEVICES_BASE_URL}/${encodeURIComponent(id)}`,
    { platform, push_token: pushToken },
    { fallbackError: "Couldn't turn on notifications. Please try again." }
  );
}

/**
 * Stops the signed-in user's notifications reaching this phone. Await it before clearing the
 * session: it resolves once the request is sent with the current token, not when it completes,
 * so signing out stays instant. Best effort: if it fails, the next person to sign in here takes
 * the installation over anyway.
 */
export async function unregisterDevice(): Promise<void> {
  let id: string;
  try {
    id = await getInstallationId();
  } catch {
    return;
  }
  authDelete(`${DEVICES_BASE_URL}/${encodeURIComponent(id)}`, { timeoutMs: UNREGISTER_TIMEOUT_MS }).catch(() => {});
}

/** Asks the API to push a test notification to every phone the user is signed in on. */
export async function sendTestPush(): Promise<void> {
  await authPost(`${DEVICES_BASE_URL}/test-push`, undefined, {
    fallbackError: "Couldn't send a test notification. Please try again.",
  });
}
