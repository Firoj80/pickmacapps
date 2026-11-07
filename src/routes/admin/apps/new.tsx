import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Field, Notice, fieldClass, useAdminNotice } from "@/components/admin-shell";
import { shelfCategories } from "@/lib/shelf-categories";
import { ensureAdminSession } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

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
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editorChoice, setEditorChoice] = useState(false);
  const [featuredTier, setFeaturedTier] = useState<"featured" | "article">("featured");

  function handleNameChange(val: string) {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
    }
  }

  return (
    <AdminShell
      title="Add New App"
      lede="Direct admin publication. Admin-created apps are permanently exempt from free-listing badge checks."
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

      <form method="post" action="/api/admin/apps" className="max-w-2xl space-y-4 rounded-2xl border border-line bg-white p-6 shadow-xs">
        <input type="hidden" name="intent" value="create" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="App Name *">
            <input
              name="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Raycast"
              required
              className={fieldClass}
            />
          </Field>
          <Field label="Slug *" hint="URL path on site (e.g. /app/raycast)">
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

        <Field label="Website URL *" hint="Canonical product or download website">
          <input
            name="website"
            type="url"
            placeholder="https://example.com"
            required
            className={fieldClass}
          />
        </Field>

        <Field label="Tagline *" hint="Short 1-sentence value proposition">
          <input
            name="tagline"
            placeholder="e.g. An extendable launcher built for macOS productivity."
            required
            className={fieldClass}
          />
        </Field>

        <Field label="Description *" hint="Comprehensive markdown or text overview of features">
          <textarea
            name="description"
            rows={6}
            placeholder="Describe what makes this Mac app exceptional..."
            required
            className={fieldClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Icon URL" hint="Direct image link (square PNG / WebP / SVG)">
            <input
              name="icon"
              type="url"
              placeholder="https://example.com/icon.png"
              className={fieldClass}
            />
          </Field>
          <Field label="Demo / Video URL (Optional)" hint="YouTube or MP4 product preview">
            <input
              name="demo"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              className={fieldClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category *">
            <select name="category" defaultValue="utility" className={fieldClass}>
              {shelfCategories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pricing Model *">
            <select name="pricing" defaultValue="free" className={fieldClass}>
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
        </div>

        <Field label="Publish Status">
          <select name="status" defaultValue="published" className={fieldClass}>
            <option value="published">Published (Visible immediately)</option>
            <option value="draft">Draft (Hidden)</option>
            <option value="unpublished">Unpublished (Archived)</option>
          </select>
        </Field>

        {/* Tier Badges & Placement Options */}
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

        {/* Hot App Toggle */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5">
          <label className="flex items-center gap-2.5 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              name="is_hot"
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

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition hover:opacity-90"
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
