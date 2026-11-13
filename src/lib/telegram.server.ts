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
  existingSlug?: string;
  isUpdate?: boolean;
  dashboardToken?: string;
}

export type TelegramSubmissionAction = "approve" | "apphot" | "reject" | "badge" | "nobadge" | "xpost" | "conf";

export interface ParsedTelegramCallback {
  action: TelegramSubmissionAction;
  submissionId: string;
  templateIndex?: number;
}

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

export function parseSubmissionCallbackData(data: string): ParsedTelegramCallback | null {
  const trimmed = String(data ?? "").trim();
  const xpostMatch = /^sub:xpost:([1-5]):([a-zA-Z0-9-]+)$/.exec(trimmed);
  if (xpostMatch) {
    return {
      action: "xpost",
      templateIndex: Number(xpostMatch[1]),
      submissionId: xpostMatch[2],
    };
  }
  const match = /^sub:(approve|apphot|reject|badge|nobadge|conf):([a-zA-Z0-9-]+)$/.exec(trimmed);
  if (!match) return null;
  return {
    action: match[1] as TelegramSubmissionAction,
    submissionId: match[2],
  };
}

export function normalizeCreatorMention(xHandle?: string): string {
  const raw = String(xHandle ?? "").trim();
  if (!raw) return "";
  const urlMatch = /(?:x\.com|twitter\.com)\/([A-Za-z0-9_]{1,30})/i.exec(raw);
  const handle = (urlMatch ? urlMatch[1] : raw.replace(/^@+/, "")).replace(/[^A-Za-z0-9_]/g, "");
  return handle ? `@${handle}` : "";
}

export interface XPostTemplate {
  id: number;
  label: string;
  text: string;
}

export function buildXPostTemplates(submission: TelegramSubmissionInfo, slug?: string): XPostTemplate[] {
  const name = submission.appName.trim();
  const creator = normalizeCreatorMention(submission.xHandle);
  const byCreator = creator ? ` by ${creator}` : "";
  const rawTagline = submission.tagline.trim();
  const shortTagline = rawTagline.length > 120 ? `${rawTagline.slice(0, 117).trimEnd()}...` : rawTagline;
  const resolvedSlug = slug || submission.approvedSlug;
  const appUrl = resolvedSlug ? `${PRIMARY_ORIGIN}/app/${resolvedSlug}` : PRIMARY_ORIGIN;
  const submitUrl = `${PRIMARY_ORIGIN}/submit`;

  return [
    {
      id: 1,
      label: "Clean Launch",
      text: [
        `New on PickMacApps `,
        ``,
        `Meet ${name}${byCreator} — ${shortTagline}`,
        ``,
        `Explore it here:`,
        `${appUrl}`,
        ``,
        `Built a Mac app? Submit yours to get discovered 👇`,
        `${submitUrl}`,
      ].join("\n"),
    },
    {
      id: 2,
      label: "Fresh Addition",
      text: [
        `${name}${byCreator} was just added to PickMacApps! ✨`,
        ``,
        `${shortTagline}`,
        ``,
        `Check features & pricing: ${appUrl}`,
        ``,
        `Have a macOS app? Add your app to PickMacApps: ${submitUrl}`,
      ].join("\n"),
    },
    {
      id: 3,
      label: "Punchy Spotlight",
      text: [
        `Just listed on PickMacApps: ${name}${byCreator} 🚀`,
        ``,
        `${shortTagline}`,
        ``,
        `Details & download → ${appUrl}`,
        ``,
        `Building for Mac? Submit your app here: ${submitUrl}`,
      ].join("\n"),
    },
    {
      id: 4,
      label: "Mac Discovery",
      text: [
        `If you use a Mac, check out ${name}${byCreator} 👀`,
        ``,
        `${shortTagline}`,
        ``,
        `Full listing on PickMacApps:`,
        `${appUrl}`,
        ``,
        `Want your Mac app featured? Submit it today 👇`,
        `${submitUrl}`,
      ].join("\n"),
    },
    {
      id: 5,
      label: "Creator Shoutout",
      text: [
        `Mac App Spotlight 🔦`,
        ``,
        `${name}${byCreator}`,
        `→ ${shortTagline}`,
        ``,
        `Live now: ${appUrl}`,
        ``,
        `Founders: get your Mac app in front of daily Mac users → ${submitUrl}`,
      ].join("\n"),
    },
  ];
}

