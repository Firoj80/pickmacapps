import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";
import { PRIMARY_ORIGIN } from "@/lib/seo";

const TELEGRAM_API_BASE = "https://api.telegram.org";

export interface TelegramSubmissionInfo {
  id: string;
  appName: string;
  website: string;
  tagline: string;
  email: string;
  xHandle?: string;
  plan: string;
  tier?: string;
  pricing?: string;
  category?: string;
  badgeOk: boolean;
  status: string;
  approvedSlug?: string;
}

export type TelegramSubmissionAction = "approve" | "apphot" | "reject" | "badge";

export function escapeTelegramHtml(text: string): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isTelegramConfigured(): boolean {
  return Boolean(env("TELEGRAM_BOT_TOKEN") && env("TELEGRAM_ADMIN_CHAT_ID"));
}

export function getTelegramWebhookSecret(): string | undefined {
  const explicit = env("TELEGRAM_WEBHOOK_SECRET");
  if (explicit) return explicit;
  const token = env("TELEGRAM_BOT_TOKEN");
  if (!token) return undefined;
  // Deterministic URL-safe token so webhook setup works without requiring a 3rd env var
  return createHash("sha256")
    .update(`${token}:pickmacapps-tg-webhook`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyTelegramWebhookSecret(headerValue: string | null, expectedSecret: string | undefined, strict = false): boolean {
  if (!expectedSecret) return !strict;
  if (!headerValue) return !strict;
  const a = Buffer.from(headerValue.trim(), "utf8");
  const b = Buffer.from(expectedSecret.trim(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isAuthorizedTelegramSender(fromId: unknown, chatId: unknown, adminChatId: string | undefined): boolean {
  const expected = String(adminChatId ?? "").trim();
  if (!expected) return false;
  const from = fromId !== undefined && fromId !== null ? String(fromId).trim() : "";
  const chat = chatId !== undefined && chatId !== null ? String(chatId).trim() : "";
  return from === expected || chat === expected;
}

export function parseSubmissionCallbackData(data: string): { action: TelegramSubmissionAction; submissionId: string } | null {
  const trimmed = String(data ?? "").trim();
  const match = /^sub:(approve|apphot|reject|badge):([a-zA-Z0-9-]+)$/.exec(trimmed);
  if (!match) return null;
  return {
    action: match[1] as TelegramSubmissionAction,
    submissionId: match[2],
  };
}

function planLabel(submission: TelegramSubmissionInfo): string {
  if (submission.plan === "choice") {
    return submission.tier === "article"
      ? "🌟 Gold Featured + Article (Paid)"
      : "🔹 Blue Featured (Paid)";
  }
  return "🆓 Free Listing";
}

function defaultHeader(submission: TelegramSubmissionInfo, kind?: "submitted" | "payment_succeeded"): string {
  if (submission.status === "approved") return "✅ <b>APPROVED &amp; PUBLISHED</b>";
  if (submission.status === "rejected") return "❌ <b>SUBMISSION REJECTED</b>";
  if (kind === "payment_succeeded" || submission.status === "paid") {
    return "💰 <b>PAID SUBMISSION CONFIRMED — Ready to Approve</b>";
  }
  if (submission.plan === "choice" && submission.status === "awaiting_payment") {
    return "⏳ <b>NEW SPONSOR SUBMISSION (Awaiting Payment)</b>";
  }
  return "🆕 <b>NEW APP SUBMISSION</b>";
}

export function formatSubmissionNotification(
  submission: TelegramSubmissionInfo,
  options?: {
    kind?: "submitted" | "payment_succeeded";
    badgeNote?: string;
    approvedSlug?: string;
  },
): string {
  const header = defaultHeader(submission, options?.kind);
  const badgeText =
    submission.plan === "choice"
      ? "Exempt (Paid Sponsor)"
      : submission.badgeOk
      ? "✅ Verified on site"
      : "❌ Not found";

  const lines: string[] = [
    header,
    "",
    `📱 <b>App:</b> ${escapeTelegramHtml(submission.appName)}`,
    `🏷 <b>Plan:</b> ${escapeTelegramHtml(planLabel(submission))}`,
  ];

  if (submission.category || submission.pricing) {
    const meta = [submission.pricing, submission.category].filter(Boolean).join(" · ");
    lines.push(`📂 <b>Details:</b> ${escapeTelegramHtml(meta)}`);
  }

  lines.push(
    `🌐 <b>Website:</b> ${escapeTelegramHtml(submission.website)}`,
    `💬 <b>Tagline:</b> ${escapeTelegramHtml(submission.tagline)}`,
    `👤 <b>Submitter:</b> ${escapeTelegramHtml([submission.xHandle, submission.email].filter(Boolean).join(" · "))}`,
    `🛡 <b>Badge Check:</b> ${escapeTelegramHtml(badgeText)}${options?.badgeNote ? ` <i>(${escapeTelegramHtml(options.badgeNote)})</i>` : ""}`,
  );

  const liveSlug = options?.approvedSlug || submission.approvedSlug;
  if (submission.status === "approved" && liveSlug) {
    lines.push(`🚀 <b>Live URL:</b> ${PRIMARY_ORIGIN}/app/${escapeTelegramHtml(liveSlug)}`);
  }

  lines.push("", `🆔 <code>${escapeTelegramHtml(submission.id)}</code>`);
  return lines.join("\n");
}

function safeHttpUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function buildSubmissionInlineKeyboard(
  submission: TelegramSubmissionInfo,
  approvedSlug?: string,
) {
  const websiteUrl = safeHttpUrl(submission.website);
  const slug = approvedSlug || submission.approvedSlug;

  if (submission.status === "approved") {
    const row: { text: string; url?: string; callback_data?: string }[] = [];
    if (slug) row.push({ text: "🌐 View Live Listing", url: `${PRIMARY_ORIGIN}/app/${slug}` });
    row.push({ text: "⚙️ Open Admin", url: `${PRIMARY_ORIGIN}/admin/apps` });
    return { inline_keyboard: [row] };
  }

  if (submission.status === "rejected") {
    return {
      inline_keyboard: [[{ text: "⚙️ Open Admin", url: `${PRIMARY_ORIGIN}/admin` }]],
    };
  }

  const rows: { text: string; url?: string; callback_data?: string }[][] = [
    [
      { text: "✅ Approve & Publish", callback_data: `sub:approve:${submission.id}` },
      { text: "🔥 Approve + Hot", callback_data: `sub:apphot:${submission.id}` },
    ],
    [
      { text: "🔍 Check Badge", callback_data: `sub:badge:${submission.id}` },
      { text: "❌ Reject", callback_data: `sub:reject:${submission.id}` },
    ],
  ];

  if (websiteUrl) {
    rows.push([{ text: "🌐 Visit Website", url: websiteUrl }]);
  }

  return { inline_keyboard: rows };
}

async function telegramCall(method: string, body: Record<string, unknown>) {
  const token = env("TELEGRAM_BOT_TOKEN");
  if (!token) return { ok: false as const, description: "TELEGRAM_BOT_TOKEN is not configured" };

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(7000),
    });
    const json = (await response.json().catch(() => null)) as { ok?: boolean; description?: string; result?: unknown } | null;
    if (!response.ok || !json?.ok) {
      const desc = json?.description ?? `HTTP ${response.status}`;
      console.error(`[telegram] ${method} failed:`, desc);
      return { ok: false as const, description: desc };
    }
    return { ok: true as const, result: json.result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Telegram API request failed";
    console.error(`[telegram] ${method} error:`, msg);
    return { ok: false as const, description: msg };
  }
}

export async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: unknown) {
  return telegramCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  replyMarkup?: unknown,
) {
  return telegramCall("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function answerTelegramCallback(callbackQueryId: string, text: string, showAlert = false) {
  return telegramCall("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: text.slice(0, 200),
    show_alert: showAlert,
  });
}

export async function notifyTelegramSubmission(
  submission: TelegramSubmissionInfo,
  kind: "submitted" | "payment_succeeded" = "submitted",
) {
  const adminChatId = env("TELEGRAM_ADMIN_CHAT_ID");
  if (!adminChatId || !env("TELEGRAM_BOT_TOKEN")) return;

  const text = formatSubmissionNotification(submission, { kind });
  const keyboard = buildSubmissionInlineKeyboard(submission);
  await sendTelegramMessage(adminChatId, text, keyboard);
}

export async function registerTelegramWebhook(origin: string) {
  const token = env("TELEGRAM_BOT_TOKEN");
  const adminChatId = env("TELEGRAM_ADMIN_CHAT_ID");
  if (!token || !adminChatId) {
    throw new Error("Set TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID in your environment variables first.");
  }

  const base = (origin && origin.startsWith("https://") ? origin : PRIMARY_ORIGIN).replace(/\/$/, "");
  const webhookUrl = `${base}/api/telegram/webhook`;
  const secretToken = getTelegramWebhookSecret();

  const res = await telegramCall("setWebhook", {
    url: webhookUrl,
    allowed_updates: ["message", "callback_query"],
    ...(secretToken ? { secret_token: secretToken } : {}),
  });

  if (!res.ok) {
    throw new Error(`Telegram setWebhook failed: ${res.description}`);
  }

  const testMsg = await sendTelegramMessage(
    adminChatId,
    [
      "🤖 <b>PickMacApps Telegram Bot Connected!</b>",
      "",
      `✅ Webhook registered: <code>${escapeTelegramHtml(webhookUrl)}</code>`,
      "You will receive new app submissions here with 1-tap <b>Approve</b>, <b>Reject</b>, and <b>Check Badge</b> controls.",
    ].join("\n"),
  );

  if (!testMsg.ok) {
    throw new Error(`Webhook set, but test message to chat ${adminChatId} failed: ${testMsg.description}`);
  }

  return { webhookUrl };
}
