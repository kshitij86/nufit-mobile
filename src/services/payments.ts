import { PAYMENTS_BASE_URL } from "../config";
import { ProgrammeId } from "../types";
import { ApiError, NetworkError } from "./http";
import { authPost } from "./session";

export const VERIFY_FAILED_MESSAGE = "We couldn't confirm your payment. If money was deducted, contact support.";
const VERIFY_RETRY_DELAYS_MS = [1500, 4000];

export interface RazorpayOrder {
  keyId: string;
  orderId: string;
  /** In paise. Set by the server, including GST. */
  amount: number;
  currency: string;
}

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// The server sets the price, so only the programme is sent.
export async function createOrder(programmeId: ProgrammeId): Promise<RazorpayOrder> {
  console.log("[payments] POST /orders", { programmeId });
  let order;
  try {
    order = await authPost<Partial<RazorpayOrder> | null>(`${PAYMENTS_BASE_URL}/orders`, { programmeId });
  } catch (e) {
    console.warn("[payments] /orders failed:", e instanceof ApiError ? `${e.status} ${e.message}` : e);
    throw e;
  }
  console.log("[payments] /orders ok", { ...order, keyId: order?.keyId ? "present" : "MISSING" });
  if (!order?.keyId || !order.orderId || typeof order.amount !== "number" || !order.currency) {
    throw new ApiError("Payments are not available right now. Please try again later.", 200);
  }
  return { keyId: order.keyId, orderId: order.orderId, amount: order.amount, currency: order.currency };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Resolves only when the server confirms the payment. /verify is idempotent and the user may
// already have been charged, so network errors and timeouts are retried before giving up.
export async function verifyPayment(
  { razorpay_order_id, razorpay_payment_id, razorpay_signature }: RazorpaySuccess,
  retryDelaysMs = VERIFY_RETRY_DELAYS_MS
): Promise<void> {
  const body = { razorpay_order_id, razorpay_payment_id, razorpay_signature };
  for (let attempt = 0; ; attempt++) {
    try {
      console.log("[payments] POST /verify attempt", attempt + 1);
      const res = await authPost<{ verified?: boolean } | null>(`${PAYMENTS_BASE_URL}/verify`, body, {
        fallbackError: VERIFY_FAILED_MESSAGE,
      });
      if (res?.verified !== true) throw new ApiError(VERIFY_FAILED_MESSAGE, 200);
      return;
    } catch (e) {
      if (!(e instanceof NetworkError) || attempt >= retryDelaysMs.length) throw e;
      await sleep(retryDelaysMs[attempt]);
    }
  }
}
