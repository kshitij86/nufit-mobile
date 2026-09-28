import http from "node:http";
import crypto from "node:crypto";

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, PORT = "4000" } = process.env;
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET. Copy server/.env.example to server/.env.");
  process.exit(1);
}

const RAZORPAY_API = "https://api.razorpay.com/v1";
const basicAuth = "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

// Prices live server-side so the client can't choose what it pays. Keep in sync with src/data/programmes.ts.
const PROGRAMME_PRICES_INR = {
  reset360: 24000,
  pcos: 28000,
  prenatal: 18000,
  postpartum: 22000,
  thyroid: 24000,
  posture: 16000,
};

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1e5) throw new Error("Body too large");
  }
  return raw ? JSON.parse(raw) : {};
}

async function createOrder({ programmeId }) {
  const price = PROGRAMME_PRICES_INR[programmeId];
  if (!price) return [400, { error: "Unknown programme" }];

  const amount = Math.round(price * 1.18 * 100);
  const r = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: { Authorization: basicAuth, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt: `nufit_${programmeId}_${Date.now()}`,
      notes: { programmeId },
    }),
  });
  const order = await r.json();
  if (!r.ok) return [502, { error: order.error?.description ?? "Could not create order" }];

  return [200, { keyId: RAZORPAY_KEY_ID, orderId: order.id, amount: order.amount, currency: order.currency }];
}

function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return [400, { verified: false, error: "Missing payment fields" }];
  }
  const expected = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(razorpay_signature));
  const verified = a.length === b.length && crypto.timingSafeEqual(a, b);
  return [verified ? 200 : 400, { verified }];
}

http
  .createServer(async (req, res) => {
    try {
      if (req.method === "POST" && req.url === "/orders") return send(res, ...(await createOrder(await readJson(req))));
      if (req.method === "POST" && req.url === "/verify") return send(res, ...verifyPayment(await readJson(req)));
      send(res, 404, { error: "Not found" });
    } catch (err) {
      console.error(err);
      send(res, 500, { error: "Server error" });
    }
  })
  .listen(Number(PORT), () => console.log(`Payments server on http://localhost:${PORT}`));
