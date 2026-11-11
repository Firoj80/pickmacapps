import { createFileRoute } from "@tanstack/react-router";

interface TelegramUpdate {
  callback_query?: {
    id: string;
    from?: { id?: number | string };
    data?: string;
    message?: {
      message_id: number;
      chat?: { id?: number | string };
    };
  };
  message?: {
    chat?: { id?: number | string };
    from?: { id?: number | string };
    text?: string;
  };
}

export const Route = createFileRoute("/api/telegram/webhook")({
  server: {
    handlers: {
      GET: async () => {
        const { isTelegramConfigured } = await import("@/lib/telegram.server");
        return Response.json({ ok: true, configured: isTelegramConfigured() });
      },
      POST: async ({ request }) => {
        const { env } = await import("@/lib/env.server");
        const {
          answerTelegramCallback,
          buildSubmissionInlineKeyboard,
          editTelegramMessage,
          escapeTelegramHtml,
          formatSubmissionNotification,
          getTelegramWebhookSecret,
          isAuthorizedTelegramSender,
          isTelegramConfigured,
          parseSubmissionCallbackData,
          sendTelegramMessage,
          verifyTelegramWebhookSecret,
        } = await import("@/lib/telegram.server");

        const explicitSecret = env("TELEGRAM_WEBHOOK_SECRET");
        const expectedSecret = getTelegramWebhookSecret();
        const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
        const secretValid = verifyTelegramWebhookSecret(headerSecret, expectedSecret, Boolean(explicitSecret));
        if (!secretValid) {
          return new Response("Unauthorized\n", { status: 401 });
        }

        let update: TelegramUpdate;
        try {
          update = (await request.json()) as TelegramUpdate;
        } catch {
          return new Response("Invalid JSON\n", { status: 400 });
        }

        const adminChatId = env("TELEGRAM_ADMIN_CHAT_ID");

        // Handle text commands (/start, /id, /pending)
        if (update.message) {
          const chatId = update.message.chat?.id;
          const fromId = update.message.from?.id;
          const text = String(update.message.text ?? "").trim();

          if (chatId !== undefined && (text === "/start" || text.startsWith("/start ") || text === "/id")) {
            const authorized = isAuthorizedTelegramSender(fromId, chatId, adminChatId);
            await sendTelegramMessage(
              chatId,
              [
                "👋 <b>PickMacApps Moderation Bot</b>",
                "",
                `Your Telegram Chat ID: <code>${escapeTelegramHtml(String(chatId))}</code>`,
                authorized
                  ? "✅ This chat is authorized as <b>Admin</b>. You will receive new app notifications here."
                  : "🔒 Set <code>TELEGRAM_ADMIN_CHAT_ID</code> to this ID in your server environment to authorize moderation.",
              ].join("\n"),
            );
            return Response.json({ ok: true });
          }

          if (chatId !== undefined && text === "/pending") {
            if (!isTelegramConfigured() || !isAuthorizedTelegramSender(fromId, chatId, adminChatId)) {
              await sendTelegramMessage(chatId, "🔒 Unauthorized. Only the configured Admin chat can view pending submissions.");
              return Response.json({ ok: true });
            }
            const { listPendingSubmissionsForTelegram } = await import("@/lib/directory.server");
            const pending = await listPendingSubmissionsForTelegram(5);
            if (!pending.length) {
              await sendTelegramMessage(chatId, "✅ No pending submissions right now.");
              return Response.json({ ok: true });
            }
            for (const sub of pending) {
              await sendTelegramMessage(
                chatId,
                formatSubmissionNotification(sub, { kind: sub.status === "paid" ? "payment_succeeded" : "submitted" }),
                buildSubmissionInlineKeyboard(sub),
              );
            }
            return Response.json({ ok: true });
          }

          return Response.json({ ok: true });
        }

        // Handle inline button clicks
        const callback = update.callback_query;
        if (!callback) return Response.json({ ok: true });

        const fromId = callback.from?.id;
        const chatId = callback.message?.chat?.id;
        const messageId = callback.message?.message_id;

        if (!isTelegramConfigured() || !isAuthorizedTelegramSender(fromId, chatId, adminChatId)) {
          await answerTelegramCallback(callback.id, "Unauthorized admin action.", true);
          return Response.json({ ok: true });
        }

        const parsed = parseSubmissionCallbackData(callback.data ?? "");
        if (!parsed) {
          await answerTelegramCallback(callback.id, "Unknown action.", true);
          return Response.json({ ok: true });
        }

        const {
          approveSubmission,
          getSubmissionById,
          rejectSubmission,
          updateSubmissionBadgeStatus,
        } = await import("@/lib/directory.server");
        const { checkBadgeOnPage } = await import("@/lib/badge");
        const { submitToIndexNow, urlsForAppChange } = await import("@/lib/indexnow");
        const { PRIMARY_ORIGIN } = await import("@/lib/seo");

        const submission = await getSubmissionById(parsed.submissionId);
        if (!submission) {
          await answerTelegramCallback(callback.id, "Submission not found in database.", true);
          return Response.json({ ok: true });
        }

        if (parsed.action === "badge") {
          const check = await checkBadgeOnPage(submission.website);
          await updateSubmissionBadgeStatus(submission.id, check.ok);
          const refreshed: typeof submission = { ...submission, badgeOk: check.ok };
          const checkedAt = new Date().toISOString().slice(11, 19) + " UTC";

          await answerTelegramCallback(
            callback.id,
            check.ok ? "✅ Badge verified on website!" : `❌ ${check.message}`,
            !check.ok,
          );

          if (chatId !== undefined && messageId !== undefined) {
            await editTelegramMessage(
              chatId,
              messageId,
              formatSubmissionNotification(refreshed, {
                badgeNote: check.ok
                  ? `live checked ${checkedAt}`
                  : `${check.message} · ${checkedAt}`,
              }),
              buildSubmissionInlineKeyboard(refreshed),
            );
          }
          return Response.json({ ok: true });
        }

        if (parsed.action === "approve" || parsed.action === "apphot") {
          try {
            const makeHot = parsed.action === "apphot";
            const created = await approveSubmission(submission.id, { makeHot });
            submitToIndexNow(PRIMARY_ORIGIN, urlsForAppChange(PRIMARY_ORIGIN, created.slug));

            const updated = (await getSubmissionById(submission.id)) ?? {
              ...submission,
              status: "approved",
              approvedSlug: created.slug,
            };

            await answerTelegramCallback(
              callback.id,
              makeHot ? `🔥 Approved & marked Hot: ${created.name}` : `✅ Approved & published: ${created.name}`,
            );

            if (chatId !== undefined && messageId !== undefined) {
              await editTelegramMessage(
                chatId,
                messageId,
                formatSubmissionNotification(updated, {
                  approvedSlug: created.slug,
                  badgeNote: makeHot ? "Published + 🔥 Hot" : undefined,
                }),
                buildSubmissionInlineKeyboard(updated, created.slug),
              );
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : "Could not approve submission.";
            await answerTelegramCallback(callback.id, `⚠️ ${message}`, true);
          }
          return Response.json({ ok: true });
        }

        if (parsed.action === "reject") {
          try {
            await rejectSubmission(submission.id);
            const updated = (await getSubmissionById(submission.id)) ?? {
              ...submission,
              status: "rejected",
            };
            await answerTelegramCallback(callback.id, `❌ Rejected: ${submission.appName}`);
            if (chatId !== undefined && messageId !== undefined) {
              await editTelegramMessage(
                chatId,
                messageId,
                formatSubmissionNotification(updated),
                buildSubmissionInlineKeyboard(updated),
              );
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : "Could not reject submission.";
            await answerTelegramCallback(callback.id, `⚠️ ${message}`, true);
          }
          return Response.json({ ok: true });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
