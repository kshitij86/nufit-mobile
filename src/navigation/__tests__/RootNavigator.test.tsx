/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories run before imports, so they must require(). */
import React from "react";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import { createNavigationContainerRef, NavigationContainer } from "@react-navigation/native";
import RootNavigator from "../RootNavigator";
import { RootStackParamList } from "../types";
import { useAuth } from "../../state/Auth";
import { useAppState } from "../../state/AppState";
import { ProgrammeState, useProgrammeStatus } from "../../services/journey";
import { Resource } from "../../services/resource";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../state/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("../../state/AppState", () => ({ useAppState: jest.fn() }));
jest.mock("../../services/journey", () => ({ useProgrammeStatus: jest.fn() }));

// Screens are stubs: these tests are about which screens each state can reach, not their content.
jest.mock("../../screens/Login", () => require("../../test/screenStub").screenStub("Login"));
jest.mock("../../screens/Register", () => require("../../test/screenStub").screenStub("Register"));
jest.mock("../../screens/Welcome", () => require("../../test/screenStub").screenStub("Welcome"));
jest.mock("../../screens/Quiz", () => require("../../test/screenStub").screenStub("Quiz"));
jest.mock("../../screens/Match", () => require("../../test/screenStub").screenStub("Match"));
jest.mock("../../screens/Plans", () => require("../../test/screenStub").screenStub("Plans"));
jest.mock("../../screens/Consent", () => require("../../test/screenStub").screenStub("Consent"));
jest.mock("../../screens/Checkout", () => require("../../test/screenStub").screenStub("Checkout"));
jest.mock("../../screens/Intake", () => require("../../test/screenStub").screenStub("Intake"));
jest.mock("../../screens/Gender", () => require("../../test/screenStub").screenStub("Gender"));
jest.mock("../../screens/Measure", () => require("../../test/screenStub").screenStub("Measure"));
jest.mock("../../screens/MeasureDone", () => require("../../test/screenStub").screenStub("MeasureDone"));
jest.mock("../../screens/Mood", () => require("../../test/screenStub").screenStub("Mood"));
jest.mock("../MainTabs", () => require("../../test/screenStub").screenStub("MainTabs"));
jest.mock("../../screens/Player", () => require("../../test/screenStub").screenStub("Player"));
jest.mock("../../screens/Recipe", () => require("../../test/screenStub").screenStub("Recipe"));
jest.mock("../../screens/Sleep", () => require("../../test/screenStub").screenStub("Sleep"));
jest.mock("../../screens/Circle", () => require("../../test/screenStub").screenStub("Circle"));
jest.mock("../../screens/Milestones", () => require("../../test/screenStub").screenStub("Milestones"));
jest.mock("../../screens/Streak", () => require("../../test/screenStub").screenStub("Streak"));
jest.mock("../../screens/Reminders", () => require("../../test/screenStub").screenStub("Reminders"));
jest.mock("../../screens/Profile", () => require("../../test/screenStub").screenStub("Profile"));

type Route = keyof RootStackParamList;

const LOGGED_OUT: Route[] = ["Login", "Register"];
const ONBOARDING: Route[] = ["Welcome", "Quiz", "Match", "Plans", "Consent", "Checkout", "Profile"];
const MEMBER: Route[] = [
  "Intake", "Gender", "Measure", "MeasureDone", "Mood", "MainTabs", "Player", "Recipe",
  "Sleep", "Circle", "Milestones", "Streak", "Reminders", "Profile",
];
const ALL: Route[] = [...new Set([...LOGGED_OUT, ...ONBOARDING, ...MEMBER])];

const signOut = jest.fn(async () => {});
const reload = jest.fn();
let authStatus: "loading" | "signedOut" | "signedIn";
let programme: Resource<{ status: ProgrammeState }>;
let paymentId: string | null;

const loaded = (status: ProgrammeState) => ({ data: { status }, error: null, loading: false, reload });

beforeEach(() => {
  jest.clearAllMocks();
  authStatus = "signedIn";
  programme = loaded("none");
  paymentId = null;
  jest.mocked(useAuth).mockImplementation(() => ({ status: authStatus, signOut }) as unknown as ReturnType<typeof useAuth>);
  jest.mocked(useProgrammeStatus).mockImplementation(() => programme as unknown as ReturnType<typeof useProgrammeStatus>);
  jest.mocked(useAppState).mockImplementation(() => ({ data: { paymentId } }) as unknown as ReturnType<typeof useAppState>);
});

