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

      <div className="max-w-4xl space-y-6">
        {/* Status Deck */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Bot Service</span>
            <div className="mt-1 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${configured ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-xl font-bold text-ink">
                {configured ? "Online" : "Needs Config"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted">Telegram Bot API</p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Push Notifications</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-ink">Instant</span>
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">Real-time</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">New submissions delivery</p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Inline Moderation</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-emerald-600">Active</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">Approve, Reject & Badge Check</p>
          </div>
        </div>

        {/* Connection & Webhook Configuration */}
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Webhook & Bot Connection</h2>
              <p className="text-xs text-muted">Manage the Telegram webhook endpoint for instant server callbacks.</p>
            </div>
            <form method="post" action="/api/admin/telegram">
              <button
                type="submit"
                disabled={!configured}
                className="w-full sm:w-auto rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-canvas hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
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
                  <li>Submission notification with live app details & creator info</li>
                  <li>🔍 Check Badge button (live reciprocal link audit)</li>
                  <li>Approve Free & Approve + Hot 30-day buttons</li>
                  <li>Reject submission button</li>
                  <li>📋 Draft Submitter Confirmation DM button with mini-dashboard link</li>
                  <li>Direct link to creator's 𝕏 handle profile</li>
                  <li>5 ready-to-use 𝕏 launch post templates upon approval</li>
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
