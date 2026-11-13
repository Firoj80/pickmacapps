import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import { Missing } from "@/components/missing";
import { pricingLabel, type Pricing, type AppItem } from "@/lib/catalog";
import { shelfCategories } from "@/lib/shelf-categories";
import { fetchDashboardAppFn } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/dashboard/$token")({
  loader: async ({ params }) => {
    const app = await fetchDashboardAppFn({ data: { token: params.token } });
    if (!app) throw notFound();
    return { app, token: params.token };
  },
  component: SubmitterDashboardPage,
  notFoundComponent: () => (
    <Missing
      title="Dashboard not found"
      body="The secret dashboard link is invalid. Please check your submission confirmation link."
    />
  ),
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: "App Submitter Dashboard — PickMacApps",
      description: "Manage your Mac app listing and view engagement stats.",
      path: "/dashboard",
      origin,
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function SubmitterDashboardPage() {
  const { app, token } = Route.useLoaderData();

  const [tagline, setTagline] = useState(app.tagline);
  const [description, setDescription] = useState(app.description);
  const [demo, setDemo] = useState(app.demo || "");
  const [pricing, setPricing] = useState<Pricing>(app.pricing);
  const [category, setCategory] = useState(app.category);
  const [icon, setIcon] = useState(app.icon || "");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const isPending = Boolean(app.isSubmissionPending);
  const isApproved = app.status === "published" || app.status === "approved";
  const isRejected = app.status === "rejected";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus("idle");
    setMessage("");

    try {
      const res = await fetch(`/api/dashboard/${token}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tagline,
          description,
          demo,
          pricing,
          category,
          icon,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setSaveStatus("success");
        setMessage("Listing changes saved successfully!");
      } else {
        setSaveStatus("error");
        setMessage(data.error || "Failed to update listing.");
      }
    } catch {
      setSaveStatus("error");
      setMessage("Network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Status Alert Banner */}
      {isPending ? (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50/80 p-5 shadow-xs dark:border-amber-700/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-lg">⏳</span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Submission Status: Pending Review
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                  {app.status === "awaiting_payment" ? "Awaiting Payment" : "In Review Queue"}
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Your app has been submitted to PickMacApps! Our team is currently reviewing your submission. You can bookmark this page to check your status anytime or make edits before approval.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-amber-800 font-mono">
                <span>Plan: <strong>{app.editorChoice ? `Sponsor (${app.featuredTier === "article" ? "Gold Tier" : "Blue Tier"})` : "Free Community"}</strong></span>
                {app.badgeStatus === "ok" ? <span>· Badge: <strong className="text-emerald-700">✓ Verified</strong></span> : null}
              </div>
            </div>
          </div>
        </div>
      ) : isRejected ? (
        <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50/80 p-5 shadow-xs dark:border-rose-700/50 dark:bg-rose-950/30">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-lg">❌</span>
            <div>
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Submission Status: Rejected
              </h3>
              <p className="mt-1 text-xs text-rose-800/90 dark:text-rose-300/90 leading-relaxed">
                This submission could not be approved. Ensure your website is accessible, has genuine macOS utility, and if on the free tier, contains the PickMacApps backlink badge.
              </p>
            </div>
          </div>
        </div>
      ) : isApproved ? (
        <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 shadow-xs dark:border-emerald-700/50 dark:bg-emerald-950/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-sm">✅</span>
              <div>
                <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Status: Approved & Live on PickMacApps!
                </h3>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  Your listing is public and visible in the directory.
                </p>
              </div>
            </div>
            <Link
              to="/app/$slug"
              params={{ slug: app.slug }}
              target="_blank"
              className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition"
            >
              View Live Page ↗
            </Link>
          </div>
        </div>
      ) : null}

      {/* Header */}
      <div className="border-b border-line pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={app.icon || "/site-favicon.svg"}
              alt={app.name}
              className="h-12 w-12 rounded-2xl object-cover ring-1 ring-line shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{app.name}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    isPending
                      ? "bg-amber-100 text-amber-800"
                      : isRejected
                      ? "bg-rose-100 text-rose-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {isPending ? "Pending Review" : isRejected ? "Rejected" : "Published"}
                </span>
              </div>
              <p className="text-xs text-muted">
                Creator Dashboard · Private Link (keep secret)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPending && (
              <Link
                to="/app/$slug"
                params={{ slug: app.slug }}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface-2 transition"
              >
                <span>View Public Page</span>
                <span className="text-xs">↗</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards (or Skeleton if Pending) */}
      <div className="mt-6">
        {isPending ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Analytics (Unlocks on Approval)</span>
              <span className="text-[11px] text-amber-600 font-medium">⏳ Starts counting when live</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-dashed border-line bg-surface-2/40 p-4 text-center">
                <div className="text-xs font-medium text-muted">Card Clicks</div>
                <div className="mt-2 text-2xl font-bold text-muted/50">--</div>
                <div className="mt-1 text-[11px] text-muted/70">Awaiting approval</div>
              </div>
              <div className="rounded-2xl border border-dashed border-line bg-surface-2/40 p-4 text-center">
                <div className="text-xs font-medium text-muted">Try App Clicks</div>
                <div className="mt-2 text-2xl font-bold text-muted/50">--</div>
                <div className="mt-1 text-[11px] text-muted/70">Awaiting approval</div>
              </div>
              <div className="rounded-2xl border border-dashed border-line bg-surface-2/40 p-4 text-center">
                <div className="text-xs font-medium text-muted">Upvotes</div>
                <div className="mt-2 text-2xl font-bold text-muted/50">▲ 0</div>
                <div className="mt-1 text-[11px] text-muted/70">Community votes</div>
              </div>
              <div className="rounded-2xl border border-dashed border-line bg-surface-2/40 p-4 text-center">
                <div className="text-xs font-medium text-muted">Review Queue</div>
                <div className="mt-2 text-sm font-bold text-amber-600">Pending</div>
                <div className="mt-1 text-[11px] text-muted/70">Usually &lt; 24h</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">Card Clicks</div>
              <div className="mt-2 text-3xl font-extrabold text-ink">{app.clickCount ?? 0}</div>
              <div className="mt-1 text-[11px] text-muted">Directory views</div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">Try App Clicks</div>
              <div className="mt-2 text-3xl font-extrabold text-sky-600 dark:text-sky-400">{app.tryCount ?? 0}</div>
              <div className="mt-1 text-[11px] text-muted">Referrals to your site</div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">Upvotes</div>
              <div className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">▲ {app.upvoteCount ?? 0}</div>
              <div className="mt-1 text-[11px] text-muted">Community support</div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">Placement</div>
              <div className="mt-2 text-lg font-bold text-ink">
                {app.editorChoice ? (
                  app.featuredTier === "article" ? (
                    <span className="text-amber-600 dark:text-amber-400">🌟 Gold Tier</span>
                  ) : (
                    <span className="text-sky-600 dark:text-sky-400">🔹 Blue Tier</span>
                  )
                ) : app.isHot ? (
                  <span className="text-rose-600">🔥 Hot App</span>
                ) : (
                  <span className="text-muted">Standard Free</span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-muted">Current status</div>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Callout if Free */}
      {!app.editorChoice ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-sky-400/40 bg-sky-50/40 p-5 dark:bg-sky-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-bold text-sky-700 dark:text-sky-300">
                ⭐ Upgrade Listing
              </span>
              <h3 className="mt-1.5 text-base font-bold text-ink">Boost {app.name} with Top Placement</h3>
              <p className="mt-0.5 text-xs text-body leading-relaxed max-w-xl">
                Get placed at the very top of the directory with a Blue or Gold Verified badge, dofollow backlink, and 10x more visibility.
              </p>
            </div>
            <Link
              to="/submit"
              search={{ tier: "featured" }}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition"
            >
              Upgrade to Blue / Gold ↗
            </Link>
          </div>
        </div>
      ) : null}

      {/* Edit Form */}
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-xs">
        <h2 className="text-lg font-bold tracking-tight text-ink">
          {isPending ? "Review & Edit Listing Details" : "Edit Listing Details"}
        </h2>
        <p className="mt-1 text-xs text-muted">
          {isPending
            ? "You can make adjustments to your listing details right now before our review team approves it."
            : "Keep your listing fresh. You can edit tagline, description, cover image/video URL, and pricing anytime."}
        </p>

        {saveStatus === "success" ? (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            ✓ {message}
          </div>
        ) : null}
        {saveStatus === "error" ? (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
            ✕ {message}
          </div>
        ) : null}

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-body">Tagline (short pitch)</label>
            <input
              type="text"
              required
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-body">Description</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-body">Pricing Model</label>
              <select
                value={pricing}
                onChange={(e) => setPricing(e.target.value as Pricing)}
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              >
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-body">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              >
                {shelfCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-body">App Icon URL</label>
            <input
              type="url"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="https://example.com/icon.png"
              className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-body">Demo / Cover Screenshot URL</label>
            <input
              type="url"
              value={demo}
              onChange={(e) => setDemo(e.target.value)}
              placeholder="https://example.com/preview.png"
              className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-ink px-5 py-2.5 text-xs font-bold text-canvas shadow-xs hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving Changes…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Card Preview */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
          {isPending ? "Card Preview (How it will look once live)" : "Live Card Preview"}
        </h3>
        <div className="max-w-sm">
          <AppCard app={app} />
        </div>
      </div>
    </div>
  );
}
