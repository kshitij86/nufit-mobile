import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MemberStartRoute, RootStackParamList } from "./types";
import { memberStartRoute, stageFor } from "./flow";
import Login from "../screens/Login";
import EmailLogin from "../screens/EmailLogin";
import Register from "../screens/Register";
import Welcome from "../screens/Welcome";
import Quiz from "../screens/Quiz";
import Match from "../screens/Match";
import Plans from "../screens/Plans";
import Consent from "../screens/Consent";
import AlmostThere from "../screens/AlmostThere";
import Checkout from "../screens/Checkout";
import Questionnaire from "../screens/Questionnaire";
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
import { ProgrammeState, useProgrammeStatus } from "../services/journey";
import { useQuestionnaire } from "../services/questionnaire";
import ResourceState from "../components/ResourceState";
import { Resource } from "../services/resource";
import { TextButton } from "../components/PillButton";
import { useAppState } from "../state/AppState";
import { colors } from "../theme/colors";

const Stack = createNativeStackNavigator<RootStackParamList>();
const screenOptions = { headerShown: false, animation: "slide_from_right" } as const;

/*
 * Each state's navigator sits in its own route of this outer stack. Swapping the navigator alone
 * isn't enough: the container keeps the old navigator's stack and hands it to the new one, which
 * keeps every route it also has. So sending the questionnaire reopened the member app on its own
 * Questionnaire screen (as an edit) instead of Today. Replacing the outer route drops the old
 * state's history with it.
 */
const Stage = createNativeStackNavigator();
const stageOptions = { headerShown: false, animation: "none" } as const;

function StageRoot({ name, children }: { name: string; children: () => React.ReactElement }) {
  return (
    <Stage.Navigator screenOptions={stageOptions}>
      <Stage.Screen name={name}>{children}</Stage.Screen>
    </Stage.Navigator>
  );
}

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
      <Stack.Screen name="Checkout" component={Checkout} />
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
}

/**
 * Bought a programme but hasn't sent the questionnaire: "almost there", the consent, then the
 * questionnaire, plus Profile to log out. The plan can't be written without them. Someone who has
 * already signed (say, they left halfway) goes straight back to the questionnaire.
 */
function QuestionnaireNavigator({ consented }: { consented: boolean }) {
  return (
    <Stack.Navigator initialRouteName={consented ? "Questionnaire" : "AlmostThere"} screenOptions={screenOptions}>
      <Stack.Screen name="AlmostThere" component={AlmostThere} />
      <Stack.Screen name="Consent" component={Consent} />
      <Stack.Screen name="Questionnaire" component={Questionnaire} />
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
}

/** Bought a programme and sent the questionnaire: the app itself. */
function MemberNavigator({ initialRouteName }: { initialRouteName: MemberStartRoute }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={screenOptions}>
      <Stack.Screen name="Questionnaire" component={Questionnaire} />
      <Stack.Screen name="Consent" component={Consent} />
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

/** Picks onboarding, questionnaire or member from the programme and questionnaire status. */
function SignedIn() {
  const programme = useProgrammeStatus();
  const { signOut } = useAuth();
  const { data } = useAppState();
  const bought = !!programme.data && programme.data.status !== "none";
  // Only members who bought can open the questionnaire, so only they load it.
  return bought ? (
    <Bought status={programme.data!.status} afterQuestionnaire={data.afterQuestionnaire} signOut={signOut} />
  ) : programme.data ? (
    <StageRoot name="OnboardingStage">{() => <OnboardingNavigator />}</StageRoot>
  ) : (
    <Loading resource={programme} signOut={signOut} />
  );
}

function Bought({ status, afterQuestionnaire, signOut }: {
  status: ProgrammeState;
  afterQuestionnaire: MemberStartRoute | null;
  signOut: () => Promise<void>;
}) {
  const questionnaire = useQuestionnaire();
  if (!questionnaire.data) return <Loading resource={questionnaire} signOut={signOut} />;
  const consented = !!questionnaire.data.consent;
  return stageFor(status, !!questionnaire.data.submittedAt) === "questionnaire" ? (
    <StageRoot name="QuestionnaireStage">{() => <QuestionnaireNavigator consented={consented} />}</StageRoot>
  ) : (
    <StageRoot name="MemberStage">
      {() => <MemberNavigator initialRouteName={memberStartRoute(afterQuestionnaire)} />}
    </StageRoot>
  );
}

function Loading({ resource, signOut }: { resource: Resource<unknown>; signOut: () => Promise<void> }) {
  // Until the status loads there's no state to show, so a failure must still let the user out.
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 8, backgroundColor: colors.cream }}>
      <ResourceState resource={resource} />
      {resource.error && <TextButton label="Log out" onPress={() => void signOut()} />}
    </View>
  );
}

export default function RootNavigator() {
  const { status } = useAuth();

  // The splash covers the screen while the stored session loads.
  if (status === "loading") return null;
  if (status === "signedIn") return <SignedIn />;

  return (
    <StageRoot name="LoggedOutStage">
      {() => (
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Login" component={Login} options={{ animationTypeForReplace: "pop" }} />
          <Stack.Screen name="EmailLogin" component={EmailLogin} />
          <Stack.Screen name="Register" component={Register} />
        </Stack.Navigator>
      )}
    </StageRoot>
  );
}
