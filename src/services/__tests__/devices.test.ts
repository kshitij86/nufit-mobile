import { API_HOST } from "../../config";
import { logIn, logOut } from "../session";
import { getInstallationId, registerDevice, sendTestPush, unregisterDevice } from "../devices";
import { FetchMock, jsonResponse, mockFetch, requestOf, tokens } from "../../test/fetchMock";

jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
  };
});

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "3f9c2b7e-1a4d-4c2b-9e8f-0a1b2c3d4e5f") }));

const INSTALLATION = "3f9c2b7e-1a4d-4c2b-9e8f-0a1b2c3d4e5f";
const DEVICES = `${API_HOST}/api/v1/devices`;

let fetchMock: FetchMock;

beforeEach(async () => {
  await logOut();
  fetchMock = mockFetch();
  fetchMock.mockResolvedValueOnce(jsonResponse(200, tokens("1")));
  await logIn("priya@example.com", "secret");
  fetchMock.mockReset();
});

test("keeps one installation id per install", async () => {
  await expect(getInstallationId()).resolves.toBe(INSTALLATION);
  await expect(getInstallationId()).resolves.toBe(INSTALLATION);
  expect(jest.requireMock("expo-crypto").randomUUID).toHaveBeenCalledTimes(1);
});

test("registers the FCM token under this phone's installation id", async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse(204, undefined));

  await registerDevice("android", "fcm-token");

  expect(requestOf(fetchMock, 0)).toEqual({
    url: `${DEVICES}/${INSTALLATION}`,
    method: "PUT",
    authorization: "Bearer access-1",
    body: { platform: "android", push_token: "fcm-token" },
  });
});

test("reports a failed registration", async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse(502, { detail: "Couldn't turn on notifications. Please try again." }));

  await expect(registerDevice("android", "fcm-token")).rejects.toThrow("Couldn't turn on notifications");
});

test("unregistering sends the delete with the current session and ignores failures", async () => {
  fetchMock.mockRejectedValueOnce(new Error("offline"));

  await expect(unregisterDevice()).resolves.toBeUndefined();

  expect(requestOf(fetchMock, 0)).toMatchObject({
    url: `${DEVICES}/${INSTALLATION}`,
    method: "DELETE",
    authorization: "Bearer access-1",
  });
});

test("unregistering doesn't hold up sign-out", async () => {
  fetchMock.mockReturnValueOnce(new Promise(() => {}));

  await expect(unregisterDevice()).resolves.toBeUndefined();
});

test("asks for a test push", async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse(200, { message: "Test notification sent." }));

  await sendTestPush();

  expect(requestOf(fetchMock, 0)).toMatchObject({ url: `${DEVICES}/test-push`, method: "POST" });
});
