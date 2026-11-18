import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Field, Notice, fieldClass, useAdminNotice } from "@/components/admin-shell";
import { normalizeCategorySlug, shelfCategories } from "@/lib/shelf-categories";
import { fetchAdminApp, ensureAdminSession, fetchAppMetadataFn, generateDashboardTokenFn } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";
import { BadgeCheckIcon, CheckIcon, SparklesIcon, SpinnerIcon } from "@/components/icons";
import { getHotDaysRemaining } from "@/lib/catalog";

export const Route = createFileRoute("/admin/apps/$id")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: ({ params }) => fetchAdminApp({ data: { id: params.id } }),
  component: EditApp,
  head: ({ matches, params }) => {
    const seo = buildMetadata({
      title: "Edit app",
      description: "Edit a PickMacApps listing.",
      path: `/admin/apps/${params.id}`,
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

type EditAppData = NonNullable<ReturnType<typeof Route.useLoaderData>>;

function EditApp() {
  const app = Route.useLoaderData();

  if (!app) {
    return (
      <AdminShell title="Missing app" active="apps">
        <p className="text-sm text-body">That app is not in the directory.</p>
      </AdminShell>
    );
  }

  return <EditAppForm app={app} />;
}

function EditAppForm({ app }: { app: EditAppData }) {
  const notice = useAdminNotice();

  // Controlled form state initialized from app data
  const [website, setWebsite] = useState(app.website || "");
  const [name, setName] = useState(app.name || "");
  const [slug, setSlug] = useState(app.slug || "");
  const [tagline, setTagline] = useState(app.tagline || "");
  const [description, setDescription] = useState(app.description || "");
  const [icon, setIcon] = useState(app.icon || "");
  const [demo, setDemo] = useState(app.demo || "");
  const [category, setCategory] = useState(normalizeCategorySlug(app.category) || "productivity");
  const [pricing, setPricing] = useState<"free" | "freemium" | "paid">(app.pricing as "free" | "freemium" | "paid" || "free");
  const [status, setStatus] = useState(app.status || "published");
  const [editorChoice, setEditorChoice] = useState(Boolean(app.editorChoice));
  const [featuredTier, setFeaturedTier] = useState<"featured" | "article">(
    (app.featuredTier as "featured" | "article") || "featured",
  );
  const [isHot, setIsHot] = useState(Boolean(app.isHot));
  const [xHandle, setXHandle] = useState(app.xHandle || "");
  const [checkBadge, setCheckBadge] = useState(Boolean(app.checkBadge));
  const [dashboardToken, setDashboardToken] = useState(app.dashboardToken || "");
  const [copied, setCopied] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);

  // Auto-fetch state
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<"idle" | "success" | "error">("idle");
  const [fetchMessage, setFetchMessage] = useState("");

  const blueActive = (app.otherFeaturedCount ?? 0) + (app.editorChoice && app.featuredTier !== "article" ? 1 : 0);
  const goldActive = (app.otherArticleCount ?? 0) + (app.editorChoice && app.featuredTier === "article" ? 1 : 0);

  async function handleGenerateToken(regenerate = false) {
    if (regenerate && !confirm("Generate a new secret dashboard link? The previous link will no longer work.")) {
      return;
    }
    setGeneratingToken(true);
    try {
      const res = await generateDashboardTokenFn({ data: { appId: app.id, regenerate } });
      if (res.ok && res.token) {
        setDashboardToken(res.token);
      }
    } catch (err) {
      console.error("Failed to generate token:", err);
    } finally {
      setGeneratingToken(false);
    }
  }

  function handleCopyDashboardUrl() {
    if (!dashboardToken) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://pickmacapps.com";
    const fullUrl = `${origin}/dashboard/${dashboardToken}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  async function handleAutoFetch() {
    const target = website.trim();
    if (!target) {
      setFetchStatus("error");
      setFetchMessage("Please enter a website URL first.");
      return;
    }
    setFetching(true);
    setFetchStatus("idle");
    setFetchMessage("");

    try {
      const result = await fetchAppMetadataFn({ data: { url: target } });
      if (result.ok) {
        const data = result.data;
        if (data.name) setName(data.name);
        if (data.tagline) setTagline(data.tagline);
        if (data.description) setDescription(data.description);
        if (data.icon) setIcon(data.icon);
        if (data.demo) setDemo(data.demo);
        if (data.pricing) setPricing(data.pricing);
        if (data.category) setCategory(data.category);
        if (data.xHandle && !xHandle) setXHandle(data.xHandle.replace(/^@/, ""));

        const fetchedFields: string[] = [];
        if (data.name) fetchedFields.push("name");
        if (data.tagline) fetchedFields.push("tagline");
        if (data.icon) fetchedFields.push("icon");
        if (data.demo) fetchedFields.push("preview image");
        if (data.xHandle && !xHandle) fetchedFields.push("X handle");

        setFetchStatus("success");
        setFetchMessage(
          fetchedFields.length > 0
            ? `Refreshed fields from website: ${fetchedFields.join(", ")}.`
            : "Fetched website details. Review below.",
        );
      } else {
        setFetchStatus("error");
        const errMsg = (result as { message?: string; error?: string }).message || (result as { message?: string; error?: string }).error;
        setFetchMessage(errMsg || "Could not re-fetch metadata from this site.");
      }
    } catch {
      setFetchStatus("error");
      setFetchMessage("Failed to connect to the website URL.");
    } finally {
      setFetching(false);
    }
  }

  return (
    <AdminShell
      title={`Edit App: ${app.name}`}
      lede="Update app details, refresh metadata from website, manage tier placement, or remove listing."
      active="apps"
      actions={
        <div className="flex items-center gap-2">
          {app.status === "published" ? (
            <Link
              to="/app/$slug"
              params={{ slug: app.slug }}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-semibold text-body hover:text-ink hover:border-line-2 transition"
            >
              <span>View Live</span>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>
          ) : null}
          <Link
            to="/admin/apps"
            preload="intent"
            className="rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink hover:bg-stone-50"
          >
            ← Back to Apps
          </Link>
        </div>
      }
    >
      <Notice {...notice} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Form Column (Col 7-8 / 12) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <form
            method="post"
            action="/api/admin/apps"
            className="space-y-5 rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-xs"
          >
            <input type="hidden" name="id" value={app.id} />

        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="text-base font-semibold tracking-[-0.02em] text-ink">App information</h3>
            <p className="text-xs text-muted">Update listing metadata or click Re-sync to refresh from the live website.</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
            <SparklesIcon className="h-3 w-3" /> Auto-sync enabled
          </span>
        </div>

        {/* 1. Website URL + Re-sync Button */}
        <div className="space-y-1.5">
          <label htmlFor="website" className="text-xs font-medium text-body">
            Website URL <span className="text-accent">*</span>
          </label>
          <div className="flex gap-2">
            <input
              id="website"
              name="website"
              type="url"
              required
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourmacapp.com"
              className={fieldClass}
            />
            <button
              type="button"
              disabled={fetching || !website.trim()}
              onClick={() => void handleAutoFetch()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs font-semibold text-ink transition-all hover:border-accent hover:bg-accent/5 disabled:opacity-50 cursor-pointer"
            >
              {fetching ? (
                <>
                  <SpinnerIcon className="h-3.5 w-3.5 text-ink" />
                  <span>Syncing…</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-3.5 w-3.5 text-accent" />
                  <span>Re-sync from site</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Auto-fetch notification banner */}
        {fetchStatus === "success" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
            <div className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-semibold">Re-synced: </span>
                <span>{fetchMessage}</span>
              </div>
            </div>
          </div>
        )}

        {fetchStatus === "error" && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            <div className="flex items-start gap-2">
              <span className="font-semibold shrink-0">Note:</span>
              <span>{fetchMessage}</span>
            </div>
          </div>
        )}

        {/* Live Visual Review Preview Card */}
        {(icon || demo || name) && (
          <div className="rounded-xl border border-line bg-stone-50/70 p-4 transition-all">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">Card Preview</span>
              <span className="text-[10px] text-muted">Live update</span>
            </div>
            <div className="flex items-start gap-3">
              {icon ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
                  <img
                    src={icon}
                    alt={name || "App icon"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-xs font-bold text-muted">
                  APP
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink truncate">{name || "App Name"}</span>
                  <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent capitalize">
                    {pricing}
                  </span>
                  {editorChoice ? (
                    featuredTier === "article" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        <BadgeCheckIcon className="h-3 w-3 shrink-0 fill-amber-500 text-stone-950" />
                        <span>Gold</span>
                      </span>
                    ) : (
                      <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
                        🔹 Blue
                      </span>
                    )
                  ) : null}
                  {isHot ? (
                    <span className="text-xs" role="img" aria-label="hot">
                      🔥
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-body line-clamp-1">{tagline || "Your short tagline"}</p>
              </div>
            </div>
            {demo && (
              <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface-2/40 dark:bg-[#141416]">
                <img
                  src={demo}
                  alt="Demo screenshot"
                  className="max-h-48 w-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* 2. Name & Slug */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="App Name *" hint="Official title">
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={fieldClass}
            />
          </Field>
          <Field label="Slug *" hint="URL identifier (/app/slug)">
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className={fieldClass}
            />
          </Field>
        </div>

        {/* 3. Tagline & X Handle */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tagline *" hint="Short 1-sentence value proposition">
            <input
              name="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              required
              className={fieldClass}
            />
          </Field>
          <Field label="X (Twitter) Handle" hint="Optional — @handle for creator attribution">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-muted">@</span>
              <input
                name="x_handle"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value.replace(/^@/, ""))}
                placeholder="creator_handle"
                className={`${fieldClass} pl-7`}
              />
            </div>
          </Field>
        </div>

        {/* 4. Description */}
        <Field label="Description *" hint="Comprehensive markdown overview">
          <textarea
            name="description"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className={fieldClass}
          />
        </Field>

        {/* 5. Icon & Demo URLs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="App Icon URL" hint="Square PNG / WebP link">
            <input
              name="icon"
              type="url"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Demo / Screenshot URL" hint="Video or screenshot link">
            <input
              name="demo"
              type="url"
              value={demo}
              onChange={(e) => setDemo(e.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>

        {/* 6. Pricing & Category */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price Model *">
            <select
              name="pricing"
              value={pricing}
              onChange={(e) => setPricing(e.target.value as "free" | "freemium" | "paid")}
              className={fieldClass}
            >
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
          <Field label="Category *">
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={fieldClass}
            >
              {shelfCategories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* 7. Status */}
        <Field label="Publish Status">
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={fieldClass}
          >
            <option value="published">Published (Visible immediately)</option>
            <option value="unpublished">Unpublished (Archived)</option>
            <option value="pending">Pending (Review Queue)</option>
            <option value="rejected">Rejected</option>
          </select>
        </Field>

        {/* 8. Placement & Badges */}
        <div className="space-y-3 rounded-xl border border-line bg-stone-50/50 p-4">
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink cursor-pointer">
            <input
              type="checkbox"
              name="editor_choice"
              checked={editorChoice}
              onChange={(e) => setEditorChoice(e.target.checked)}
              disabled={app.editorChoiceSlotsFull && !editorChoice}
              className="h-4 w-4 rounded border-line text-ink focus:ring-accent"
            />
            <span className="font-semibold text-ink">🌟 Feature in Editor’s Choice (Top Placement)</span>
          </label>

          {editorChoice ? (
            <div className="mt-3 space-y-3 border-t border-line/60 pt-3">
              <div>
                <label htmlFor="featured_tier" className="block text-xs font-medium text-ink mb-1.5">
                  Featured Tier & Badge Style (3 Blue + 3 Gold slots max)
                </label>
                <select
                  id="featured_tier"
                  name="featured_tier"
                  value={featuredTier}
                  onChange={(e) => setFeaturedTier(e.target.value as "featured" | "article")}
                  className={fieldClass}
                >
                  <option value="article">
                    🌟 Golden Badge — Featured + Medium Article ({Math.max(0, 6 - goldActive)}/6 available)
                  </option>
                  <option value="featured">
                    🔹 Blue Badge — Featured Placement (Legacy)
                  </option>
                </select>
                <p className="mt-1 text-[11px] text-muted">
                  All 6 paid slots are Gold badge. Blue badge is legacy.
                </p>
              </div>

              {/* Slot Live Counters */}
              <div className="space-y-1.5 rounded-lg border border-line bg-white p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-body flex items-center gap-1.5">
                    <span>🌟 Gold spots:</span>
                    <strong className="text-ink">{goldActive} / 6 active</strong>
                  </span>
                  {goldActive >= 6 ? (
                    <span className="font-semibold text-rose-600">Gold Full (6/6)</span>
                  ) : (
                    <span className="font-medium text-emerald-600">{6 - goldActive} spots free</span>
                  )}
                </div>
                {blueActive > 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="text-body flex items-center gap-1.5">
                      <span>🔹 Legacy Blue:</span>
                      <strong className="text-ink">{blueActive} active</strong>
                    </span>
                    <span className="text-muted">Discontinued</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* 9. Hot App Toggle */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5">
          <label className={`flex items-center gap-2.5 text-sm text-ink ${!app.isHot && (app.otherHotCount ?? 0) >= 6 ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
            <input
              type="checkbox"
              name="is_hot"
              checked={isHot}
              disabled={!app.isHot && (app.otherHotCount ?? 0) >= 6}
              onChange={(e) => setIsHot(e.target.checked)}
              className="h-4 w-4 rounded border-rose-400 text-rose-600 focus:ring-rose-500 disabled:opacity-50"
            />
            <span className="font-semibold text-rose-300 flex items-center gap-1.5">
              <span>🔥 Mark as Hot App</span>
              <span className="text-[11px] font-normal text-rose-400/80">
                ({app.isHot ? "Active" : `${app.otherHotCount ?? 0}/6 slots filled`})
              </span>
            </span>
            <span className="text-xs text-muted">
              — displays fire badge on cards and ranks in the top 6 hot shelf
            </span>
          </label>
          {!app.isHot && (app.otherHotCount ?? 0) >= 6 && (
            <p className="mt-2 text-xs text-rose-400">
              ⚠️ All 6 Hot slots are currently filled. To mark this app as Hot, remove Hot status from another app first.
            </p>
          )}
        </div>

        {/* 10. Automated Badge Check */}
        <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 space-y-3">
          <label className="flex items-start gap-2.5 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              name="check_badge"
              checked={checkBadge}
              onChange={(e) => setCheckBadge(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
            />
            <div className="flex-1">
              <span className="font-semibold text-sky-950 flex items-center gap-1.5">
                <span>🛡️ Mark for Automated PickMacApps Badge Check</span>
              </span>
              <p className="mt-0.5 text-xs text-sky-900 leading-relaxed">
                When enabled, the automated cron system verifies that this app's website displays the PickMacApps backlink badge. If missing, the app is auto-unpublished until restored.
              </p>
            </div>
          </label>

          {/* Current Badge Status Display */}
          <div className="rounded-lg border border-sky-200/80 bg-white p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted font-medium">Monitoring Status:</span>
              <span className={`font-semibold ${checkBadge || app.isUserSubmitted ? "text-emerald-700" : "text-stone-500"}`}>
                {checkBadge || app.isUserSubmitted ? "Active (Monitored)" : "Disabled (Exempt)"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted font-medium">Last Checked Result:</span>
              <span className="font-semibold text-ink">
                {app.badgeStatus === "ok" ? "✓ Badge Active" : app.badgeStatus === "missing" ? "✕ Badge Missing" : app.badgeStatus || "Unchecked"}
              </span>
            </div>
            {app.badgeDetail ? (
              <div className="text-[11px] text-muted border-t border-line/50 pt-1.5">
                Detail: {app.badgeDetail}
              </div>
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-line/70">
          <button
            type="submit"
            className="rounded-xl bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition hover:opacity-90 shadow-xs cursor-pointer"
          >
            Save Listing Changes
          </button>
          <Link
            to="/admin/apps"
            preload="intent"
            className="text-xs font-medium text-muted hover:text-ink"
          >
            Cancel
          </Link>
        </div>
          </form>
        </div>

        {/* Studio Sidebar: Live Preview & App Details (Col 5 / 12) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-4 lg:self-start">
          {/* 1. Live Interactive Preview Card */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <span>👁️</span> Live App Card Preview
              </span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                Visitor View
              </span>
            </div>

            <div className="mt-3 rounded-xl border border-line bg-stone-50/50 p-3.5 space-y-3">
              <div className="flex items-start gap-3">
                {icon ? (
                  <img
                    src={icon}
                    alt=""
                    className="h-11 w-11 rounded-xl object-cover ring-1 ring-line/80 shadow-2xs"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-200 text-sm font-bold text-stone-700">
                    {(name || "App").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-ink truncate">{name || "Untitled App"}</span>
                    {editorChoice ? (
                      <span className="shrink-0 rounded bg-amber-100 px-1 text-[9.5px] font-bold text-amber-800">
                        {featuredTier === "article" ? "🌟 Gold" : "🔹 Blue"}
                      </span>
                    ) : null}
                    {isHot ? (
                      <span className="shrink-0 rounded bg-rose-100 px-1 text-[9.5px] font-bold text-rose-700">
                        🔥
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted line-clamp-2">
                    {tagline || "Your app one-liner tagline will appear right here."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-line/60">
                <span className="rounded-md bg-white px-2 py-0.5 text-[10.5px] font-medium text-stone-700 border border-line capitalize">
                  {category} · {pricing}
                </span>
                <span className="font-semibold text-ink text-[11px] underline">
                  Try App →
                </span>
              </div>
            </div>
          </div>

          {/* 2. Analytics & Engagement Summary */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Engagement & Stats
            </span>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-line bg-stone-50/70 p-2.5">
                <div className="text-[10px] font-medium text-muted uppercase">Card Clicks</div>
                <div className="mt-1 text-lg font-bold text-ink">{app.clickCount ?? 0}</div>
              </div>
              <div className="rounded-xl border border-line bg-stone-50/70 p-2.5">
                <div className="text-[10px] font-medium text-muted uppercase">Try Referrals</div>
                <div className="mt-1 text-lg font-bold text-emerald-600">{app.tryCount ?? 0}</div>
              </div>
              <div className="rounded-xl border border-line bg-stone-50/70 p-2.5">
                <div className="text-[10px] font-medium text-muted uppercase">Upvotes</div>
                <div className="mt-1 text-lg font-bold text-ink">▲ {app.upvoteCount ?? 0}</div>
              </div>
            </div>

            {/* Hot Remaining Days */}
            {app.isHot && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-300">🔥 Hot Status Active</span>
                  <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[10.5px] font-bold text-rose-300 border border-rose-500/30">
                    {(() => {
                      const { daysLeft, formatted } = getHotDaysRemaining(app.hotMarkedAt, app.createdAt);
                      return `${daysLeft} days remaining (${formatted})`;
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Submitter & Quick Shortcuts Hub */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Submitter & Quick Links
            </span>

            <div className="space-y-2 text-xs">
              {dashboardToken ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-950 flex items-center gap-1.5">
                      <span>🔑</span> Secret Dashboard URL
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/90 rounded px-1.5 py-0.5">Private</span>
                  </div>

                  <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                    Share this secret link with the app developer so they can edit their listing and view real-time stats.
                  </p>

                  <div className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 font-mono text-[11px] text-stone-700 truncate">
                    <span className="truncate">/dashboard/{dashboardToken}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyDashboardUrl}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition cursor-pointer ${
                        copied
                          ? "bg-emerald-600 text-white"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="h-3.5 w-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <Link
                      to="/dashboard/$token"
                      params={{ token: dashboardToken }}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-300 bg-white py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition"
                    >
                      <span>Open ↗</span>
                    </Link>
                  </div>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      disabled={generatingToken}
                      onClick={() => void handleGenerateToken(true)}
                      className="text-[10.5px] text-indigo-600/80 hover:text-indigo-800 underline cursor-pointer disabled:opacity-50"
                    >
                      {generatingToken ? "Regenerating…" : "Regenerate secret link"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink flex items-center gap-1.5">
                      <span>🔑</span> Secret Dashboard
                    </span>
                    <span className="text-[10px] font-medium text-muted bg-stone-200/80 rounded px-1.5 py-0.5">Not Generated</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    No secret dashboard token has been created for this app yet. Generate one to share listing access with the app creator.
                  </p>
                  <button
                    type="button"
                    disabled={generatingToken}
                    onClick={() => void handleGenerateToken(false)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-canvas hover:opacity-90 transition cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {generatingToken ? (
                      <>
                        <SpinnerIcon className="h-3.5 w-3.5" />
                        <span>Generating…</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Generate Secret Dashboard URL</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {app.status === "published" && (
                <Link
                  to="/app/$slug"
                  params={{ slug: app.slug }}
                  target="_blank"
                  className="flex items-center justify-between rounded-xl border border-line bg-stone-50/70 p-2.5 font-medium text-ink hover:bg-stone-100 transition"
                >
                  <span>View Public Listing</span>
                  <span>↗</span>
                </Link>
              )}

              {app.website && (
                <a
                  href={app.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-line bg-stone-50/70 p-2.5 font-medium text-muted hover:text-ink transition"
                >
                  <span className="truncate">Visit {app.website}</span>
                  <span className="shrink-0 ml-1">↗</span>
                </a>
              )}
            </div>
          </div>

          {/* 4. Danger Zone */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-800">Danger Zone</h4>
            <p className="mt-1 text-xs text-muted">
              Permanently remove this listing from the database and public directory.
            </p>
            <form
              method="post"
              action="/api/admin/apps"
              className="mt-3"
              onSubmit={(e) => {
                if (!confirm(`Are you sure you want to permanently delete "${app.name}"?`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="id" value={app.id} />
              <button
                type="submit"
                className="w-full rounded-xl border border-rose-300 bg-white py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:border-rose-400 transition cursor-pointer"
              >
                Delete Listing Permanently
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
