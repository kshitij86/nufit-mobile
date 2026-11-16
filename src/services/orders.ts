import { ORDERS_BASE_URL } from "../config";
import { ApiError } from "./http";
import { Resource, useResource } from "./resource";
import { authGet } from "./session";

export const ORDERS_RESOURCE_KEY = "orders";

export type OrderStatus = "created" | "payment_pending" | "paid" | "payment_failed" | "cancelled" | "refunded";

export interface Order {
  id: string;
  planId: string;
  customPlanId: string | null;
  /** The plan's name as it was when the order was placed. */
  planName: string;
  /** In paise, including GST. */
  amountPaise: number;
  currency: string;
  status: OrderStatus;
  placedAt: string;
  paidAt: string | null;
}

export const orderStatusLabel: Record<OrderStatus, string> = {
  created: "Not paid",
  payment_pending: "Payment pending",
  paid: "Paid",
  payment_failed: "Payment failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

type OrderResponse = {
  id?: unknown;
  plan_id?: unknown;
  custom_plan_id?: unknown;
  plan_snapshot?: { name?: unknown } | null;
  amount_paise?: unknown;
  currency?: unknown;
  status?: unknown;
  placed_at?: unknown;
  paid_at?: unknown;
} | null;

const LOAD_ERROR = "Couldn't load your orders. Please try again.";

function toOrder(raw: OrderResponse): Order | null {
  if (
    !raw ||
    typeof raw.id !== "string" ||
    typeof raw.amount_paise !== "number" ||
    typeof raw.status !== "string" ||
    !(raw.status in orderStatusLabel) ||
    typeof raw.placed_at !== "string"
  ) {
    return null;
  }
  return {
    id: raw.id,
    planId: typeof raw.plan_id === "string" ? raw.plan_id : "",
    customPlanId: typeof raw.custom_plan_id === "string" ? raw.custom_plan_id : null,
    planName: typeof raw.plan_snapshot?.name === "string" ? raw.plan_snapshot.name : "Programme",
    amountPaise: raw.amount_paise,
    currency: typeof raw.currency === "string" ? raw.currency : "INR",
    status: raw.status as OrderStatus,
    placedAt: raw.placed_at,
    paidAt: typeof raw.paid_at === "string" ? raw.paid_at : null,
  };
}

/** The member's orders, newest first, optionally only those with one status. */
export async function listOrders(status?: OrderStatus): Promise<Order[]> {
  const url = status ? `${ORDERS_BASE_URL}?status=${encodeURIComponent(status)}` : ORDERS_BASE_URL;
  const raw = await authGet<OrderResponse[] | null>(url, { fallbackError: LOAD_ERROR });
  if (!Array.isArray(raw)) throw new ApiError(LOAD_ERROR, 200);
  return raw
    .map(toOrder)
    .filter((o): o is Order => o !== null)
    .sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt));
}

export async function getOrder(id: string): Promise<Order> {
  const order = toOrder(
    await authGet<OrderResponse>(`${ORDERS_BASE_URL}/${encodeURIComponent(id)}`, {
      fallbackError: "Couldn't load this order. Please try again.",
    })
  );
  if (!order) throw new ApiError("Couldn't load this order. Please try again.", 200);
  return order;
}

const listAllOrders = () => listOrders();

export function useOrders(): Resource<Order[]> {
  return useResource(ORDERS_RESOURCE_KEY, listAllOrders);
}
