import { API_HOST } from "../../config";
import { NetworkError } from "../http";
import { getOrder, listOrders } from "../orders";
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

const URL = `${API_HOST}/api/v1/orders`;
const order = (id: string, placedAt: string, status = "paid") => ({
  id,
  user_id: "u1",
  plan_id: "reset360",
  custom_plan_id: null,
  plan_snapshot: { name: "Reset 360", price: 24000, discount_pct: 0 },
  amount_paise: 2832000,
  currency: "INR",
  status,
  status_history: [],
  razorpay_order_id: `order_${id}`,
  razorpay_payment_id: null,
  receipt: `r_${id}`,
  failure_reason: null,
  placed_at: placedAt,
  updated_at: placedAt,
  paid_at: status === "paid" ? placedAt : null,
});
let fetchMock: FetchMock;

beforeEach(async () => {
  await logOut();
  fetchMock = mockFetch();
  fetchMock.mockResolvedValueOnce(jsonResponse(200, tokens("1")));
  await logIn("priya@example.com", "secret");
  fetchMock.mockReset();
});

describe("listOrders", () => {
  test("loads the member's orders newest first", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, [
        order("a", "2026-06-23T11:00:00+05:30"),
        order("b", "2026-10-01T11:00:00+05:30", "payment_failed"),
      ])
    );

    const orders = await listOrders();

    expect(requestOf(fetchMock, 0)).toMatchObject({ url: URL, method: "GET", authorization: "Bearer access-1" });
    expect(orders.map((o) => o.id)).toEqual(["b", "a"]);
    expect(orders[1]).toEqual({
      id: "a",
      planId: "reset360",
      customPlanId: null,
      planName: "Reset 360",
      amountPaise: 2832000,
      currency: "INR",
      status: "paid",
      placedAt: "2026-06-23T11:00:00+05:30",
      paidAt: "2026-06-23T11:00:00+05:30",
    });
  });

  test("filters by status in the query string", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, []));
    await expect(listOrders("paid")).resolves.toEqual([]);
    expect(requestOf(fetchMock, 0).url).toBe(`${URL}?status=paid`);
  });

  test("skips entries it can't read rather than failing the list", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, [order("a", "2026-06-23T11:00:00+05:30"), { id: "broken" }, order("c", "x", "unknown")])
    );
    await expect(listOrders()).resolves.toHaveLength(1);
  });

  test("a 422 for an unknown status surfaces as an error, not an empty list", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(422, { detail: [{ type: "enum", loc: ["query", "status"], msg: "Input should be 'created', …" }] })
    );
    await expect(listOrders("bogus" as never)).rejects.toMatchObject({ status: 422 });
  });

  test("on a 401 whose refresh is rejected, signs the member out", async () => {
    const expired = jest.fn();
    const unsubscribe = onSessionExpired(expired);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Could not validate credentials." }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Invalid refresh token" }));

    await expect(listOrders()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(expired).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  test("a network failure surfaces as a NetworkError", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));
    await expect(listOrders()).rejects.toBeInstanceOf(NetworkError);
  });
});

describe("getOrder", () => {
  test("loads one order by id", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, order("a/b", "2026-06-23T11:00:00+05:30")));
    await expect(getOrder("a/b")).resolves.toMatchObject({ id: "a/b", status: "paid" });
    expect(requestOf(fetchMock, 0).url).toBe(`${URL}/a%2Fb`);
  });

  test("surfaces the server's message for an order that isn't theirs", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { detail: "Order not found" }));
    await expect(getOrder("nope")).rejects.toThrow("Order not found");
  });
});
