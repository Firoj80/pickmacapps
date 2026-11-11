import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSubmissionInlineKeyboard,
  escapeTelegramHtml,
  formatSubmissionNotification,
  isAuthorizedTelegramSender,
  parseSubmissionCallbackData,
  verifyTelegramWebhookSecret,
  type TelegramSubmissionInfo,
} from "./telegram.server.ts";

const sampleUuid = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";

const baseSubmission: TelegramSubmissionInfo = {
  id: sampleUuid,
  appName: "FocusBell <Pro>",
  website: "https://focusbell.app",
  tagline: "Stay on track & ship faster",
  email: "maker@focusbell.app",
  xHandle: "@focusbell",
  plan: "free",
  tier: "featured",
  pricing: "freemium",
  category: "Productivity",
  badgeOk: true,
  status: "pending",
};

test("escapeTelegramHtml escapes HTML special characters", () => {
  assert.equal(escapeTelegramHtml('<script>"A&B"</script>'), "&lt;script&gt;&quot;A&amp;B&quot;&lt;/script&gt;");
});

test("parseSubmissionCallbackData validates actions and stays under 64 bytes", () => {
  for (const action of ["approve", "apphot", "reject", "badge"] as const) {
    const raw = `sub:${action}:${sampleUuid}`;
    assert.ok(Buffer.byteLength(raw, "utf8") <= 64, `${raw} exceeds Telegram 64-byte callback limit`);
    assert.deepEqual(parseSubmissionCallbackData(raw), { action, submissionId: sampleUuid });
  }
  assert.equal(parseSubmissionCallbackData("sub:delete:123"), null);
  assert.equal(parseSubmissionCallbackData("invalid"), null);
  assert.equal(parseSubmissionCallbackData(""), null);
});

test("buildSubmissionInlineKeyboard returns interactive moderation buttons while pending", () => {
  const kb = buildSubmissionInlineKeyboard(baseSubmission);
  const allButtons = kb.inline_keyboard.flat();
  assert.ok(allButtons.some((b) => b.callback_data === `sub:approve:${sampleUuid}`));
  assert.ok(allButtons.some((b) => b.callback_data === `sub:apphot:${sampleUuid}`));
  assert.ok(allButtons.some((b) => b.callback_data === `sub:badge:${sampleUuid}`));
  assert.ok(allButtons.some((b) => b.callback_data === `sub:reject:${sampleUuid}`));
  assert.ok(allButtons.some((b) => b.url === "https://focusbell.app/"));

  const approvedKb = buildSubmissionInlineKeyboard({ ...baseSubmission, status: "approved" }, "focusbell-pro");
  assert.equal(approvedKb.inline_keyboard.flat().some((b) => b.callback_data), false);
  assert.ok(approvedKb.inline_keyboard.flat().some((b) => b.url === "https://pickmacapps.store/app/focusbell-pro"));
});

test("formatSubmissionNotification includes badge state, escaped app details, and approval URL", () => {
  const pendingText = formatSubmissionNotification(baseSubmission, {
    kind: "submitted",
    badgeNote: "live checked 12:00:00 UTC",
  });
  assert.match(pendingText, /NEW APP SUBMISSION/);
  assert.match(pendingText, /FocusBell &lt;Pro&gt;/);
  assert.match(pendingText, /Verified on site/);
  assert.match(pendingText, /live checked 12:00:00 UTC/);

  const paidText = formatSubmissionNotification(
    { ...baseSubmission, plan: "choice", tier: "article", status: "paid", badgeOk: false },
    { kind: "payment_succeeded" },
  );
  assert.match(paidText, /PAID SUBMISSION CONFIRMED/);
  assert.match(paidText, /Gold Featured/);
  assert.match(paidText, /Exempt \(Paid Sponsor\)/);

  const approvedText = formatSubmissionNotification(
    { ...baseSubmission, status: "approved", approvedSlug: "focusbell-pro" },
  );
  assert.match(approvedText, /APPROVED/);
  assert.match(approvedText, /https:\/\/pickmacapps\.store\/app\/focusbell-pro/);
});

test("isAuthorizedTelegramSender and verifyTelegramWebhookSecret enforce strict admin authorization", () => {
  assert.equal(isAuthorizedTelegramSender(123456, 123456, "123456"), true);
  assert.equal(isAuthorizedTelegramSender(999999, 123456, "123456"), true);
  assert.equal(isAuthorizedTelegramSender(999999, 999999, "123456"), false);
  assert.equal(isAuthorizedTelegramSender(123456, 123456, undefined), false);

  assert.equal(verifyTelegramWebhookSecret("secret-abc", "secret-abc", true), true);
  assert.equal(verifyTelegramWebhookSecret("wrong", "secret-abc", true), false);
  assert.equal(verifyTelegramWebhookSecret(null, "secret-abc", true), false);
  assert.equal(verifyTelegramWebhookSecret(null, "derived-secret", false), true);
  assert.equal(verifyTelegramWebhookSecret("wrong", "derived-secret", false), false);
});
