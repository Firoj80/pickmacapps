import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Field, Notice, fieldClass, useAdminNotice } from "@/components/admin-shell";
import { normalizeCategorySlug, shelfCategories } from "@/lib/shelf-categories";
import { fetchAdminApp, ensureAdminSession, fetchAppMetadataFn } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";
import { CheckIcon, SparklesIcon, SpinnerIcon } from "@/components/icons";

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

function EditApp() {
  const app = Route.useLoaderData();
  const notice = useAdminNotice();

  if (!app) {
    return (
      <AdminShell title="Missing app" active="apps">
        <p className="text-sm text-body">That app is not in the directory.</p>
      </AdminShell>
    );
  }

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

  // Auto-fetch state
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<"idle" | "success" | "error">("idle");
  const [fetchMessage, setFetchMessage] = useState("");

  const blueActive = (app.otherFeaturedCount ?? 0) + (app.editorChoice && app.featuredTier !== "article" ? 1 : 0);
  const goldActive = (app.otherArticleCount ?? 0) + (app.editorChoice && app.featuredTier === "article" ? 1 : 0);

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

        const fetchedFields: string[] = [];
        if (data.name) fetchedFields.push("name");
        if (data.tagline) fetchedFields.push("tagline");
        if (data.icon) fetchedFields.push("icon");
        if (data.demo) fetchedFields.push("preview image");

        setFetchStatus("success");
        setFetchMessage(
          fetchedFields.length > 0
            ? `Refreshed fields from website: ${fetchedFields.join(", ")}.`
            : "Fetched website details. Review below.",
        );
      } else {
        setFetchStatus("error");
        setFetchMessage(result.message || "Could not re-fetch metadata from this site.");
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

      <form
        method="post"
        action="/api/admin/apps"
        className="max-w-2xl space-y-5 rounded-2xl border border-line bg-white p-6 shadow-xs"
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
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        🌟 Gold
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
              <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface">
                <img
                  src={demo}
                  alt="Demo screenshot"
                  className="max-h-40 w-full object-cover"
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

        {/* 3. Tagline */}
        <Field label="Tagline *" hint="Short 1-sentence value proposition">
          <input
            name="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            required
            className={fieldClass}
          />
        </Field>

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
                  {c.emoji} {c.name}
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
                  <option value="featured">
                    🔹 Blue Badge — Featured Placement ($99) ({Math.max(0, 3 - blueActive)}/3 available)
                  </option>
                  <option value="article">
                    🌟 Golden Badge — Featured + Medium Article ($120) ({Math.max(0, 3 - goldActive)}/3 available)
                  </option>
                </select>
                <p className="mt-1 text-[11px] text-muted">
                  Gold badge apps appear with highest priority at the top, followed by Blue badge apps. Max 3 apps per tier.
                </p>
              </div>

              {/* Slot Live Counters */}
              <div className="space-y-1.5 rounded-lg border border-line bg-white p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-body flex items-center gap-1.5">
                    <span>🔹 Blue spots:</span>
                    <strong className="text-ink">{blueActive} / 3 active</strong>
                  </span>
                  {blueActive >= 3 ? (
                    <span className="font-semibold text-rose-600">Blue Full (3/3)</span>
                  ) : (
                    <span className="font-medium text-emerald-600">{3 - blueActive} spots free</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body flex items-center gap-1.5">
                    <span>🌟 Gold spots:</span>
                    <strong className="text-ink">{goldActive} / 3 active</strong>
                  </span>
                  {goldActive >= 3 ? (
                    <span className="font-semibold text-rose-600">Gold Full (3/3)</span>
                  ) : (
                    <span className="font-medium text-emerald-600">{3 - goldActive} spots free</span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 9. Hot App Toggle */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5">
          <label className="flex items-center gap-2.5 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              name="is_hot"
              checked={isHot}
              onChange={(e) => setIsHot(e.target.checked)}
              className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="font-semibold text-rose-800 flex items-center gap-1.5">
              <span>🔥 Mark as Hot App</span>
            </span>
            <span className="text-xs text-muted">
              — displays fire badge on cards and ranks directly below paid featured apps
            </span>
          </label>
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

      {/* Danger Zone */}
      <div className="mt-8 max-w-2xl rounded-2xl border border-rose-200 bg-rose-50/30 p-5">
        <h4 className="text-sm font-semibold text-rose-800">Danger Zone</h4>
        <p className="mt-1 text-xs text-muted">
          Permanently remove this app listing from the PickMacApps database and public catalog.
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
            className="rounded-xl border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:border-rose-400 transition cursor-pointer"
          >
            Delete Listing Permanently
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
