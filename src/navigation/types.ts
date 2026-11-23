import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp } from "@react-navigation/native";

export type RootStackParamList = {
  Login: undefined;
  EmailLogin: { email?: string } | undefined;
  /** Pre-fills the mobile number: `country` is its ISO code (India if left out), `phone` the digits without the country code. */
  Register: { phone?: string; country?: string } | undefined;
  Welcome: undefined;
  Quiz: undefined;
  Match: undefined;
  Plans: undefined;
  AlmostThere: undefined;
  Consent: undefined;
  Checkout: undefined;
  Questionnaire: undefined;
  Measure: undefined;
  MeasureDone: undefined;
  Mood: undefined;
  MainTabs: undefined;
  Player: { sessionId: string };
  Recipe: { recipeId: string };
  Sleep: undefined;
  Circle: undefined;
  Milestones: undefined;
  Streak: undefined;
  Reminders: undefined;
  Profile: undefined;
};

/** The screens the member navigator can open on. */
export type MemberStartRoute = Extract<keyof RootStackParamList, "Measure" | "MainTabs">;

export type MainTabParamList = {
  Today: undefined;
  Move: undefined;
  Kitchen: undefined;
  Journey: undefined;
};

export type RootNav = NativeStackNavigationProp<RootStackParamList>;

export type TabNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
