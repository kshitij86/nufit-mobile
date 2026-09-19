import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
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

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
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
