import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSubmissionInlineKeyboard,
  buildXPostInlineKeyboard,
  buildXPostTemplates,
  escapeTelegramHtml,
  formatSubmissionNotification,
  formatXPostTelegramMessage,
  isAuthorizedTelegramSender,
  normalizeCreatorMention,
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
  for (const action of ["approve", "apphot", "reject", "badge", "nobadge"] as const) {
    const raw = `sub:${action}:${sampleUuid}`;
    assert.ok(Buffer.byteLength(raw, "utf8") <= 64, `${raw} exceeds Telegram 64-byte callback limit`);
    assert.deepEqual(parseSubmissionCallbackData(raw), { action, submissionId: sampleUuid });
  }
  assert.equal(parseSubmissionCallbackData("sub:delete:123"), null);
  assert.equal(parseSubmissionCallbackData("invalid"), null);
  assert.equal(parseSubmissionCallbackData(""), null);
});

test("buildSubmissionInlineKeyboard returns interactive moderation buttons while pending", () => {
  // When badge is verified (badgeOk: true)
  const kb = buildSubmissionInlineKeyboard(baseSubmission);
  const allButtons = kb.inline_keyboard.flat();
  assert.ok(allButtons.some((b) => b.callback_data === `sub:approve:${sampleUuid}`));
  assert.ok(allButtons.some((b) => b.callback_data === `sub:apphot:${sampleUuid}`));
  assert.ok(allButtons.some((b) => b.callback_data === `sub:badge:${sampleUuid}`));
  assert.ok(allButtons.some((b) => b.callback_data === `sub:reject:${sampleUuid}`));
  assert.ok(allButtons.some((b) => b.url === "https://focusbell.app/"));

  // When badge is missing (badgeOk: false) on free listing: Approve is disabled
  const noBadgeKb = buildSubmissionInlineKeyboard({ ...baseSubmission, badgeOk: false });
  const noBadgeButtons = noBadgeKb.inline_keyboard.flat();
  assert.ok(noBadgeButtons.some((b) => b.callback_data === `sub:nobadge:${sampleUuid}`), "Must show disabled nobadge button");
  assert.equal(noBadgeButtons.some((b) => b.callback_data === `sub:approve:${sampleUuid}`), false, "Must not show approve button");
  assert.equal(noBadgeButtons.some((b) => b.callback_data === `sub:apphot:${sampleUuid}`), false, "Must not show apphot button");

  // Paid sponsor is exempt: Approve enabled even if badgeOk is false
  const paidKb = buildSubmissionInlineKeyboard({ ...baseSubmission, plan: "choice", badgeOk: false });
  const paidButtons = paidKb.inline_keyboard.flat();
  assert.ok(paidButtons.some((b) => b.callback_data === `sub:approve:${sampleUuid}`), "Paid sponsor has approve enabled");

  const approvedKb = buildSubmissionInlineKeyboard({ ...baseSubmission, status: "approved" }, "focusbell-pro");
  const approvedButtons = approvedKb.inline_keyboard.flat();
  assert.equal(approvedButtons.some((b) => b.callback_data?.startsWith("sub:approve:")), false);
  assert.equal(approvedButtons.some((b) => b.callback_data?.startsWith("sub:reject:")), false);
  assert.ok(approvedButtons.some((b) => b.callback_data === `sub:xpost:1:${sampleUuid}`));
  assert.ok(approvedButtons.some((b) => b.url === "https://pickmacapps.store/app/focusbell-pro"));
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

  const updateText = formatSubmissionNotification({
    ...baseSubmission,
    isUpdate: true,
    existingSlug: "focusbell-pro",
  });
  assert.match(updateText, /APP LISTING UPDATE SUBMISSION/);
  assert.match(updateText, /Current Live Page:<\/b> https:\/\/pickmacapps\.store\/app\/focusbell-pro/);

  const sponsorUpgradeText = formatSubmissionNotification({
    ...baseSubmission,
    plan: "choice",
    tier: "article",
    isUpdate: true,
    existingSlug: "focusbell-pro",
    status: "awaiting_payment",
  });
  assert.match(sponsorUpgradeText, /SPONSOR UPGRADE/);
  assert.match(sponsorUpgradeText, /Current Live Page:<\/b> https:\/\/pickmacapps\.store\/app\/focusbell-pro/);
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

test("parseSubmissionCallbackData parses xpost template callbacks within 64 bytes", () => {
  for (let i = 1; i <= 5; i++) {
    const raw = `sub:xpost:${i}:${sampleUuid}`;
    assert.ok(Buffer.byteLength(raw, "utf8") <= 64);
    assert.deepEqual(parseSubmissionCallbackData(raw), {
      action: "xpost",
      templateIndex: i,
      submissionId: sampleUuid,
    });
  }
  assert.equal(parseSubmissionCallbackData(`sub:xpost:0:${sampleUuid}`), null);
  assert.equal(parseSubmissionCallbackData(`sub:xpost:6:${sampleUuid}`), null);
});

test("normalizeCreatorMention and 5 X post templates include app, creator, tagline, links, and CTA", () => {
  assert.equal(normalizeCreatorMention("@firoj80"), "@firoj80");
  assert.equal(normalizeCreatorMention("firoj80"), "@firoj80");
  assert.equal(normalizeCreatorMention("https://x.com/firoj80/"), "@firoj80");
  assert.equal(normalizeCreatorMention(""), "");

  const templates = buildXPostTemplates(baseSubmission, "focusbell-pro");
  assert.equal(templates.length, 5);
  for (const tpl of templates) {
    assert.ok(tpl.text.includes("FocusBell <Pro>"));
    assert.ok(tpl.text.includes("@focusbell"));
    assert.ok(tpl.text.includes("Stay on track & ship faster"));
    assert.ok(tpl.text.includes("https://pickmacapps.store/app/focusbell-pro"));
    assert.ok(tpl.text.includes("https://pickmacapps.store/submit"));
  }

  const msg = formatXPostTelegramMessage(baseSubmission, 2, "focusbell-pro");
  assert.match(msg, /Template 2\/5/);
  assert.match(msg, /<pre>[\s\S]*FocusBell &lt;Pro&gt;/);

  const kb = buildXPostInlineKeyboard(baseSubmission, 2, "focusbell-pro");
  const buttons = kb.inline_keyboard.flat();
  assert.ok(buttons.some((b) => b.text === "• 2 •" && b.callback_data === `sub:xpost:2:${sampleUuid}`));
  assert.ok(buttons.some((b) => b.url?.startsWith("https://x.com/intent/tweet?text=")));
});
