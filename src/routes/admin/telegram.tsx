import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell, Notice, useAdminNotice } from "@/components/admin-shell";
import { fetchAdminHome, ensureAdminSession, getCachedAdminHome } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/telegram")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: () => getCachedAdminHome(),
  component: TelegramAdminPage,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "Telegram Bot — Admin",
      description: "Manage Telegram moderation bot for instant alerts and approvals.",
      path: "/admin/telegram",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function TelegramAdminPage() {
  const data = Route.useLoaderData();
  const notice = useAdminNotice();
  const configured = Boolean(data.stats.telegramConfigured);

  return (
    <AdminShell
      title="Telegram Moderation Bot"
      lede="Receive instant push notifications for new submissions, live badge verify, and approve/reject directly via Telegram."
      active="telegram"
    >
      <Notice {...notice} />

      <div className="max-w-3xl space-y-6">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-ink">Bot Connection Status</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  configured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {configured ? "Active & Configured" : "Configuration Needed"}
              </span>
            </div>
            <form method="post" action="/api/admin/telegram">
              <button
                type="submit"
                disabled={!configured}
                className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-canvas hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
              >
                Connect & Test Webhook
              </button>
            </form>
          </div>

          <div className="mt-5 space-y-3 rounded-xl border border-line bg-stone-50/70 p-4 text-xs">
            {configured ? (
              <>
                <p className="font-semibold text-emerald-700">✅ TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID are detected</p>
                <p className="text-muted leading-relaxed">
                  Interactive moderation buttons are active. When a creator submits an app, the bot delivers:
                </p>
                <ul className="list-disc list-inside space-y-1 text-body/90 pl-1">
                  <li>Submission notification with live details</li>
                  <li>🔍 Check Badge live on website</li>
                  <li>Approve & Publish / Make Hot buttons</li>
                  <li>Reject submission button</li>
                  <li>5 ready-to-use X post template selectors</li>
                  <li>Submitter Mini-Dashboard secret link</li>
                </ul>
              </>
            ) : (
              <>
                <p className="font-semibold text-ink">Required Environment Variables on your hosting provider (Vercel):</p>
                <ul className="space-y-1 text-muted font-mono text-[11px]">
                  <li><strong className="text-ink">TELEGRAM_BOT_TOKEN</strong> — from @BotFather</li>
                  <li><strong className="text-ink">TELEGRAM_ADMIN_CHAT_ID</strong> — your chat ID (send /id to bot)</li>
                  <li><strong className="text-ink">TELEGRAM_WEBHOOK_SECRET</strong> — (optional, auto-generated)</li>
                </ul>
              </>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
