import { createHmac, timingSafeEqual } from "node:crypto";

export function dodoBase() {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";
}

export function getDodoProductId(tier: "featured" | "article" = "featured"): string | null {
  if (tier === "article") {
    return process.env.DODO_PRODUCT_ID_ARTICLE?.trim() || process.env.DODO_PRODUCT_ID?.trim() || null;
  }
  return process.env.DODO_PRODUCT_ID_FEATURED?.trim() || process.env.DODO_PRODUCT_ID?.trim() || null;
}

export function dodoConfigured(tier?: "featured" | "article") {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();
  const productId = tier ? getDodoProductId(tier) : (process.env.DODO_PRODUCT_ID?.trim() || process.env.DODO_PRODUCT_ID_FEATURED?.trim() || process.env.DODO_PRODUCT_ID_ARTICLE?.trim());
  return Boolean(apiKey && productId);
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

export async function createChoiceCheckout(input: {
  submissionId: string;
  email: string;
  name: string;
  returnUrl: string;
  tier?: "featured" | "article";
}) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();
  const tier = input.tier === "article" ? "article" : "featured";
  const productId = getDodoProductId(tier);
  if (!apiKey || !productId) {
    throw new Error(`Dodo is not configured. Set DODO_PAYMENTS_API_KEY and DODO_PRODUCT_ID_${tier.toUpperCase()} (or DODO_PRODUCT_ID).`);
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
      metadata: { submission_id: input.submissionId, tier },
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Dodo checkout failed (${response.status}).`);
  const json = JSON.parse(text) as { checkout_url?: string | null; payment_id?: string | null };
  if (!json.checkout_url) throw new Error("Dodo did not return a checkout URL.");
  return { checkoutUrl: json.checkout_url, paymentId: json.payment_id ?? "" };
}

function dodoMessage(body: string) {
  try {
    const json = JSON.parse(body) as { message?: string };
    const message = json.message?.replace(/\s+/g, " ").trim();
    if (message) return ` ${message.slice(0, 180)}`;
  } catch {
    return "";
  }
  return "";
}

function dodoFailure(action: string, status: number, body: string) {
  const message = dodoMessage(body);
  if (status === 403) {
    return `Dodo refused ${action} (403).${message} In Dodo, open this API key and allow Products write. You can still change the price on the product itself.`;
  }
  return `Dodo rejected ${action} (${status}).${message}`;
}

/** The amount Dodo will charge, in cents. Null when the product cannot be read. */
export async function readDodoPrice(tier: "featured" | "article" = "featured") {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();
  const productId = getDodoProductId(tier);
  if (!apiKey || !productId) return null;
  try {
    const response = await fetch(`${dodoBase()}/products/${productId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { price?: { price?: number; currency?: string } };
    const amount = json.price?.price;
    if (json.price?.currency && json.price.currency !== "USD") return null;
    if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 100) return null;
    return amount;
  } catch {
    return null;
  }
}

/** Updates the Dodo product. The amount is the server setting, never a browser field. */
export async function updateDodoPrice(amountCents: number, tier: "featured" | "article" = "featured") {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();
  const productId = getDodoProductId(tier);
  if (!apiKey || !productId) {
    throw new Error(`Dodo is not configured for ${tier} tier. Set DODO_PAYMENTS_API_KEY and DODO_PRODUCT_ID_${tier.toUpperCase()} (or DODO_PRODUCT_ID).`);
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
  const text = await response.text();
  if (!response.ok) throw new Error(dodoFailure(`the ${tier} price change`, response.status, text));
}
