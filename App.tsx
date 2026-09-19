import "./global.css";
import React, { useCallback } from "react";
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
import RootNavigator from "./src/navigation/RootNavigator";
import Toast from "./src/components/Toast";
import QuickLogSheet from "./src/components/QuickLogSheet";
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

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <NavigationContainer theme={navTheme}>
            <RootNavigator />
            <Toast />
            <QuickLogSheet />
          </NavigationContainer>
          <StatusBar style="dark" />
        </View>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