const nav = createNavigationContainerRef<RootStackParamList>();
const app = () => (
  <NavigationContainer ref={nav}>
    <RootNavigator />
  </NavigationContainer>
);
const current = () => nav.getCurrentRoute()?.name;

const params: Partial<Record<Route, object>> = { Player: { sessionId: "s1" }, Recipe: { recipeId: "r1" } };

/** Tries to open `route` from wherever the app is, as any screen's navigate() call would. */
async function tryOpen(route: Route) {
  // React Navigation logs (in development) when no navigator has the route; that's the point here.
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  await act(async () => {
    (nav.navigate as (name: Route, p?: object) => void)(route, params[route]);
  });
  error.mockRestore();
}

/** Opens each route from the starting screen and returns the ones that actually opened. */
async function reachable(start: Route): Promise<Route[]> {
  const opened: Route[] = [];
  for (const route of ALL) {
    await act(async () => nav.resetRoot({ index: 0, routes: [{ name: start }] }));
    await tryOpen(route);
    if (current() === route) opened.push(route);
  }
  return opened.sort();
}

describe("RootNavigator", () => {
  test("logged out: only Login and Register exist", async () => {
    authStatus = "signedOut";
    await render(app());
    expect(current()).toBe("Login");
    expect(await reachable("Login")).toEqual([...LOGGED_OUT].sort());
  });

  test("still loading the session: renders nothing, so no screen is reachable", async () => {
    authStatus = "loading";
    await render(app());
    expect(current()).toBeUndefined();
  });

  test("signed in without a programme: opens on Welcome and only reaches the purchase funnel", async () => {
    programme = loaded("none");
    await render(app());
    expect(current()).toBe("Welcome");
    expect(await reachable("Welcome")).toEqual([...ONBOARDING].sort());
  });

  test.each<ProgrammeState>(["awaiting_plan", "scheduled", "active", "completed"])(
    "member (%s): opens on the app and can't reach the purchase funnel",
    async (status) => {
      programme = loaded(status);
      await render(app());
      expect(current()).toBe("MainTabs");
      expect(await reachable("MainTabs")).toEqual([...MEMBER].sort());
    }
  );

  test("paying moves to the member app on Intake, with no way back to Checkout", async () => {
    await render(app());
    await tryOpen("Quiz");
    await tryOpen("Match");
    await tryOpen("Consent");
    await tryOpen("Checkout");
    expect(current()).toBe("Checkout");

    // What Checkout does on a verified payment: records it, then the programme status refreshes.
    paymentId = "pay_123";
    programme = loaded("awaiting_plan");
    await screen.rerender(app());

    expect(current()).toBe("Intake");
    // Android's back button only pops when the navigator can go back; at the root it leaves the app.
    expect(nav.canGoBack()).toBe(false);
    await tryOpen("Checkout");
    expect(current()).toBe("Intake");
  });

  test("logging out from either signed-in state drops all of its history", async () => {
    programme = loaded("active");
    await render(app());
    await tryOpen("Recipe");
    expect(current()).toBe("Recipe");

    authStatus = "signedOut";
    await screen.rerender(app());
    expect(current()).toBe("Login");
    expect(nav.canGoBack()).toBe(false);
    await tryOpen("MainTabs");
    expect(current()).toBe("Login");
  });

  test("while the programme status loads, no signed-in screen is shown", async () => {
    programme = { data: undefined, error: null, loading: true, reload };
    await render(app());
    expect(current()).toBeUndefined();
    expect(screen.queryByText("Log out")).toBeNull();
  });

  test("if the programme status fails to load, the user can retry or log out", async () => {
    programme = { data: undefined, error: "Not Found", loading: false, reload };
    await render(app());
    expect(current()).toBeUndefined();
    expect(screen.getByText(/Not Found/)).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(screen.getByText("Try again"));
    expect(reload).toHaveBeenCalled();
    await user.press(screen.getByText("Log out"));
    expect(signOut).toHaveBeenCalled();
  });

  test("a failed refresh keeps the member on their current screen", async () => {
    programme = loaded("active");
    await render(app());
    await tryOpen("Sleep");

    programme = { data: { status: "active" }, error: "Couldn't load your programme.", loading: false, reload };
    await screen.rerender(app());
    expect(current()).toBe("Sleep");
  });
});
