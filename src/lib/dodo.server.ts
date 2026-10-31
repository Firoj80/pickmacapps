import { createHmac, timingSafeEqual } from "node:crypto";

export function dodoBase() {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";
}

export function dodoConfigured() {
  return Boolean(process.env.DODO_PAYMENTS_API_KEY?.trim() && process.env.DODO_PRODUCT_ID?.trim());
}

function webhookKey() {
  const raw = process.env.DODO_PAYMENTS_WEBHOOK_KEY?.trim() || "";
  if (!raw) return null;
  if (raw.startsWith("whsec_")) {
    return Buffer.from(raw.slice("whsec_".length), "base64");
  }
  return Buffer.from(raw);
}

/** Standard Webhooks: v1 signature over `${id}.${timestamp}.${rawBody}`. */
export function verifyDodoSignature(input: {
  id: string;
  timestamp: string;
  signature: string;
  body: string;
  now?: number;
}) {
  const key = webhookKey();
  if (!key || !input.id || !input.timestamp || !input.signature) return false;
  const ts = Number(input.timestamp);
  const now = input.now ?? Date.now();
  if (!Number.isFinite(ts) || Math.abs(now - ts * 1000) > 5 * 60 * 1000) return false;
  const expected = createHmac("sha256", key).update(`${input.id}.${input.timestamp}.${input.body}`).digest("base64");
  const parts = input.signature.split(" ").map((part) => part.trim());
  return parts.some((part) => {
    const value = part.startsWith("v1,") ? part.slice(3) : part;
    const left = Buffer.from(value);
    const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
  });
}

export async function createChoiceCheckout(input: { submissionId: string; email: string; name: string; returnUrl: string }) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();
  const productId = process.env.DODO_PRODUCT_ID?.trim();
  if (!apiKey || !productId) {
    throw new Error("Dodo is not configured. Set DODO_PAYMENTS_API_KEY and DODO_PRODUCT_ID.");
  }
  const response = await fetch(`${dodoBase()}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: input.email, name: input.name },
      return_url: input.returnUrl,
      metadata: { submission_id: input.submissionId },
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Dodo checkout failed (${response.status}).`);
  const json = JSON.parse(text) as { checkout_url?: string | null; payment_id?: string | null };
  if (!json.checkout_url) throw new Error("Dodo did not return a checkout URL.");
  return { checkoutUrl: json.checkout_url, paymentId: json.payment_id ?? "" };
}

/** Updates the Dodo product. The amount is the server setting, never a browser field. */
export async function updateDodoPrice(amountCents: number) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();
  const productId = process.env.DODO_PRODUCT_ID?.trim();
  if (!apiKey || !productId) {
    throw new Error("Dodo is not configured. The price was not changed.");
  }
  const response = await fetch(`${dodoBase()}/products/${productId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price: {
        type: "one_time_price",
        currency: "USD",
        price: amountCents,
        discount: 0,
        purchasing_power_parity: false,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Dodo rejected the price change (${response.status}).`);
  }
}
