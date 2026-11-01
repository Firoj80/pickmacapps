import { apps, categories, posts, type AppItem, type Post } from "@/lib/catalog";
import { comparePairs, hubLastmod, pairLastmod } from "@/lib/compare";
import { site } from "@/lib/site";

export const SITEMAP_SECTIONS = ["pages", "apps", "guides", "categories", "compare"] as const;
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

export function sectionUrls(
  section: SitemapSection,
  origin: string,
  today = todayUtc(),
  source?: { apps: AppItem[]; posts: Post[] },
): SitemapUrl[] {
  const list = source?.apps ?? apps;
  const guideList = source?.posts ?? posts;
  if (section === "pages") {
    const newestPostDate = guideList.map((p) => p.date).sort().at(-1);
    const newestAppDate = list.map((a) => a.createdAt).sort().at(-1);
    const latestSiteDate = [newestPostDate, newestAppDate, site.policyUpdated].filter(Boolean).sort().at(-1);
    return [
      { loc: absoluteUrl(origin, "/"), lastmod: asLastmod(latestSiteDate, today) },
      { loc: absoluteUrl(origin, "/blog"), lastmod: asLastmod(newestPostDate, today) },
      { loc: absoluteUrl(origin, "/about"), lastmod: asLastmod(site.policyUpdated, today) },
      { loc: absoluteUrl(origin, "/how-we-pick"), lastmod: asLastmod(site.policyUpdated, today) },
      { loc: absoluteUrl(origin, "/submit"), lastmod: asLastmod(site.policyUpdated, today) },
      { loc: absoluteUrl(origin, "/privacy"), lastmod: asLastmod(site.policyUpdated, today) },
    ];
  }
  if (section === "apps") {
    return list.map((app) => ({
      loc: absoluteUrl(origin, `/app/${app.slug}`),
      lastmod: asLastmod(app.createdAt, today),
    }));
  }
  if (section === "guides") {
    return guideList.map((post) => ({
      loc: absoluteUrl(origin, `/blog/${post.slug}`),
      lastmod: asLastmod(post.date, today),
    }));
  }
  if (section === "categories") {
    return categories
      .filter((category) => list.some((app) => app.category === category.slug))
      .map((category) => {
        const newest = list
          .filter((app) => app.category === category.slug)
          .map((app) => app.createdAt)
          .sort()
          .at(-1);
        return {
          loc: absoluteUrl(origin, `/category/${category.slug}`),
          lastmod: asLastmod(newest, today),
        };
      });
  }
  const pairs = comparePairs(source);
  return [
    { loc: absoluteUrl(origin, "/compare"), lastmod: asLastmod(hubLastmod(), today) },
    ...pairs.map((pair) => ({
      loc: absoluteUrl(origin, `/compare/${pair.slug}`),
      lastmod: asLastmod(pairLastmod(pair), today),
    })),
  ];
}

export function indexLocs(origin: string, today = todayUtc(), source?: { apps: AppItem[]; posts: Post[] }) {
  return SITEMAP_SECTIONS.filter((section) => sectionUrls(section, origin, today, source).length > 0).map((section) =>
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

export async function sitemapResponse(kind: "index" | SitemapSection, origin: string) {
  const key = `${origin}:${kind}`;
  let source: { apps: AppItem[]; posts: Post[] } | undefined;
  try {
    const { publishedDirectory } = await import("@/lib/directory.server");
    const directory = await publishedDirectory();
    source = { apps: directory.apps, posts: directory.posts };
  } catch (error) {
    console.error("[sitemap] directory unavailable", error);
  }
  try {
    const today = todayUtc();
    const body =
      kind === "index"
        ? sitemapIndex(indexLocs(origin, today, source))
        : urlSet(sectionUrls(kind, origin, today, source));
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
