import { createServerFn } from "@tanstack/react-start";
import { PRIMARY_ORIGIN, site } from "@/lib/site";

export { PRIMARY_ORIGIN };

export const fetchSiteOrigin = createServerFn({ method: "GET" }).handler(async () => {
  if (process.env.NODE_ENV === "production") {
    return PRIMARY_ORIGIN;
  }
  const { getRequestUrl } = await import("@tanstack/start-server-core");
  const reqOrigin = getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin;
  if (reqOrigin && reqOrigin.includes("pickmacapps.store")) {
    return PRIMARY_ORIGIN;
  }
  const envUrl = process.env.APP_URL?.trim();
  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    return envUrl.replace(/\/$/, "");
  }
  return reqOrigin || PRIMARY_ORIGIN;
});

export function originFrom(matches: ReadonlyArray<{ context: unknown }>) {
  const origin = (matches[0]?.context as { origin?: string } | undefined)?.origin;
  return origin || PRIMARY_ORIGIN;
}

export function canonicalPath(path: string) {
  const bare = (path.split("?")[0] ?? "").split("#")[0] || "/";
  const withSlash = bare.startsWith("/") ? bare : `/${bare}`;
  if (withSlash.length > 1 && withSlash.endsWith("/")) return withSlash.slice(0, -1);
  return withSlash;
}

export function absoluteUrl(origin: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const cleanOrigin = origin.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return cleanOrigin ? `${cleanOrigin}${cleanPath}` : cleanPath;
}

const DANGLING_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "nor",
  "to",
  "for",
  "with",
  "without",
  "in",
  "on",
  "of",
  "by",
  "from",
  "at",
  "as",
  "into",
  "that",
  "which",
  "who",
  "where",
  "when",
  "while",
  "after",
  "before",
  "then",
  "also",
  "is",
  "are",
  "has",
  "have",
  "can",
  "will",
  "you",
  "your",
  "it",
  "its",
  "them",
  "those",
  "this",
  "these",
  "one-time",
  "paid",
  "drafted",
  "zero",
  "sold",
  "keeps",
  "opens",
  "choose",
  "notch",
  "turn",
]);

function stripDanglingTail(value: string, minLength: number) {
  let current = value.replace(/[\s.,;:|–—-]+$/g, "").trim();
  while (current.length > minLength) {
    const lastSpace = current.lastIndexOf(" ");
    if (lastSpace < minLength) break;
    const lastWord = current.slice(lastSpace + 1).toLowerCase();
    if (!DANGLING_WORDS.has(lastWord)) break;
    current = current.slice(0, lastSpace).replace(/[\s.,;:|–—-]+$/g, "").trim();
  }
  return current;
}

/** Keep a title within 60 characters. Never cut a word, and never add an ellipsis. */
export function fitTitle(title: string) {
  const base = title.replace(/\s+/g, " ").trim();
  const suffix = ` — ${site.name}`;
  const alreadyBranded =
    base === site.name ||
    base.startsWith(`${site.name} —`) ||
    base.endsWith(suffix) ||
    base.endsWith(`- ${site.name}`) ||
    base.endsWith(`| ${site.name}`) ||
    base.includes(site.name);
  const branded = alreadyBranded ? base : `${base}${suffix}`;
  const chosen = branded.length <= 60 ? branded : base;
  if (chosen.length <= 60) return chosen;
  const slice = chosen.slice(0, 60);
  const comma = slice.lastIndexOf(", ");
  if (comma >= 34) {
    return slice.slice(0, comma).replace(/[\s.,;:|–—-]+$/g, "").trim();
  }
  const space = slice.lastIndexOf(" ");
  const trimmed = stripDanglingTail(space >= 24 ? slice.slice(0, space) : slice, 24);
  return trimmed || slice.trim();
}

/** Keep a description within 160 characters, on a word boundary, without adding an ellipsis or dangling stop-words. */
export function fitDescription(text: string, fallback: string = site.description) {
  const clean = text.replace(/\s+/g, " ").trim() || fallback;
  if (clean.length <= 160) return clean;
  const slice = clean.slice(0, 160);
  const period = slice.lastIndexOf(". ");
  if (period >= 75) {
    return slice.slice(0, period + 1).trim();
  }
  const comma = slice.lastIndexOf(", ");
  if (comma >= 105) {
    const atComma = stripDanglingTail(slice.slice(0, comma), 70);
    if (atComma.length >= 70) return atComma;
  }
  const space = slice.lastIndexOf(" ");
  const candidate = (space >= 70 ? slice.slice(0, space) : slice).replace(/[\s.,;:]+$/g, "").trim();
  const trimmed = stripDanglingTail(candidate, 70);
  return trimmed.length >= 70 ? trimmed : candidate || slice.trim();
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
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}) {
  const title = fitTitle(input.title);
  const description = fitDescription(input.description);
  const ogTitle = input.ogTitle ? fitTitle(input.ogTitle) : title;
  const ogDescription = input.ogDescription ? fitDescription(input.ogDescription) : description;
  const twitterTitle = input.twitterTitle ? fitTitle(input.twitterTitle) : title;
  const twitterDescription = input.twitterDescription ? fitDescription(input.twitterDescription) : description;
  const path = canonicalPath(input.path);
  const origin = input.origin ?? "";
  const url = absoluteUrl(origin, path);
  const imagePath = input.image || site.ogImage;
  const image = /^https?:\/\//i.test(imagePath)
    ? imagePath
    : absoluteUrl(origin, imagePath.startsWith("/") ? imagePath : `/${imagePath}`);
  const imageAlt = input.imageAlt || site.ogImageAlt;
  const meta: MetaTag[] = [
    { title },
    { name: "description", content: description },
    { name: "ai-summary", content: description },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: ogDescription },
    { property: "og:url", content: url },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:site_name", content: site.name },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: imageAlt },
    { property: "og:image:width", content: site.ogImageWidth },
    { property: "og:image:height", content: site.ogImageHeight },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@hiii_firoj" },
    { name: "twitter:creator", content: "@hiii_firoj" },
    { name: "twitter:title", content: twitterTitle },
    { name: "twitter:description", content: twitterDescription },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: imageAlt },
    { name: "apple-mobile-web-app-title", content: title },
  ];
  if (input.publishedTime) meta.push({ property: "article:published_time", content: input.publishedTime });
  if (input.modifiedTime) meta.push({ property: "article:modified_time", content: input.modifiedTime });
  if (input.noindex) meta.push({ name: "robots", content: "noindex, follow" });
  return { title, description, meta, links: [canonical(origin, path)] };
}
