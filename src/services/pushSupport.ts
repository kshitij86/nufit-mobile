import { isRunningInExpoGo } from "expo";

/**
 * Expo Go doesn't include React Native Firebase's native code, so loading it there crashes the app.
 * Push notifications only work in a development or release build (`npx expo run:android`); in Expo
 * Go the app runs without them. (Not `Constants.executionEnvironment`: since SDK 58 its
 * `storeClient` covers development builds too.)
 */
export const pushSupported = !isRunningInExpoGo();
