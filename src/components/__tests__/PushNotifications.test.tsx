import React from "react";
import { AppState, AppStateStatus } from "react-native";
import { act, render, waitFor } from "@testing-library/react-native";
import PushNotifications from "../PushNotifications";
import { useAuth } from "../../state/Auth";
import { startPushNotifications } from "../../services/push";

jest.mock("../../state/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("../../services/pushSupport", () => ({ pushSupported: true }));
jest.mock("../../services/push", () => ({ startPushNotifications: jest.fn() }));

const start = jest.mocked(startPushNotifications);
let appStateListener: ((state: AppStateStatus) => void) | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  appStateListener = null;
  jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
    appStateListener = listener as (state: AppStateStatus) => void;
    return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
  jest.mocked(useAuth).mockReturnValue({ status: "signedIn" } as ReturnType<typeof useAuth>);
});

// Lets the component's start-up promise chain finish.
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));

async function returnToApp() {
  await act(async () => appStateListener?.("active"));
  await settle();
}

test("asks for permission when signed in", async () => {
  start.mockResolvedValue({ granted: false, stop: jest.fn() });
  await render(<PushNotifications />);

  await waitFor(() => expect(start).toHaveBeenCalledWith({ prompt: true }));
});

test("coming back without permission checks again without asking", async () => {
  start.mockResolvedValue({ granted: false, stop: jest.fn() });
  await render(<PushNotifications />);
  await settle();

  await returnToApp();

  expect(start).toHaveBeenLastCalledWith({ prompt: false });
  expect(start).toHaveBeenCalledTimes(2);
});

test("once registered, coming back doesn't start again", async () => {
  start.mockResolvedValue({ granted: true, stop: jest.fn() });
  await render(<PushNotifications />);
  await settle();

  await returnToApp();

  expect(start).toHaveBeenCalledTimes(1);
});

test("does nothing while signed out", async () => {
  jest.mocked(useAuth).mockReturnValue({ status: "signedOut" } as ReturnType<typeof useAuth>);
  await render(<PushNotifications />);
  await settle();

  expect(start).not.toHaveBeenCalled();
});
