import { createServerFn } from "@tanstack/react-start";
import { site } from "@/lib/site";

export const fetchSiteOrigin = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequestUrl } = await import("@tanstack/start-server-core");
  return getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin;
});

export function originFrom(matches: ReadonlyArray<{ context: unknown }>) {
  const origin = (matches[0]?.context as { origin?: string } | undefined)?.origin;
  return origin ?? "";
}

export function canonicalPath(path: string) {
  const bare = (path.split("?")[0] ?? "").split("#")[0] || "/";
  const withSlash = bare.startsWith("/") ? bare : `/${bare}`;
  if (withSlash.length > 1 && withSlash.endsWith("/")) return withSlash.slice(0, -1);
  return withSlash;
}

export function absoluteUrl(origin: string, path: string) {
  const cleanOrigin = origin.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return cleanOrigin ? `${cleanOrigin}${cleanPath}` : cleanPath;
}

/** Keep a title within 60 characters. Never cut a word, and never add an ellipsis. */
export function fitTitle(title: string) {
  const base = title.replace(/\s+/g, " ").trim();
  const suffix = ` — ${site.name}`;
  const alreadyBranded =
    base === site.name || base.startsWith(`${site.name} —`) || base.endsWith(suffix) || base.endsWith(`- ${site.name}`);
  const branded = alreadyBranded ? base : `${base}${suffix}`;
  const chosen = branded.length <= 60 ? branded : base;
  if (chosen.length <= 60) return chosen;
  const slice = chosen.slice(0, 60);
  const space = slice.lastIndexOf(" ");
  const trimmed = (space >= 24 ? slice.slice(0, space) : slice).replace(/[\s.,;:|–—-]+$/g, "").trim();
  return trimmed || slice.trim();
}

/** Keep a description within 160 characters, on a word boundary, without adding an ellipsis. */
export function fitDescription(text: string, fallback: string = site.description) {
  const clean = text.replace(/\s+/g, " ").trim() || fallback;
  if (clean.length <= 160) return clean;
  const slice = clean.slice(0, 160);
  const space = slice.lastIndexOf(" ");
  const trimmed = (space >= 70 ? slice.slice(0, space) : slice).replace(/[\s.,;:]+$/g, "").trim();
  return trimmed.length >= 70 ? trimmed : slice.trim();
}

export function metaDescription(text: string, fallback: string = site.description) {
  return fitDescription(text, fallback);
}

export function canonical(origin: string, path: string) {
  return { rel: "canonical" as const, href: absoluteUrl(origin, canonicalPath(path)) };
}

export function markdownAlternate(origin: string, path: string) {
  const htmlPath = canonicalPath(path);
  const md = htmlPath === "/" ? "/index.md" : `${htmlPath}.md`;
  return { rel: "alternate" as const, type: "text/markdown", href: absoluteUrl(origin, md) };
}

type MetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

export function buildMetadata(input: {
  title: string;
  description: string;
  path: string;
  origin?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
}) {
  const title = fitTitle(input.title);
  const description = fitDescription(input.description);
  const path = canonicalPath(input.path);
  const origin = input.origin ?? "";
  const url = absoluteUrl(origin, path);
  const imagePath = input.image || site.ogImage;
  const image = absoluteUrl(origin, imagePath.startsWith("/") ? imagePath : `/${imagePath}`);
  const imageAlt = input.imageAlt || site.ogImageAlt;
  const meta: MetaTag[] = [
    { title },
    { name: "description", content: description },
    { name: "ai-summary", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:site_name", content: site.name },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: imageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
  if (!input.image || input.image === site.ogImage) {
    meta.push(
      { property: "og:image:width", content: site.ogImageWidth },
      { property: "og:image:height", content: site.ogImageHeight },
    );
  }
  if (input.publishedTime) meta.push({ property: "article:published_time", content: input.publishedTime });
  if (input.modifiedTime) meta.push({ property: "article:modified_time", content: input.modifiedTime });
  if (input.noindex) meta.push({ name: "robots", content: "noindex, follow" });
  return { title, description, meta, links: [canonical(origin, path)] };
}
