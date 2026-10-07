import { API_HOST } from "../../config";
import { ApiError, NetworkError, userMessage } from "../http";
import { createOrder, verifyPayment, VERIFY_FAILED_MESSAGE } from "../payments";
import { logIn, logOut } from "../session";
import { FetchMock, jsonResponse, mockFetch, requestOf, tokens } from "../../test/fetchMock";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

const PAYMENTS = `${API_HOST}/api/v1/payments`;
const payment = {
  razorpay_order_id: "order_123",
  razorpay_payment_id: "pay_456",
  razorpay_signature: "sig_789",
};
let fetchMock: FetchMock;

beforeEach(async () => {
  await logOut();
  fetchMock = mockFetch();
  fetchMock.mockResolvedValueOnce(jsonResponse(200, tokens("1")));
  await logIn("priya@example.com", "secret");
  fetchMock.mockReset();
});

describe("createOrder", () => {
  test("sends only the programme id and maps the server's order", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { keyId: "key_test_abc", orderId: "order_123", amount: 2832000, currency: "INR", extra: 1 })
    );

    await expect(createOrder("reset360")).resolves.toEqual({
      keyId: "key_test_abc",
      orderId: "order_123",
      amount: 2832000,
      currency: "INR",
    });
    expect(requestOf(fetchMock, 0)).toEqual({
      url: `${PAYMENTS}/orders`,
      method: "POST",
      authorization: "Bearer access-1",
      body: { programmeId: "reset360" },
    });
  });

  test.each([
    [400, { error: "Unknown programme" }, "Unknown programme"],
    [502, { error: "Authentication failed" }, "Authentication failed"],
    [503, { error: "Payments are not available right now. Please try again later." }, "Payments are not available right now. Please try again later."],
    [422, { detail: "Validation failed" }, "Validation failed"],
    [500, { detail: [{ msg: "internal" }] }, "Something went wrong. Please try again."],
  ])("surfaces a user-safe message for %i", async (status, body, message) => {
    fetchMock.mockResolvedValueOnce(jsonResponse(status, body));
    const error = await createOrder("pcos").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(userMessage(error)).toBe(message);
  });

  test("never shows a non-JSON error body", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 502, text: async () => "<html>Bad Gateway</html>" } as Response);
    await expect(createOrder("pcos")).rejects.toThrow("Something went wrong. Please try again.");
  });

  test("rejects an incomplete order", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { orderId: "order_123" }));
    await expect(createOrder("pcos")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("verifyPayment", () => {
  test("resolves on verified: true, sending exactly the Razorpay fields", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { verified: true }));
    await expect(verifyPayment({ ...payment, extra: "x" } as typeof payment, [])).resolves.toBeUndefined();
    expect(requestOf(fetchMock, 0)).toEqual({
      url: `${PAYMENTS}/verify`,
      method: "POST",
      authorization: "Bearer access-1",
      body: payment,
    });
  });

  test.each([
    [400, { verified: false }, VERIFY_FAILED_MESSAGE],
    [400, { verified: false, error: "Missing payment fields" }, "Missing payment fields"],
    [404, { verified: false, error: "Order not found" }, "Order not found"],
    [503, { error: "Payments are not available right now. Please try again later." }, "Payments are not available right now. Please try again later."],
    [200, { verified: false }, VERIFY_FAILED_MESSAGE],
  ])("rejects on %i %j", async (status, body, message) => {
    fetchMock.mockResolvedValueOnce(jsonResponse(status, body));
    await expect(verifyPayment(payment, [0, 0])).rejects.toThrow(message);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("retries network errors and succeeds", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("Network request failed"))
      .mockRejectedValueOnce(new TypeError("Network request failed"))
      .mockResolvedValueOnce(jsonResponse(200, { verified: true }));
    await expect(verifyPayment(payment, [0, 0])).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test("gives up after the retries are exhausted", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));
    await expect(verifyPayment(payment, [0, 0])).rejects.toBeInstanceOf(NetworkError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test("refreshes on 401 and retries", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Token expired" }))
      .mockResolvedValueOnce(jsonResponse(200, tokens("2")))
      .mockResolvedValueOnce(jsonResponse(200, { verified: true }));
    await expect(verifyPayment(payment, [])).resolves.toBeUndefined();
    expect(requestOf(fetchMock, 2).authorization).toBe("Bearer access-2");
  });
});

test("times out slow requests", async () => {
  jest.useFakeTimers();
  fetchMock.mockImplementationOnce(
    (_url, init) =>
      new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new Error("Aborted"))))
  );
  const pending = createOrder("posture").catch((e) => e);
  await jest.advanceTimersByTimeAsync(45_000);
  const error = await pending;
  expect(error).toBeInstanceOf(NetworkError);
  expect((error as NetworkError).timedOut).toBe(true);
  jest.useRealTimers();
});
