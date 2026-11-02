import { useMemo, useState } from "react";
import { apps, categories, posts, type AppItem } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

function appShareImage(demo?: string) {
  const clean = demo?.trim() ?? "";
  if (!clean || /\.mp4($|\?)/i.test(clean)) return site.ogImage;
  return clean;
}

type PreviewTarget =
  | { kind: "home" }
  | { kind: "app"; slug: string }
  | { kind: "category"; slug: string }
  | { kind: "guide"; slug: string };

export function OgPreviewModal({
  open,
  onClose,
  appList = apps,
}: {
  open: boolean;
  onClose: () => void;
  appList?: AppItem[];
}) {
  const [target, setTarget] = useState<PreviewTarget>({ kind: "home" });
  const [platform, setPlatform] = useState<"twitter" | "opengraph" | "raw">("twitter");

  const origin = typeof window !== "undefined" ? window.location.origin : "https://pickmacapps.com";
  const host = useMemo(() => {
    try {
      return new URL(origin).host;
    } catch {
      return "pickmacapps.com";
    }
  }, [origin]);

  const cardData = useMemo(() => {
    if (target.kind === "home") {
      return {
        label: "Homepage (/)",
        imageSrc: site.ogImage,
        ...buildMetadata({
          title: site.title,
          description: site.description,
          path: "/",
          origin,
        }),
      };
    }
    if (target.kind === "app") {
      const app = appList.find((item) => item.slug === target.slug) ?? appList[0];
      if (!app) {
        return {
          label: "Homepage (/)",
          imageSrc: site.ogImage,
          ...buildMetadata({ title: site.title, description: site.description, path: "/", origin }),
        };
      }
      const tagline = app.tagline.trim();
      const joiner = /[.!?]$/.test(tagline) ? " " : ". ";
      const imageSrc = appShareImage(app.demo);
      return {
        label: `${app.name} (/app/${app.slug})`,
        imageSrc,
        ...buildMetadata({
          title: `${app.name} — ${tagline}`,
          description: `${app.name}: ${tagline}${joiner}${app.description}`,
          path: `/app/${app.slug}`,
          origin,
          image: imageSrc,
          imageAlt: `${app.name} — ${tagline}`,
        }),
      };
    }
    if (target.kind === "category") {
      const category = categories.find((item) => item.slug === target.slug) ?? categories[0];
      return {
        label: `${category.name} (/category/${category.slug})`,
        imageSrc: site.ogImage,
        ...buildMetadata({
          title: `${category.name} Mac Apps`,
          description: category.paragraphs[0] ?? site.description,
          path: `/category/${category.slug}`,
          origin,
        }),
      };
    }
    const post = posts.find((item) => item.slug === target.slug) ?? posts[0];
    return {
      label: `Guide: ${post.title}`,
      imageSrc: site.ogImage,
      ...buildMetadata({
        title: post.title,
        description: post.excerpt,
        path: `/blog/${post.slug}`,
        origin,
        type: "article",
        publishedTime: post.date,
      }),
    };
  }, [target, appList, origin]);

  if (!open) return null;

  const canonicalUrl = cardData.links[0]?.href ?? origin;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-canvas shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink">
              Social Share Card Preview (1200 × 630)
            </h2>
            <p className="text-xs text-muted">
              Live OpenGraph &amp; X/Twitter card rendering across directory pages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-surface-2 p-1">
              <button
                type="button"
                onClick={() => setPlatform("twitter")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  platform === "twitter" ? "bg-canvas text-ink shadow-xs" : "text-muted hover:text-ink"
                }`}
              >
                X / Twitter
              </button>
              <button
                type="button"
                onClick={() => setPlatform("opengraph")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  platform === "opengraph" ? "bg-canvas text-ink shadow-xs" : "text-muted hover:text-ink"
                }`}
              >
                Slack / Discord
              </button>
              <button
                type="button"
                onClick={() => setPlatform("raw")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  platform === "raw" ? "bg-canvas text-ink shadow-xs" : "text-muted hover:text-ink"
                }`}
              >
                Full 1200×630 Image
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
            >
              Close
            </button>
          </div>
        </div>

        {/* Page preset switcher */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/50 px-6 py-3">
          <button
            type="button"
            onClick={() => setTarget({ kind: "home" })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              target.kind === "home"
                ? "bg-ink text-canvas"
                : "border border-line bg-canvas text-body hover:text-ink"
            }`}
          >
            Homepage (/og.jpg)
          </button>
          <button
            type="button"
            onClick={() => setTarget({ kind: "app", slug: "helumi" })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              target.kind === "app" && target.slug === "helumi"
                ? "bg-ink text-canvas"
                : "border border-line bg-canvas text-body hover:text-ink"
            }`}
          >
            App: Helumi
          </button>
          <button
            type="button"
            onClick={() => setTarget({ kind: "app", slug: "shottr" })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              target.kind === "app" && target.slug === "shottr"
                ? "bg-ink text-canvas"
                : "border border-line bg-canvas text-body hover:text-ink"
            }`}
          >
            App: Shottr
          </button>
          <button
            type="button"
            onClick={() => setTarget({ kind: "app", slug: "anytype" })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              target.kind === "app" && target.slug === "anytype"
                ? "bg-ink text-canvas"
                : "border border-line bg-canvas text-body hover:text-ink"
            }`}
          >
            App: Anytype
          </button>
          <button
            type="button"
            onClick={() => setTarget({ kind: "guide", slug: "best-ulysses-alternative-writing" })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              target.kind === "guide"
                ? "bg-ink text-canvas"
                : "border border-line bg-canvas text-body hover:text-ink"
            }`}
          >
            Guide (/blog)
          </button>

          <select
            aria-label="Inspect another app share card"
            value={target.kind === "app" ? target.slug : ""}
            onChange={(e) => {
              if (e.target.value) setTarget({ kind: "app", slug: e.target.value });
            }}
            className="ml-auto rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink outline-none"
          >
            <option value="">Inspect any app ({appList.length})…</option>
            {appList.map((app) => (
              <option key={app.slug} value={app.slug}>
                {app.name} (/app/{app.slug})
              </option>
            ))}
          </select>
        </div>

        {/* Body */}
        <div className="grid flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-12">
          {/* Visual Card Preview */}
          <div className="lg:col-span-7">
            {platform === "twitter" ? (
              <div className="overflow-hidden rounded-2xl border border-line bg-canvas shadow-xs">
                <div className="aspect-[1200/630] w-full overflow-hidden border-b border-line bg-surface-2">
                  <img
                    src={cardData.imageSrc === "/og.jpg" ? "/og.jpg?v=2" : cardData.imageSrc}
                    alt={cardData.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1 p-4">
                  <p className="text-xs text-muted">{host}</p>
                  <p className="truncate text-[15px] font-semibold text-ink">{cardData.title}</p>
                  <p className="clamp-2 text-xs leading-relaxed text-body">{cardData.description}</p>
                </div>
              </div>
            ) : null}

            {platform === "opengraph" ? (
              <div className="rounded-xl border border-line bg-surface-2/60 p-4">
                <p className="text-xs font-semibold text-ink">{site.name}</p>
                <p className="mt-1 text-sm font-semibold text-blue-600">{cardData.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-body">{cardData.description}</p>
                <div className="mt-3 aspect-[1200/630] w-full overflow-hidden rounded-lg border border-line bg-canvas">
                  <img
                    src={cardData.imageSrc === "/og.jpg" ? "/og.jpg?v=2" : cardData.imageSrc}
                    alt={cardData.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ) : null}

            {platform === "raw" ? (
              <div className="overflow-hidden rounded-xl border border-line bg-surface-2">
                <img
                  src={cardData.imageSrc === "/og.jpg" ? "/og.jpg?v=2" : cardData.imageSrc}
                  alt={cardData.title}
                  referrerPolicy="no-referrer"
                  className="aspect-[1200/630] w-full object-cover"
                />
              </div>
            ) : null}
          </div>

          {/* Meta Tags Inspector */}
          <div className="flex flex-col justify-between space-y-4 lg:col-span-5">
            <div className="space-y-3 rounded-xl border border-line bg-surface-2/40 p-4 text-xs">
              <div>
                <p className="font-semibold text-muted">og:title ({cardData.title.length}/60 chars)</p>
                <p className="mt-0.5 font-medium text-ink">{cardData.title}</p>
              </div>
              <div className="border-t border-line pt-2.5">
                <p className="font-semibold text-muted">
                  og:description ({cardData.description.length}/160 chars)
                </p>
                <p className="mt-0.5 leading-relaxed text-body">{cardData.description}</p>
              </div>
              <div className="border-t border-line pt-2.5">
                <p className="font-semibold text-muted">og:image &amp; twitter:image</p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-ink">{cardData.imageSrc}</p>
              </div>
              <div className="border-t border-line pt-2.5">
                <p className="font-semibold text-muted">Canonical &amp; og:url</p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-body">{canonicalUrl}</p>
              </div>
              <div className="border-t border-line pt-2.5">
                <p className="font-semibold text-muted">Dimensions &amp; Card Type</p>
                <p className="mt-0.5 font-mono text-[11px] text-body">
                  1200 × 630 · summary_large_image
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
