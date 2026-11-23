// Gives Firebase Cloud Messaging a status-bar icon and accent colour on Android.
//
// Android draws notification icons as a white silhouette, so a full-colour app icon shows up as a
// blank square. Expo used to set this up from the app config's `notification` field; that field is
// gone, and the replacement (expo-notifications) ships its own FCM service that would compete with
// @react-native-firebase/messaging. So: copy the icon into res/drawable, add the colour, and point
// Firebase at both.
const fs = require("fs");
const path = require("path");
const { AndroidConfig, withAndroidColors, withAndroidManifest, withDangerousMod } = require("expo/config-plugins");

const ICON_RESOURCE = "notification_icon";
const COLOR_RESOURCE = "notification_icon_color";

function setMetaData(application, name, resource) {
  application["meta-data"] = (application["meta-data"] ?? []).filter((item) => item.$["android:name"] !== name);
  application["meta-data"].push({ $: { "android:name": name, "android:resource": resource, "tools:replace": "android:resource" } });
}

module.exports = function withAndroidNotificationIcon(config, { icon, color }) {
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const drawable = path.join(config.modRequest.platformProjectRoot, "app/src/main/res/drawable");
      await fs.promises.mkdir(drawable, { recursive: true });
      await fs.promises.copyFile(path.resolve(config.modRequest.projectRoot, icon), path.join(drawable, `${ICON_RESOURCE}.png`));
      return config;
    },
  ]);

  config = withAndroidColors(config, (config) => {
    config.modResults = AndroidConfig.Colors.assignColorValue(config.modResults, { name: COLOR_RESOURCE, value: color });
    return config;
  });

  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$["xmlns:tools"] ??= "http://schemas.android.com/tools";
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    setMetaData(application, "com.google.firebase.messaging.default_notification_icon", `@drawable/${ICON_RESOURCE}`);
    setMetaData(application, "com.google.firebase.messaging.default_notification_color", `@color/${COLOR_RESOURCE}`);
    return config;
  });
};
