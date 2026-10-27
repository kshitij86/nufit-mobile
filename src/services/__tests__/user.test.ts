import { API_HOST } from "../../config";
import { logIn, logOut } from "../session";
import { fetchCurrentUser } from "../user";
import { FetchMock, jsonResponse, mockFetch, requestOf, tokens } from "../../test/fetchMock";

jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
  };
});

let fetchMock: FetchMock;

beforeEach(async () => {
  await logOut();
  fetchMock = mockFetch();
  fetchMock.mockResolvedValueOnce(jsonResponse(200, tokens("1")));
  await logIn("priya@example.com", "secret");
  fetchMock.mockReset();
});

test("loads the signed-in user's name from /users/me", async () => {
  fetchMock.mockResolvedValueOnce(
    jsonResponse(200, { email: "priya@example.com", first_name: " Priya ", last_name: "Sharma", id: "u1" })
  );

  await expect(fetchCurrentUser()).resolves.toEqual({
    email: "priya@example.com",
    firstName: "Priya",
    lastName: "Sharma",
    fullName: "Priya Sharma",
  });
  expect(requestOf(fetchMock, 0)).toMatchObject({
    url: `${API_HOST}/api/v1/users/me`,
    method: "GET",
    authorization: "Bearer access-1",
  });
});

test("rejects a profile without a name", async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse(200, { email: "priya@example.com" }));
  await expect(fetchCurrentUser()).rejects.toThrow("Couldn't load your profile");
});
