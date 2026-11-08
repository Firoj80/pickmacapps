import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Field, Notice, fieldClass, useAdminNotice } from "@/components/admin-shell";
import { shelfCategories } from "@/lib/shelf-categories";
import { ensureAdminSession, fetchAppMetadataFn } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";
import { CheckIcon, SparklesIcon, SpinnerIcon } from "@/components/icons";

export const Route = createFileRoute("/admin/apps/new")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  component: NewAppPage,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "Add new app",
      description: "Create a new PickMacApps listing.",
      path: "/admin/apps/new",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function NewAppPage() {
  const notice = useAdminNotice();

  // Controlled form state identical to public submit app page
  const [website, setWebsite] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [demo, setDemo] = useState("");
  const [category, setCategory] = useState("productivity");
  const [pricing, setPricing] = useState<"free" | "freemium" | "paid">("free");
  const [status, setStatus] = useState<"published" | "draft" | "unpublished">("published");
  const [editorChoice, setEditorChoice] = useState(false);
  const [featuredTier, setFeaturedTier] = useState<"featured" | "article">("featured");
  const [isHot, setIsHot] = useState(false);

  // Auto-fetch status state
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<"idle" | "success" | "error">("idle");
  const [fetchMessage, setFetchMessage] = useState("");

  function handleNameChange(val: string) {
    setName(val);
    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug || slug === autoSlug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
    }
  }

  async function handleAutoFetch() {
    const target = website.trim();
    if (!target) {
      setFetchStatus("error");
      setFetchMessage("Please enter your app's website URL first.");
      return;
    }
    setFetching(true);
    setFetchStatus("idle");
    setFetchMessage("");

    try {
      const result = await fetchAppMetadataFn({ data: { url: target } });
      if (result.ok) {
        const data = result.data;
        if (data.name) {
          setName(data.name);
          if (!slug) {
            setSlug(data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
          }
        }
        if (data.website) setWebsite(data.website);
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
        if (data.category) fetchedFields.push("category");

        setFetchStatus("success");
        setFetchMessage(
          fetchedFields.length > 0
            ? `Successfully auto-populated: ${fetchedFields.join(", ")}.`
            : "Website fetched. Review and adjust details below."
        );
      } else {
        setFetchStatus("error");
        setFetchMessage(result.message || "Could not extract metadata from this site. Enter details manually.");
      }
    } catch {
      setFetchStatus("error");
      setFetchMessage("Failed to fetch site metadata. You can fill the details manually below.");
    } finally {
      setFetching(false);
    }
  }

  return (
    <AdminShell
      title="Add New App"
      lede="Direct admin publication with auto-fetch. Admin-created apps are permanently exempt from reciprocal badge checks."
      active="add_app"
      actions={
        <Link
          to="/admin/apps"
          preload="intent"
          className="rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink hover:bg-stone-50"
        >
          ← Back to Apps
        </Link>
      }
    >
      <Notice {...notice} />

      <form
        method="post"
        action="/api/admin/apps"
        className="max-w-2xl space-y-5 rounded-2xl border border-line bg-white p-6 shadow-xs"
      >
        <input type="hidden" name="intent" value="create" />

        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="text-base font-semibold tracking-[-0.02em] text-ink">App information</h3>
            <p className="text-xs text-muted">Provide the website URL to auto-fill or enter details manually.</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
            <SparklesIcon className="h-3 w-3" /> Auto-fill available
          </span>
        </div>

        {/* 1. Website URL with Auto-fetch Button (Matches Submit page) */}
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
              placeholder="https://yourmacapp.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAutoFetch();
                }
              }}
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
                  <span>Fetching…</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-3.5 w-3.5 text-accent" />
                  <span>Auto-fetch</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-muted">
            Enter the website and click <strong>Auto-fetch</strong>. We’ll automatically extract name, tagline, description, icon, demo screenshot, and category.
          </p>
        </div>

        {/* Auto-fetch notification banner */}
        {fetchStatus === "success" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
            <div className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-semibold">Details fetched: </span>
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

        {/* Live Visual Review Preview Card (Matches Submit page) */}
        {(icon || demo || name) && (
          <div className="rounded-xl border border-line bg-stone-50/70 p-4 transition-all">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">Review Preview</span>
              <span className="text-[10px] text-muted">Live preview</span>
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

        {/* 2. App Name & Slug Side-by-Side */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="App Name *" hint="Official product title">
            <input
              name="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Raycast"
              required
              className={fieldClass}
            />
          </Field>
          <Field label="Slug *" hint="URL path (e.g. /app/raycast)">
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. raycast"
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
            placeholder="e.g. An extendable launcher built for macOS productivity."
            required
            className={fieldClass}
          />
        </Field>

        {/* 4. Description */}
        <Field label="Description *" hint="Comprehensive markdown or text overview of features">
          <textarea
            name="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does your app do, who is it for, and why should Mac users try it?"
            required
            className={fieldClass}
          />
        </Field>

        {/* 5. App Icon URL & Demo Screenshot URL */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="App Icon URL" hint="Direct image link (square PNG / WebP / SVG)">
            <input
              name="icon"
              type="url"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="https://example.com/icon.png"
              className={fieldClass}
            />
          </Field>
          <Field label="Demo / Screenshot URL (Optional)" hint="Preview screenshot or video">
            <input
              name="demo"
              type="url"
              value={demo}
              onChange={(e) => setDemo(e.target.value)}
              placeholder="https://example.com/screenshot.png"
              className={fieldClass}
            />
          </Field>
        </div>

        {/* 6. Category & Pricing Model */}
        <div className="grid gap-4 sm:grid-cols-2">
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
          <Field label="Pricing Model *">
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
        </div>

        {/* 7. Publish Status */}
        <Field label="Publish Status">
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "published" | "draft" | "unpublished")}
            className={fieldClass}
          >
            <option value="published">Published (Visible immediately)</option>
            <option value="draft">Draft (Hidden)</option>
            <option value="unpublished">Unpublished (Archived)</option>
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
              className="h-4 w-4 rounded border-line text-ink focus:ring-accent"
            />
            <span>🌟 Feature in Editor’s Choice (Top Placement)</span>
          </label>

          {editorChoice ? (
            <div className="mt-3 space-y-2 border-t border-line/60 pt-3">
              <label className="block text-[13px] font-medium text-ink">
                Featured Tier Badge
              </label>
              <select
                name="featured_tier"
                value={featuredTier}
                onChange={(e) => setFeaturedTier(e.target.value as "featured" | "article")}
                className={fieldClass}
              >
                <option value="featured">
                  🔹 Blue Badge — Featured Placement ($99 Tier)
                </option>
                <option value="article">
                  🌟 Golden Badge — Featured + Medium Article ($120 Tier)
                </option>
              </select>
              <p className="text-[11px] text-muted">
                Max 3 apps per badge tier. Gold badge apps receive highest placement priority.
              </p>
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
              — displays fire badge and positions at top of all standard listings
            </span>
          </label>
        </div>

        {/* 10. Actions */}
        <div className="flex items-center gap-3 pt-3">
          <button
            type="submit"
            className="rounded-xl bg-ink px-6 py-2.5 text-sm font-medium text-canvas transition hover:opacity-90 cursor-pointer shadow-xs"
          >
            Create & Publish Listing
          </button>
          <Link
            to="/admin/apps"
            preload="intent"
            className="text-sm font-medium text-muted hover:text-ink"
          >
            Cancel
          </Link>
        </div>
      </form>
    </AdminShell>
  );
}
