import * as SecureStore from "expo-secure-store";
import { API_HOST } from "../../config";
import { ApiError } from "../http";
import {
  authPost,
  loadSession,
  logIn,
  logOut,
  onSessionExpired,
  register,
  revokeSession,
  SessionExpiredError,
} from "../session";
import { FetchMock, jsonResponse, mockFetch, requestOf, tokens } from "../../test/fetchMock";

jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
  };
});

const URL = `${API_HOST}/api/v1/payments/orders`;
let fetchMock: FetchMock;

beforeEach(async () => {
  await logOut();
  fetchMock = mockFetch();
  fetchMock.mockResolvedValueOnce(jsonResponse(200, tokens("1")));
  await logIn("priya@example.com", "secret");
  fetchMock.mockReset();
});

test("logIn posts credentials and persists both tokens", async () => {
  await logOut();
  fetchMock.mockClear();
  fetchMock.mockResolvedValueOnce(jsonResponse(200, tokens("2")));
  await logIn("priya@example.com", "secret");

  expect(requestOf(fetchMock, 0)).toMatchObject({
    url: `${API_HOST}/api/v1/auth/login`,
    method: "POST",
    authorization: undefined,
    body: { email: "priya@example.com", password: "secret" },
  });
  expect(await SecureStore.getItemAsync("nufit.accessToken")).toBe("access-2");
  expect(await SecureStore.getItemAsync("nufit.refreshToken")).toBe("refresh-2");
  expect(await loadSession()).toBe(true);
});

test("logIn surfaces the server's detail message on bad credentials", async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse(401, { detail: "Incorrect email or password" }));
  await expect(logIn("priya@example.com", "wrong")).rejects.toThrow("Incorrect email or password");
});

test("sends the bearer token", async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));
  await expect(authPost(URL, { a: 1 })).resolves.toEqual({ ok: true });
  expect(requestOf(fetchMock, 0).authorization).toBe("Bearer access-1");
});

test("on 401, refreshes once, stores the new pair and retries with the new token", async () => {
  fetchMock
    .mockResolvedValueOnce(jsonResponse(401, { detail: "Token expired" }))
    .mockResolvedValueOnce(jsonResponse(200, tokens("2")))
    .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

  await expect(authPost(URL, { a: 1 })).resolves.toEqual({ ok: true });

  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(requestOf(fetchMock, 1)).toMatchObject({
    url: `${API_HOST}/api/v1/auth/refresh`,
    authorization: undefined,
    body: { refresh_token: "refresh-1" },
  });
  expect(requestOf(fetchMock, 2)).toMatchObject({ url: URL, authorization: "Bearer access-2", body: { a: 1 } });
  expect(await SecureStore.getItemAsync("nufit.accessToken")).toBe("access-2");
  expect(await SecureStore.getItemAsync("nufit.refreshToken")).toBe("refresh-2");
});

test("concurrent 401s share a single refresh", async () => {
  fetchMock.mockImplementation(async (url, init) => {
    if (url.endsWith("/auth/refresh")) return jsonResponse(200, tokens("2"));
    const auth = (init.headers as Record<string, string>).Authorization;
    return auth === "Bearer access-2" ? jsonResponse(200, { ok: true }) : jsonResponse(401, { detail: "expired" });
  });

  await Promise.all([authPost(URL, {}), authPost(URL, {})]);
  expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/auth/refresh"))).toHaveLength(1);
});

test("signs out when the refresh is rejected", async () => {
  const expired = jest.fn();
  const unsubscribe = onSessionExpired(expired);
  fetchMock
    .mockResolvedValueOnce(jsonResponse(401, { detail: "Token expired" }))
    .mockResolvedValueOnce(jsonResponse(401, { detail: "Invalid refresh token" }));

  await expect(authPost(URL, {})).rejects.toBeInstanceOf(SessionExpiredError);

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(expired).toHaveBeenCalledTimes(1);
  expect(await loadSession()).toBe(false);
  unsubscribe();
});

