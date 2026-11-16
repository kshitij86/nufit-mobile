import { API_HOST } from "../../config";
import { ApiError, NetworkError } from "../http";
import { listMeasurements, saveMeasurement, siteErrorsOf, siteValueError } from "../measurements";
import { logIn, logOut, onSessionExpired, SessionExpiredError } from "../session";
import { FetchMock, jsonResponse, mockFetch, requestOf, tokens } from "../../test/fetchMock";

jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
  };
});

const URL = `${API_HOST}/api/v1/users/me/measurements`;
const sites = { arm: 11.5, waist: 30.9, tummy: 34.6, belowNavel: 36.5, hip: 38.4, thigh: 21.3 };
const entry = (id: string, createdOn: string, weight: number | null = 66.8) => ({
  id,
  user_id: "u1",
  arm: 11.5,
  waist: 30.9,
  tummy: 34.6,
  below_navel: 36.5,
  hip: 38.4,
  thigh: 21.3,
  weight_kg: weight,
  created_on: createdOn,
});
let fetchMock: FetchMock;

beforeEach(async () => {
  await logOut();
  fetchMock = mockFetch();
  fetchMock.mockResolvedValueOnce(jsonResponse(200, tokens("1")));
  await logIn("priya@example.com", "secret");
  fetchMock.mockReset();
});

describe("listMeasurements", () => {
  test("loads the member's entries newest first, mapping below_navel to belowNavel", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, [entry("old", "2026-09-28T09:00:00+05:30", null), entry("new", "2026-10-26T09:00:00+05:30")])
    );

    const result = await listMeasurements();

    expect(requestOf(fetchMock, 0)).toMatchObject({ url: URL, method: "GET", authorization: "Bearer access-1" });
    expect(result.map((m) => m.id)).toEqual(["new", "old"]);
    expect(result[0]).toEqual({ id: "new", createdOn: "2026-10-26T09:00:00+05:30", sites, weightKg: 66.8 });
    expect(result[1].weightKg).toBeNull();
  });

  test("an empty history is an empty list", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, []));
    await expect(listMeasurements()).resolves.toEqual([]);
  });

  test("on a 401 whose refresh is rejected, signs the member out", async () => {
    const expired = jest.fn();
    const unsubscribe = onSessionExpired(expired);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Could not validate credentials." }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Invalid refresh token" }));

    await expect(listMeasurements()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(expired).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  test("a network failure surfaces as a NetworkError", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));
    await expect(listMeasurements()).rejects.toBeInstanceOf(NetworkError);
  });
});

describe("saveMeasurement", () => {
  test("posts the six sites with API field names and returns the saved entry", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, entry("m1", "2026-10-27T10:00:00+05:30", null)));

    await expect(saveMeasurement(sites)).resolves.toMatchObject({ id: "m1", sites, weightKg: null });
    expect(requestOf(fetchMock, 0)).toMatchObject({
      url: URL,
      method: "POST",
      authorization: "Bearer access-1",
      body: { arm: 11.5, waist: 30.9, tummy: 34.6, below_navel: 36.5, hip: 38.4, thigh: 21.3 },
    });
  });

  test("sends weight_kg only when given", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, entry("m1", "2026-10-27T10:00:00+05:30", 70)));
    await saveMeasurement(sites, 70);
    expect(requestOf(fetchMock, 0).body.weight_kg).toBe(70);
  });

  test("maps a 422 onto the sites the server rejected", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(422, {
        detail: [
          { type: "greater_than", loc: ["body", "arm"], msg: "Input should be greater than 0" },
          { type: "less_than", loc: ["body", "below_navel"], msg: "Input should be less than 120" },
        ],
      })
    );

    const error = await saveMeasurement({ ...sites, arm: 0, belowNavel: 200 }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(siteErrorsOf(error)).toEqual({
      arm: "Input should be greater than 0",
      belowNavel: "Input should be less than 120",
    });
  });

  test("on a 401 whose refresh is rejected, signs the member out", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Could not validate credentials." }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Invalid refresh token" }));
    await expect(saveMeasurement(sites)).rejects.toBeInstanceOf(SessionExpiredError);
  });

  test("a network failure surfaces as a NetworkError with no site errors", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));
    const error = await saveMeasurement(sites).catch((e) => e);
    expect(error).toBeInstanceOf(NetworkError);
    expect(siteErrorsOf(error)).toEqual({});
  });
});

test("siteValueError mirrors the API's bounds", () => {
  expect(siteValueError("31.5")).toBeNull();
  expect(siteValueError("31,5")).toBeNull();
  expect(siteValueError("")).toMatch(/Enter a number/);
  expect(siteValueError("abc")).toMatch(/Enter a number/);
  expect(siteValueError("0")).toMatch(/between 0 and 120/);
  expect(siteValueError("120")).toMatch(/between 0 and 120/);
  expect(siteValueError("119.9")).toBeNull();
});
