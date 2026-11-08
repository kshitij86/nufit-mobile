import { PAYMENTS_BASE_URL } from "../config";
import { ProgrammeId } from "../types";
import { TODAY_PLAN_RESOURCE_KEY } from "./diet";
import { ApiError, NetworkError } from "./http";
import { PROGRAMME_RESOURCE_KEY } from "./journey";
import { ORDERS_RESOURCE_KEY } from "./orders";
import { invalidate } from "./resource";
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
export function createOrder(programmeId: ProgrammeId): Promise<RazorpayOrder> {
  return createPaymentOrder({ programmeId });
}

/** For a custom plan the clinic built for this member. The server prices it from the plan. */
export function createCustomPlanOrder(customPlanId: string): Promise<RazorpayOrder> {
  return createPaymentOrder({ customPlanId });
}

async function createPaymentOrder(body: { programmeId: ProgrammeId } | { customPlanId: string }): Promise<RazorpayOrder> {
  console.log("[payments] POST /orders", body);
  let order;
  try {
    order = await authPost<Partial<RazorpayOrder> | null>(`${PAYMENTS_BASE_URL}/orders`, body);
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
      invalidate(ORDERS_RESOURCE_KEY);
      invalidate(PROGRAMME_RESOURCE_KEY);
      invalidate(TODAY_PLAN_RESOURCE_KEY);
      return;
    } catch (e) {
      if (!(e instanceof NetworkError) || attempt >= retryDelaysMs.length) throw e;
      await sleep(retryDelaysMs[attempt]);
    }
  }
}
