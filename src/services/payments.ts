import { Platform } from "react-native";

// Android emulators reach the host machine via 10.0.2.2; physical devices need EXPO_PUBLIC_PAYMENTS_API_URL set to the host's LAN IP.
const API_URL =
  process.env.EXPO_PUBLIC_PAYMENTS_API_URL ??
  (Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000");

export interface RazorpayOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
}

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}

export function createOrder(programmeId: string) {
  return post<RazorpayOrder>("/orders", { programmeId });
}

export async function verifyPayment(payment: RazorpaySuccess) {
  const { verified } = await post<{ verified: boolean }>("/verify", payment);
  return verified;
}
