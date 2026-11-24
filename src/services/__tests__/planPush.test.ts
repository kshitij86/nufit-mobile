import { TODAY_PLAN_RESOURCE_KEY } from "../diet";
import { PROGRAMME_RESOURCE_KEY } from "../journey";
import { WEEK_SESSIONS_RESOURCE_KEY } from "../workouts";
import { invalidate } from "../resource";
import { navigationRef } from "../../navigation/navigationRef";
import { handlePushOpened, handlePushReceived, isPlanApprovedPush, openPendingToday } from "../planPush";

jest.mock("../resource", () => ({ ...jest.requireActual("../resource"), invalidate: jest.fn() }));
jest.mock("../../navigation/navigationRef", () => ({
  navigationRef: { isReady: jest.fn(), getRootState: jest.fn(), navigate: jest.fn() },
}));

const nav = jest.mocked(navigationRef);
const PLAN_APPROVED = { type: "plan_approved", status: "published" };

function memberScreensReady(ready: boolean) {
  nav.isReady.mockReturnValue(ready);
  nav.getRootState.mockReturnValue(
    (ready ? { routeNames: ["MainTabs", "Profile"] } : undefined) as ReturnType<typeof navigationRef.getRootState>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  memberScreensReady(true);
});

test("recognises only the plan-approved push", () => {
  expect(isPlanApprovedPush(PLAN_APPROVED)).toBe(true);
  expect(isPlanApprovedPush({ type: "something_else" })).toBe(false);
  expect(isPlanApprovedPush(undefined)).toBe(false);
  expect(isPlanApprovedPush("plan_approved")).toBe(false);
});

test("a plan-approved push arriving refreshes the plan without navigating", () => {
  handlePushReceived(PLAN_APPROVED);

  expect(jest.mocked(invalidate).mock.calls.map(([key]) => key)).toEqual([
    PROGRAMME_RESOURCE_KEY,
    TODAY_PLAN_RESOURCE_KEY,
    WEEK_SESSIONS_RESOURCE_KEY,
  ]);
  expect(nav.navigate).not.toHaveBeenCalled();
});

test("other pushes are ignored", () => {
  handlePushReceived({ type: "test" });
  handlePushOpened({ type: "test" });

  expect(invalidate).not.toHaveBeenCalled();
  expect(nav.navigate).not.toHaveBeenCalled();
});

test("tapping a plan-approved push refreshes the plan and opens Today", () => {
  handlePushOpened(PLAN_APPROVED);

  expect(invalidate).toHaveBeenCalledWith(PROGRAMME_RESOURCE_KEY);
  expect(nav.navigate).toHaveBeenCalledWith("MainTabs", { screen: "Today" });
});

test("a tap before the member screens exist opens Today once they do", () => {
  memberScreensReady(false);
  handlePushOpened(PLAN_APPROVED);
  expect(nav.navigate).not.toHaveBeenCalled();

  memberScreensReady(true);
  openPendingToday();
  openPendingToday();

  expect(nav.navigate).toHaveBeenCalledTimes(1);
  expect(nav.navigate).toHaveBeenCalledWith("MainTabs", { screen: "Today" });
});
