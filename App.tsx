import "./global.css";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts as useOutfitFonts,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";
import {
  useFonts as useNunitoFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";

import { AppStateProvider } from "./src/state/AppState";
import { AuthProvider } from "./src/state/Auth";
import RootNavigator from "./src/navigation/RootNavigator";
import Toast from "./src/components/Toast";
import QuickLogSheet from "./src/components/QuickLogSheet";
import AppSplash from "./src/components/AppSplash";
import { colors } from "./src/theme/colors";

SplashScreen.preventAutoHideAsync().catch(() => {});

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.cream,
    card: colors.cream,
    primary: colors.orange,
  },
};

export default function App() {
  const [outfitLoaded] = useOutfitFonts({ Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold });
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });

  const fontsLoaded = outfitLoaded && nunitoLoaded;
  const [splashDone, setSplashDone] = useState(false);

  const onSplashLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  const onSplashFinish = useCallback(() => setSplashDone(true), []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppStateProvider>
          <View style={{ flex: 1 }}>
            <NavigationContainer theme={navTheme}>
              <RootNavigator />
              <Toast />
              <QuickLogSheet />
            </NavigationContainer>
            {!splashDone && <AppSplash onLayout={onSplashLayout} onFinish={onSplashFinish} />}
            <StatusBar style="dark" />
          </View>
        </AppStateProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
