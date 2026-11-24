/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories run before imports, so they must require(). */
import React from "react";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import { BackHandler } from "react-native";
import { createNavigationContainerRef, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Login from "../Login";
import { RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../state/Auth";
import { sendLoginOtp } from "../../services/session";
import { ApiError } from "../../services/http";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../state/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("../../services/session", () => ({ sendLoginOtp: jest.fn() }));
jest.mock("../EmailLogin", () => require("../../test/screenStub").screenStub("EmailLogin"));
jest.mock("../Register", () => require("../../test/screenStub").screenStub("Register"));

const EmailLogin = require("../EmailLogin").default;
const Register = require("../Register").default;

const Stack = createNativeStackNavigator<RootStackParamList>();
const nav = createNavigationContainerRef<RootStackParamList>();
const signInWithOtp = jest.fn<Promise<void>, [string, string]>();
const send = jest.mocked(sendLoginOtp);
const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

async function open() {
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <NavigationContainer ref={nav}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="EmailLogin" component={EmailLogin} />
          <Stack.Screen name="Register" component={Register} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

async function sendCodeTo(number: string) {
  const u = user();
  await u.type(screen.getByPlaceholderText("98765 43210"), number);
  await u.press(screen.getByText("Send code"));
  return u;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  send.mockResolvedValue(undefined);
  signInWithOtp.mockResolvedValue(undefined);
  jest.mocked(useAuth).mockReturnValue({ signInWithOtp } as unknown as ReturnType<typeof useAuth>);
});

afterEach(() => {
  jest.useRealTimers();
});

test("sends the code to the E.164 number and asks for it, without promising SMS", async () => {
  await open();
  await sendCodeTo("98765 43210");

  expect(send).toHaveBeenCalledWith("+919876543210");
  expect(screen.getByText("We've sent a code to +91 98765 43210 by SMS or call.")).toBeOnTheScreen();
});

test("checks the number before sending", async () => {
  await open();
  await sendCodeTo("98765");
  expect(send).not.toHaveBeenCalled();
  expect(screen.getByText("Enter all 10 digits of your mobile number.")).toBeOnTheScreen();
});

test("India is picked by default; picking another country fills in its code", async () => {
  await open();
  const u = user();
  await u.press(screen.getByLabelText("Country: India +91"));
  await u.type(screen.getByLabelText("Search countries"), "united k");
  expect(screen.queryByLabelText("India +91")).toBeNull();
  await u.press(screen.getByLabelText("United Kingdom +44"));

  expect(screen.getByLabelText("Country: United Kingdom +44")).toBeOnTheScreen();
  await u.type(screen.getByPlaceholderText("Mobile number"), "07700900123");
  await u.press(screen.getByText("Send code"));
  expect(send).toHaveBeenCalledWith("+447700900123");
});

test("the country list can be searched by dial code and closed without changing the country", async () => {
  await open();
  const u = user();
  await u.press(screen.getByLabelText("Country: India +91"));
  await u.type(screen.getByLabelText("Search countries"), "+971");
  expect(screen.getByLabelText("United Arab Emirates +971")).toBeOnTheScreen();
  await u.press(screen.getByLabelText("Close"));
  expect(screen.getByLabelText("Country: India +91")).toBeOnTheScreen();
});

test("logging in with the code signs in with the number it was sent to", async () => {
  await open();
  const u = await sendCodeTo("9876543210");
  await u.type(screen.getByPlaceholderText("Enter the code"), "565059");
  await u.press(screen.getByText("Log in"));
  expect(signInWithOtp).toHaveBeenCalledWith("+919876543210", "565059");
});

test("resending is disabled for 60 seconds after each send", async () => {
  await open();
  const u = await sendCodeTo("9876543210");
  expect(screen.getByText("Resend code in 1:00")).toBeOnTheScreen();

  await act(async () => jest.advanceTimersByTime(30_000));
  expect(screen.getByText("Resend code in 0:30")).toBeOnTheScreen();
  await u.press(screen.getByText("Resend code in 0:30"));
  expect(send).toHaveBeenCalledTimes(1);

  await act(async () => jest.advanceTimersByTime(30_000));
  await u.press(screen.getByText("Resend code"));
  expect(send).toHaveBeenCalledTimes(2);
  expect(screen.getByText("We've sent a new code to +91 98765 43210.")).toBeOnTheScreen();
  expect(screen.getByText("Resend code in 1:00")).toBeOnTheScreen();
});

test("a wrong code is shown on the field and cleared for another try", async () => {
  signInWithOtp.mockRejectedValueOnce(new ApiError("The code is incorrect.", 400));
  await open();
  const u = await sendCodeTo("9876543210");
  await u.type(screen.getByPlaceholderText("Enter the code"), "111111");
  await u.press(screen.getByText("Log in"));

  expect(screen.getByText("The code is incorrect.")).toBeOnTheScreen();
  expect(screen.getByPlaceholderText("Enter the code")).toHaveDisplayValue("");
});

test("a locked number disables the code until the lock lifts", async () => {
  signInWithOtp.mockRejectedValueOnce(
    new ApiError("Too many tries for this phone number. Try again later.", 429)
  );
  await open();
  const u = await sendCodeTo("9876543210");
  await u.type(screen.getByPlaceholderText("Enter the code"), "111111");
  await u.press(screen.getByText("Log in"));

  expect(screen.getByText("Too many tries for this phone number. Try again later.")).toBeOnTheScreen();
  expect(screen.getByPlaceholderText("Enter the code").props.editable).toBe(false);
  await u.press(screen.getByText("Log in"));
  expect(signInWithOtp).toHaveBeenCalledTimes(1);
});

test("with no account for the number, offers to sign up with it filled in", async () => {
  send.mockRejectedValueOnce(new ApiError("No account uses this phone number. Sign up first.", 404));
  await open();
  const u = await sendCodeTo("9876543210");

  expect(screen.getByText("No account uses this phone number. Sign up first.")).toBeOnTheScreen();
  await u.press(screen.getByText("Create an account with this number"));
  expect(nav.getCurrentRoute()).toMatchObject({ name: "Register", params: { country: "IN", phone: "9876543210" } });
});

test("other send errors show the server's message and stay on the number", async () => {
  send.mockRejectedValueOnce(
    new ApiError("More than one account uses this number. Log in with your email instead.", 409)
  );
  await open();
  await sendCodeTo("9876543210");
  expect(screen.getByText("More than one account uses this number. Log in with your email instead.")).toBeOnTheScreen();
  expect(screen.queryByText("Create an account with this number")).toBeNull();
  expect(screen.getByText("Log in with email and password")).toBeOnTheScreen();
});

test("phone comes first, then email and password", async () => {
  await open();
  const labels = ["Send code", "Log in with email and password"];
  const order = labels.map((label) => screen.getByText(label));
  expect(order.map((el) => el.props.children)).toEqual(labels);

  expect(screen.queryByText(/email code/i)).toBeNull();

  await user().press(screen.getByText("Log in with email and password"));
  expect(nav.getCurrentRoute()?.name).toBe("EmailLogin");
});

test("back from the code step returns to the number, which can be changed", async () => {
  await open();
  const u = await sendCodeTo("9876543210");

  await u.press(screen.getByLabelText("Go back"));
  expect(screen.getByPlaceholderText("98765 43210")).toHaveDisplayValue("9876543210");
  expect(screen.queryByPlaceholderText("Enter the code")).toBeNull();
});

test("Android's back button on the code step goes back to the number instead of closing the app", async () => {
  type Listener = Parameters<typeof BackHandler.addEventListener>[1];
  const listeners: Listener[] = [];
  jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, handler) => {
    listeners.push(handler);
    return { remove: () => listeners.splice(listeners.indexOf(handler), 1) && undefined };
  });
  await open();
  const before = listeners.length; // React Navigation's own listener
  await sendCodeTo("9876543210");
  expect(listeners).toHaveLength(before + 1);

  // Android calls the most recently added listener first and stops at the first that returns true.
  let handled: boolean | null | undefined;
  await act(async () => {
    handled = listeners[listeners.length - 1]({} as Parameters<Listener>[0]);
  });
  expect(handled).toBe(true);
  expect(screen.getByPlaceholderText("98765 43210")).toBeOnTheScreen();
  expect(listeners).toHaveLength(before);
});
