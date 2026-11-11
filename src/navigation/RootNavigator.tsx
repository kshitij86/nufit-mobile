import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MemberStartRoute, RootStackParamList } from "./types";
import { memberStartRoute, stageFor } from "./flow";
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
import { TextButton } from "../components/PillButton";
import { useAppState } from "../state/AppState";
import { colors } from "../theme/colors";

const Stack = createNativeStackNavigator<RootStackParamList>();
const screenOptions = { headerShown: false, animation: "slide_from_right" } as const;

/*
 * The app has three states, each with its own navigator: logged out, onboarding (signed in, no
 * programme bought) and member (bought). A navigator only registers its own state's screens, so
 * nothing in one state, not a navigate() call nor Android's back button, can reach another's.
 * Moving between states is done by changing the state (logging in or out, or the programme status
 * changing after a payment), which swaps the whole navigator and drops the old history.
 */

/** Signed in, no programme bought yet: the funnel from Welcome to Checkout, plus Profile to log out. */
function OnboardingNavigator() {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={screenOptions}>
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="Quiz" component={Quiz} />
      <Stack.Screen name="Match" component={Match} />
      <Stack.Screen name="Plans" component={Plans} />
      <Stack.Screen name="Consent" component={Consent} />
      <Stack.Screen name="Checkout" component={Checkout} />
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
}

/** Bought a programme: the post-purchase intake and the app itself. */
function MemberNavigator({ initialRouteName }: { initialRouteName: MemberStartRoute }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={screenOptions}>
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

/** Picks onboarding or member from the programme status, which is refreshed after a payment. */
function SignedIn() {
  const programme = useProgrammeStatus();
  const { signOut } = useAuth();
  const { data } = useAppState();

  if (!programme.data) {
    // Until the status loads there's no state to show, so a failure must still let the user out.
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 8, backgroundColor: colors.cream }}>
        <ResourceState resource={programme} />
        {programme.error && <TextButton label="Log out" onPress={() => void signOut()} />}
      </View>
    );
  }

  return stageFor(programme.data.status) === "onboarding" ? (
    <OnboardingNavigator />
  ) : (
    <MemberNavigator initialRouteName={memberStartRoute(data.paymentId)} />
  );
}

export default function RootNavigator() {
  const { status } = useAuth();

  // The splash covers the screen while the stored session loads.
  if (status === "loading") return null;
  if (status === "signedIn") return <SignedIn />;

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Login" component={Login} options={{ animationTypeForReplace: "pop" }} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
}