export function formatXPostTelegramMessage(
  submission: TelegramSubmissionInfo,
  templateIndex = 1,
  slug?: string,
): string {
  const templates = buildXPostTemplates(submission, slug);
  const idx = Math.min(Math.max(1, templateIndex), templates.length);
  const selected = templates[idx - 1];
  const creator = normalizeCreatorMention(submission.xHandle);

  return [
    `𝕏 <b>Ready-to-Share Post for ${escapeTelegramHtml(submission.appName)}</b>${creator ? ` (${escapeTelegramHtml(creator)})` : ""}`,
    `📝 <b>Template ${idx}/5:</b> ${escapeTelegramHtml(selected.label)} <i>(tap text below to copy)</i>`,
    ``,
    `<pre>${escapeTelegramHtml(selected.text)}</pre>`,
    ``,
    `👇 Pick another template or post directly on X:`,
  ].join("\n");
}

export interface TelegramInlineButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export function buildXPostInlineKeyboard(
  submission: TelegramSubmissionInfo,
  templateIndex = 1,
  slug?: string,
): { inline_keyboard: TelegramInlineButton[][] } {
  const templates = buildXPostTemplates(submission, slug);
  const idx = Math.min(Math.max(1, templateIndex), templates.length);
  const selected = templates[idx - 1];
  const resolvedSlug = slug || submission.approvedSlug;
  const appUrl = resolvedSlug ? `${PRIMARY_ORIGIN}/app/${resolvedSlug}` : PRIMARY_ORIGIN;
  const xIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(selected.text)}`;

  const templateRow: TelegramInlineButton[] = templates.map((t) => ({
    text: t.id === idx ? `• ${t.id} •` : `${t.id}`,
    callback_data: `sub:xpost:${t.id}:${submission.id}`,
  }));

  return {
    inline_keyboard: [
      templateRow,
      [
        { text: "𝕏 Post on X", url: xIntentUrl },
        { text: "🌐 View App Page", url: appUrl },
      ],
    ],
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
  if (submission.status === "approved") {
    return submission.isUpdate ? "✅ <b>LISTING UPDATED &amp; PUBLISHED</b>" : "✅ <b>APPROVED &amp; PUBLISHED</b>";
  }
  if (submission.status === "rejected") return "❌ <b>SUBMISSION REJECTED</b>";
  if (kind === "payment_succeeded" || submission.status === "paid") {
    return submission.isUpdate
      ? "💰 <b>SPONSOR UPGRADE PAID — Ready to Apply</b>"
      : "💰 <b>PAID SUBMISSION CONFIRMED — Ready to Approve</b>";
  }
  if (submission.plan === "choice" && submission.status === "awaiting_payment") {
    return submission.isUpdate
      ? "⭐ <b>SPONSOR UPGRADE (Awaiting Payment)</b>"
      : "⏳ <b>NEW SPONSOR SUBMISSION (Awaiting Payment)</b>";
  }
  if (submission.isUpdate) {
    return "🔄 <b>APP LISTING UPDATE SUBMISSION</b>";
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

  if (submission.existingSlug && submission.status !== "approved") {
    lines.push(`🔗 <b>Current Live Page:</b> ${PRIMARY_ORIGIN}/app/${escapeTelegramHtml(submission.existingSlug)}`);
  }

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
): { inline_keyboard: TelegramInlineButton[][] } {
  const websiteUrl = safeHttpUrl(submission.website);
  const slug = approvedSlug || submission.approvedSlug;

  if (submission.status === "approved") {
    const row1: TelegramInlineButton[] = [];
    if (slug) row1.push({ text: "🌐 View Live Listing", url: `${PRIMARY_ORIGIN}/app/${slug}` });
    row1.push({ text: "⚙️ Open Admin", url: `${PRIMARY_ORIGIN}/admin/apps` });
    const row2: TelegramInlineButton[] = [{ text: "𝕏 Generate X Post", callback_data: `sub:xpost:1:${submission.id}` }];
    return { inline_keyboard: [row1, row2] };
  }

  if (submission.status === "rejected") {
    return {
      inline_keyboard: [[{ text: "⚙️ Open Admin", url: `${PRIMARY_ORIGIN}/admin` }]],
    };
  }

  const isFree = submission.plan !== "choice";
  const badgeMissing = isFree && !submission.badgeOk;

  const row1: TelegramInlineButton[] = badgeMissing
    ? [
        {
          text: "🚫 Approve Disabled (No Badge)",
          callback_data: `sub:nobadge:${submission.id}`,
        },
      ]
    : [
        { text: "✅ Approve & Publish", callback_data: `sub:approve:${submission.id}` },
        { text: "🔥 Approve + Hot", callback_data: `sub:apphot:${submission.id}` },
      ];

  const creator = normalizeCreatorMention(submission.xHandle);
  const cleanHandle = creator ? creator.replace(/^@/, "") : "";

  const row3: TelegramInlineButton[] = [
    { text: "📋 Confirmation DM", callback_data: `sub:conf:${submission.id}` },
  ];
  if (cleanHandle) {
    row3.push({ text: `𝕏 @${cleanHandle}`, url: `https://x.com/${cleanHandle}` });
  } else if (submission.email) {
    const subject = encodeURIComponent(`Your PickMacApps submission: ${submission.appName}`);
    row3.push({ text: "✉️ Email Submitter", url: `mailto:${submission.email}?subject=${subject}` });
  }

  const rows: TelegramInlineButton[][] = [
    row1,
    [
      { text: "🔍 Check Badge", callback_data: `sub:badge:${submission.id}` },
      { text: "❌ Reject", callback_data: `sub:reject:${submission.id}` },
    ],
    row3,
  ];

  if (websiteUrl) {
    rows.push([{ text: "🌐 Visit Website", url: websiteUrl }]);
  }

  return { inline_keyboard: rows };
}

