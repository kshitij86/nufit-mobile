// Makes expo-notifications and React Native Firebase share the Android manifest. Listed first in
// app.json: Expo applies manifest mods in reverse order, so this runs after theirs.
//
// expo-notifications shows notifications and owns the channel; React Native Firebase receives the
// pushes. Two fixes:
// - expo-notifications declares its own FCM service, and Android hands each push to just one
//   service. Theirs has the lower priority so ours already wins, but removing it leaves no doubt.
// - Both libraries set Firebase's default notification channel and colour (React Native
//   Firebase's own manifest says "" and @color/white), so ours must replace theirs or the
//   manifest merge fails.
const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

const EXPO_FCM_SERVICE = "expo.modules.notifications.service.ExpoFirebaseMessagingService";
const REPLACE = {
  "com.google.firebase.messaging.default_notification_channel_id": "android:value",
  "com.google.firebase.messaging.default_notification_color": "android:resource",
  "com.google.firebase.messaging.default_notification_icon": "android:resource",
};

module.exports = function withFirebaseNotificationManifest(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults.manifest.$["xmlns:tools"] ??= "http://schemas.android.com/tools";
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    application.service = (application.service ?? []).filter((s) => s.$["android:name"] !== EXPO_FCM_SERVICE);
    application.service.push({ $: { "android:name": EXPO_FCM_SERVICE, "tools:node": "remove" } });

    for (const item of application["meta-data"] ?? []) {
      const attribute = REPLACE[item.$["android:name"]];
      if (attribute) item.$["tools:replace"] = attribute;
    }
    return config;
  });
};
