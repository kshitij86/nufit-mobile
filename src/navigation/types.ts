import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp } from "@react-navigation/native";

export type RootStackParamList = {
  Welcome: undefined;
  Quiz: undefined;
  Match: undefined;
  Plans: undefined;
  Consent: undefined;
  Checkout: undefined;
  Intake: undefined;
  Gender: undefined;
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
