import { createNavigationContainerRef } from "@react-navigation/native";
import { RootStackParamList } from "./types";

/** Lets code outside screens (e.g. a tapped notification) navigate. Attached in App.tsx. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