test("signs out when the retry is also unauthorised, without refreshing again", async () => {
  const expired = jest.fn();
  const unsubscribe = onSessionExpired(expired);
  fetchMock
    .mockResolvedValueOnce(jsonResponse(401, { detail: "Token expired" }))
    .mockResolvedValueOnce(jsonResponse(200, tokens("2")))
    .mockResolvedValueOnce(jsonResponse(401, { detail: "Not authenticated" }));

  await expect(authPost(URL, {})).rejects.toBeInstanceOf(SessionExpiredError);

  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(expired).toHaveBeenCalledTimes(1);
  unsubscribe();
});

test("keeps the session when refresh fails on the network", async () => {
  fetchMock
    .mockResolvedValueOnce(jsonResponse(401, { detail: "Token expired" }))
    .mockRejectedValueOnce(new TypeError("Network request failed"));

  await expect(authPost(URL, {})).rejects.toThrow("Couldn't reach Nufit");
  expect(await loadSession()).toBe(true);
});

test("logOut clears tokens and revokes the refresh token", async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse(200, { message: "Logged out" }));
  await logOut();

  expect(requestOf(fetchMock, 0)).toMatchObject({
    url: `${API_HOST}/api/v1/auth/logout`,
    authorization: "Bearer access-1",
    body: { refresh_token: "refresh-1" },
  });
  expect(await loadSession()).toBe(false);
});

test("revokeSession refreshes and revokes the new refresh token when the access token has expired", async () => {
  fetchMock
    .mockResolvedValueOnce(jsonResponse(401, { detail: "Token expired" }))
    .mockResolvedValueOnce(jsonResponse(200, tokens("2")))
    .mockResolvedValueOnce(jsonResponse(200, { message: "Logged out" }));

  await revokeSession("access-1", "refresh-1");

  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(requestOf(fetchMock, 1)).toMatchObject({
    url: `${API_HOST}/api/v1/auth/refresh`,
    body: { refresh_token: "refresh-1" },
  });
  expect(requestOf(fetchMock, 2)).toMatchObject({
    url: `${API_HOST}/api/v1/auth/logout`,
    authorization: "Bearer access-2",
    body: { refresh_token: "refresh-2" },
  });
});

test("revokeSession gives up quietly when the refresh token is already invalid", async () => {
  fetchMock
    .mockResolvedValueOnce(jsonResponse(401, { detail: "Token expired" }))
    .mockResolvedValueOnce(jsonResponse(401, { detail: "Invalid refresh token" }));

  await expect(revokeSession("access-1", "refresh-1")).resolves.toBeUndefined();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("logOut still signs out locally when revocation fails", async () => {
  fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));
  await expect(logOut()).resolves.toBeUndefined();
  expect(await loadSession()).toBe(false);
});

describe("register", () => {
  const request = {
    email: "priya@example.com",
    first_name: "Priya",
    last_name: "Sharma",
    phone_number: "+919876543210",
    date_of_birth: "1992-04-15",
    gender: "female" as const,
    password: "Str0ng!pass",
    password_confirm: "Str0ng!pass",
  };

  test("posts the account details without a token", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { id: "u1", email: request.email }));
    await register(request);
    expect(requestOf(fetchMock, 0)).toEqual({
      url: `${API_HOST}/api/v1/auth/register`,
      method: "POST",
      authorization: undefined,
      body: request,
    });
  });

  test("maps 422 validation errors to fields", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(422, {
        detail: [
          { type: "value_error", loc: ["body", "phone_number"], msg: "Value error, Invalid phone number." },
          { type: "value_error", loc: ["body", "password"], msg: "Value error, Password must contain at least one digit." },
          { type: "value_error", loc: ["body"], msg: "Value error, Passwords do not match." },
        ],
      })
    );
    const error = (await register(request).catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.message).toBe("Couldn't create your account. Please try again.");
    expect(error.fieldErrors).toEqual({
      phone_number: "Invalid phone number.",
      password: "Password must contain at least one digit.",
      body: "Passwords do not match.",
    });
  });

  test("surfaces a string detail, e.g. an email already in use", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(409, { detail: "Email already registered" }));
    await expect(register(request)).rejects.toThrow("Email already registered");
  });
});
