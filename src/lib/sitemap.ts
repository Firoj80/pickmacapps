import { apps, appsInCategory, categories, posts } from "@/lib/catalog";
import { site } from "@/lib/site";

export const SITEMAP_SECTIONS = ["pages", "apps", "guides", "categories"] as const;
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number];

const SHARD = 45_000;
const CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";
const lastGood = new Map<string, string>();

export type SitemapUrl = { loc: string; lastmod?: string };

export function absoluteUrl(origin: string, path: string) {
  return `${origin.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function todayUtc(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** A real calendar date that is not in the future. Anything else is omitted. */
export function asLastmod(value: string | undefined, today: string) {
  if (!value) return undefined;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  if (day > today) return undefined;
  return day;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;");
}

export function urlSet(urls: SitemapUrl[]) {
  const body = urls
    .map((url) => {
      const last = url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : "";
      return `  <url><loc>${escapeXml(url.loc)}</loc>${last}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function sitemapIndex(locs: string[]) {
  const body = locs.map((loc) => `  <sitemap><loc>${escapeXml(loc)}</loc></sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export function sectionUrls(section: SitemapSection, origin: string, today = todayUtc()): SitemapUrl[] {
  if (section === "pages") {
    return [
      { loc: absoluteUrl(origin, "/") },
      { loc: absoluteUrl(origin, "/blog") },
      { loc: absoluteUrl(origin, "/submit") },
      { loc: absoluteUrl(origin, "/privacy"), lastmod: asLastmod(site.policyUpdated, today) },
    ];
  }
  if (section === "apps") {
    return apps.map((app) => ({
      loc: absoluteUrl(origin, `/app/${app.slug}`),
      lastmod: asLastmod(app.createdAt, today),
    }));
  }
  if (section === "guides") {
    return posts.map((post) => ({
      loc: absoluteUrl(origin, `/blog/${post.slug}`),
      lastmod: asLastmod(post.date, today),
    }));
  }
  return categories
    .filter((category) => appsInCategory(category.slug).length > 0)
    .map((category) => {
      const newest = appsInCategory(category.slug)
        .map((app) => app.createdAt)
        .sort()
        .at(-1);
      return {
        loc: absoluteUrl(origin, `/category/${category.slug}`),
        lastmod: asLastmod(newest, today),
      };
    });
}

export function indexLocs(origin: string, today = todayUtc()) {
  return SITEMAP_SECTIONS.filter((section) => sectionUrls(section, origin, today).length > 0).map((section) =>
    absoluteUrl(origin, `/sitemap/${section}.xml`),
  );
}

export function isSitemapSection(value: string): value is SitemapSection {
  return (SITEMAP_SECTIONS as readonly string[]).includes(value);
}

function xml(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": CACHE },
  });
}

export function sitemapResponse(kind: "index" | SitemapSection, origin: string) {
  const key = `${origin}:${kind}`;
  try {
    const today = todayUtc();
    const body =
      kind === "index"
        ? sitemapIndex(indexLocs(origin, today))
        : urlSet(sectionUrls(kind, origin, today));
    if (!body.includes("<loc>")) {
      return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
    lastGood.set(key, body);
    return xml(body);
  } catch (error) {
    console.error("[sitemap] failed to build", kind, error);
    const previous = lastGood.get(key);
    if (previous) return xml(previous);
    return new Response("Sitemap unavailable\n", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

export { SHARD };
