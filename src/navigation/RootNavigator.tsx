import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import Login from "../screens/Login";
import Register from "../screens/Register";
import Welcome from "../screens/Welcome";
import Quiz from "../screens/Quiz";
import Match from "../screens/Match";
import Plans from "../screens/Plans";
import Consent from "../screens/Consent";
import Checkout from "../screens/Checkout";
import Intake from "../screens/Intake";
import Gender from "../screens/Gender";
import Measure from "../screens/Measure";
import MeasureDone from "../screens/MeasureDone";
import Mood from "../screens/Mood";
import MainTabs from "./MainTabs";
import Player from "../screens/Player";
import Recipe from "../screens/Recipe";
import Sleep from "../screens/Sleep";
import Circle from "../screens/Circle";
import Milestones from "../screens/Milestones";
import Streak from "../screens/Streak";
import Reminders from "../screens/Reminders";
import Profile from "../screens/Profile";
import { useAuth } from "../state/Auth";
import { useProgrammeStatus } from "../services/journey";
import ResourceState from "../components/ResourceState";
import { colors } from "../theme/colors";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * The signed-in app. Members who have bought a programme open on the tabs, where Today says
 * whether their plan is still being prepared; everyone else starts the onboarding funnel.
 */
function SignedIn() {
  const programme = useProgrammeStatus();
  if (!programme.data) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.cream }}>
        <ResourceState resource={programme} />
      </View>
    );
  }
  const initialRouteName = programme.data.status === "none" ? "Welcome" : "MainTabs";

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="Quiz" component={Quiz} />
      <Stack.Screen name="Match" component={Match} />
      <Stack.Screen name="Plans" component={Plans} />
      <Stack.Screen name="Consent" component={Consent} />
      <Stack.Screen name="Checkout" component={Checkout} />
      <Stack.Screen name="Intake" component={Intake} />
      <Stack.Screen name="Gender" component={Gender} />
      <Stack.Screen name="Measure" component={Measure} />
      <Stack.Screen name="MeasureDone" component={MeasureDone} />
      <Stack.Screen name="Mood" component={Mood} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Player" component={Player} options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="Recipe" component={Recipe} />
      <Stack.Screen name="Sleep" component={Sleep} />
      <Stack.Screen name="Circle" component={Circle} />
      <Stack.Screen name="Milestones" component={Milestones} />
      <Stack.Screen name="Streak" component={Streak} options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="Reminders" component={Reminders} />
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { status } = useAuth();

  // The splash covers the screen while the stored session loads.
  if (status === "loading") return null;
  if (status === "signedIn") return <SignedIn />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="Login" component={Login} options={{ animationTypeForReplace: "pop" }} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
}