export function buildSubmitterConfirmationText(submission: TelegramSubmissionInfo): string {
  const name = submission.appName.trim();
  const token = submission.dashboardToken || submission.id;
  const dashUrl = `${PRIMARY_ORIGIN}/dashboard/${token}`;

  return [
    `Hey ${name} Dev 👋`,
    ``,
    `Your app has been submitted to PickMacApps! `,
    ``,
    `Here is your private dashboard link to track and manage your listing:`,
    `${dashUrl}`,
    ``,
    `With your mini-dashboard, you can:`,
    `• 📊 Track real-time App Card clicks and impressions`,
    `• 🚀 Track "Try App" / website referral clicks`,
    `• 👁️ Live preview your app card as visitors see it`,
    `• ✏️ Edit your tagline, description, category, and pricing`,
    `• 🖼️ Update your app icon and demo/video link anytime`,
    `• ⭐ Upgrade or switch listing plans (Free to Blue / Gold Badge)`,
    `• ⏳ Monitor your submission approval status in real-time`,
    ``,
    `We're reviewing your submission now and will update you shortly!`,
  ].join("\n");
}

export function formatSubmitterConfirmationMessage(submission: TelegramSubmissionInfo): string {
  const text = buildSubmitterConfirmationText(submission);
  const creator = normalizeCreatorMention(submission.xHandle);

  return [
    `💬 <b>Confirmation DM for ${escapeTelegramHtml(submission.appName)} Creator</b>${creator ? ` (${escapeTelegramHtml(creator)})` : ""} <i>(tap text below to copy)</i>`,
    ``,
    `<pre>${escapeTelegramHtml(text)}</pre>`,
    ``,
    `👇 Quick actions for this creator:`,
  ].join("\n");
}

export function buildConfirmationInlineKeyboard(
  submission: TelegramSubmissionInfo,
): { inline_keyboard: TelegramInlineButton[][] } {
  const token = submission.dashboardToken || submission.id;
  const dashUrl = `${PRIMARY_ORIGIN}/dashboard/${token}`;
  const creator = normalizeCreatorMention(submission.xHandle);
  const cleanHandle = creator ? creator.replace(/^@/, "") : "";
  const websiteUrl = safeHttpUrl(submission.website);

  const row1: TelegramInlineButton[] = [];
  if (cleanHandle) {
    row1.push({ text: `𝕏 Open @${cleanHandle}`, url: `https://x.com/${cleanHandle}` });
  } else if (submission.email) {
    const subject = encodeURIComponent(`Your PickMacApps submission: ${submission.appName}`);
    row1.push({ text: `✉️ Email Submitter`, url: `mailto:${submission.email}?subject=${subject}` });
  }
  row1.push({ text: `🔑 Open Dashboard`, url: dashUrl });

  const rows: TelegramInlineButton[][] = [row1];
  if (websiteUrl) {
    rows.push([{ text: `🌐 Visit Website`, url: websiteUrl }]);
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

  // Always prefer canonical non-redirecting host for Telegram webhooks (www -> apex 308 breaks Telegram POSTs)
  const cleanOrigin = origin && origin.startsWith("https://") && !origin.includes("www.pickmacapps.store")
    ? origin
    : PRIMARY_ORIGIN;
  const base = cleanOrigin.replace(/\/$/, "");
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
