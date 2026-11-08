import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import { ScanMyDiskNote } from "@/components/scanmydisk-note";
import {
  pairFaqs,
  pairHeading,
  pairIntro,
  pairTitle,
  relatedPairs,
  resolveCompareSlug,
} from "@/lib/compare";
import { pricingLabel } from "@/lib/catalog";
import { compareGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";
import { publishedApps } from "@/lib/app-seed";

const ARCHIVE = "public, s-maxage=86400, stale-while-revalidate=604800";

export const Route = createFileRoute("/compare/$slug")({
  headers: () => ({ "Cache-Control": ARCHIVE }),
  beforeLoad: ({ params, context }) => {
    const directory = context.directory;
    const source = {
      apps: [...publishedApps(directory)],
      posts: directory?.posts ?? [],
    };
    const hit = resolveCompareSlug(params.slug, source);
    if (hit.status === "redirect") throw redirect({ href: hit.to, statusCode: 308 });
    if (hit.status === "hub") throw redirect({ href: "/compare", statusCode: 308 });
    if (hit.status === "missing") throw notFound();
  },
  component: ComparePage,
  head: ({ params, matches }) => {
    const directory = matches[0]?.context.directory;
    const source = {
      apps: [...publishedApps(directory)],
      posts: directory?.posts ?? [],
    };
    const hit = resolveCompareSlug(params.slug, source);
    if (hit.status !== "ok") {
      const missing = buildMetadata({
        title: pageCopy.notFound.title,
        description: pageCopy.notFound.description,
        path: `/compare/${params.slug}`,
        origin: originFrom(matches),
        noindex: true,
      });
      return { meta: missing.meta, links: missing.links };
    }
    const origin = originFrom(matches);
    const description = pairIntro(hit.pair);
    const socialDesc = `Compare ${hit.pair.left.name} vs ${hit.pair.right.name} (2026): Key differences, pricing, features, and alternatives for Mac users.`;
    const seo = buildMetadata({
      title: pairTitle(hit.pair),
      description,
      ogTitle: `${hit.pair.left.name} vs ${hit.pair.right.name} (2026) — Mac Comparison`,
      ogDescription: socialDesc,
      twitterTitle: `${hit.pair.left.name} vs ${hit.pair.right.name} (2026) — Mac Comparison`,
      twitterDescription: socialDesc,
      path: `/compare/${hit.pair.slug}`,
      origin,
    });
    const script = jsonLdScript(compareGraph(origin, hit.pair, pairFaqs(hit.pair)));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, `/compare/${hit.pair.slug}`)],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function ComparePage() {
  const { slug } = Route.useParams();
  const { directory } = Route.useRouteContext();
  const source = {
    apps: [...publishedApps(directory)],
    posts: directory?.posts ?? [],
  };
  const hit = resolveCompareSlug(slug, source);
  if (hit.status !== "ok") return null;
  const { pair } = hit;
  const faqs = pairFaqs(pair);
  const related = relatedPairs(pair, source);

  return (
    <main className="flex-1">
      {/* Modern Hero Section */}
      <section className="relative overflow-hidden border-b border-line px-4 pt-10 pb-10 sm:px-6 md:pt-14 md:pb-12 hero-grid">
        <div className="mx-auto max-w-[1360px]">
          {/* Breadcrumb Navigation */}
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-muted">
            <Link to="/" className="transition hover:text-ink">
              Home
            </Link>
            <span className="text-line-2">/</span>
            <Link to="/compare" className="transition hover:text-ink">
              Comparisons
            </Link>
            <span className="text-line-2">/</span>
            <span className="text-ink">{pairHeading(pair)}</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent uppercase tracking-wider">
              ⚔️ Direct Matchup · 2026 Edition
            </span>
            <h1 className="mt-3 text-[32px] font-bold tracking-[-0.035em] text-ink sm:text-[46px] md:leading-[1.12]">
              {pair.left.name} <span className="text-accent font-medium">vs</span> {pair.right.name}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-body sm:text-[16.5px]">
              {pairIntro(pair)}
            </p>
          </div>

          {/* Quick Head-to-Head Banner Cards */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-4xl">
            {/* Left App Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={pair.left.icon}
                  alt={pair.left.name}
                  onError={(e) => {
                    e.currentTarget.src = "/site-favicon.svg";
                  }}
                  className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-xs ring-1 ring-line"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-ink">{pair.left.name}</h3>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                        pair.left.pricing === "free"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : pair.left.pricing === "freemium"
                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          : "bg-surface-2 text-muted ring-1 ring-line"
                      }`}
                    >
                      {pricingLabel[pair.left.pricing] || "Paid"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{pair.left.tagline}</p>
                </div>
              </div>
              <Link
                to="/app/$slug"
                params={{ slug: pair.left.slug }}
                className="shrink-0 rounded-xl border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition-all"
              >
                View App →
              </Link>
            </div>

            {/* Right App Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={pair.right.icon}
                  alt={pair.right.name}
                  onError={(e) => {
                    e.currentTarget.src = "/site-favicon.svg";
                  }}
                  className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-xs ring-1 ring-line"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-ink">{pair.right.name}</h3>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                        pair.right.pricing === "free"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : pair.right.pricing === "freemium"
                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          : "bg-surface-2 text-muted ring-1 ring-line"
                      }`}
                    >
                      {pricingLabel[pair.right.pricing] || "Paid"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{pair.right.tagline}</p>
                </div>
              </div>
              <Link
                to="/app/$slug"
                params={{ slug: pair.right.slug }}
                className="shrink-0 rounded-xl border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition-all"
              >
                View App →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Breakdown Section */}
      <div className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6 lg:py-12">
        {/* Full Visual App Cards */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <h2 className="shrink-0 text-[18px] font-bold tracking-[-0.025em] text-ink sm:text-[20px]">
              Visual Previews
            </h2>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <AppCard app={pair.left} />
            <AppCard app={pair.right} />
          </div>
        </section>

        {pair.left.slug === "scanmydisk" || pair.right.slug === "scanmydisk" ? (
          <div className="mb-8">
            <ScanMyDiskNote />
          </div>
        ) : null}

        {/* Side-by-Side Specification Matrix */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <h2 className="shrink-0 text-[18px] font-bold tracking-[-0.025em] text-ink sm:text-[20px]">
              Side-by-Side Comparison Matrix
            </h2>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-surface-2/60 text-xs text-muted uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Specification
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold text-ink">
                    {pair.left.name}
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold text-ink">
                    {pair.right.name}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                <tr>
                  <td className="px-5 py-3.5 font-medium text-muted">Pricing Model</td>
                  <td className="px-5 py-3.5 font-semibold text-ink">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        pair.left.pricing === "free"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : pair.left.pricing === "freemium"
                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          : "bg-surface-2 text-muted ring-1 ring-line"
                      }`}
                    >
                      {pricingLabel[pair.left.pricing] || "Paid"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-ink">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        pair.right.pricing === "free"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : pair.right.pricing === "freemium"
                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          : "bg-surface-2 text-muted ring-1 ring-line"
                      }`}
                    >
                      {pricingLabel[pair.right.pricing] || "Paid"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-medium text-muted">Primary Category</td>
                  <td className="px-5 py-3.5 capitalize text-ink font-medium">{pair.left.category || "Utility"}</td>
                  <td className="px-5 py-3.5 capitalize text-ink font-medium">{pair.right.category || "Utility"}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-medium text-muted">Target Operating System</td>
                  <td className="px-5 py-3.5 text-ink">macOS Native</td>
                  <td className="px-5 py-3.5 text-ink">macOS Native</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-medium text-muted">Directory Curation</td>
                  <td className="px-5 py-3.5 text-ink">
                    {pair.left.editorChoice ? "🌟 Editor’s Choice" : "✓ Handpicked"}
                  </td>
                  <td className="px-5 py-3.5 text-ink">
                    {pair.right.editorChoice ? "🌟 Editor’s Choice" : "✓ Handpicked"}
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-medium text-muted">Official Site</td>
                  <td className="px-5 py-3.5">
                    <a
                      href={pair.left.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-accent hover:underline text-xs"
                    >
                      <span>Visit site</span>
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </td>
                  <td className="px-5 py-3.5">
                    <a
                      href={pair.right.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-accent hover:underline text-xs"
                    >
                      <span>Visit site</span>
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Editorial Guide Context Banner */}
        {pair.guides.length > 0 && (
          <section className="mb-12 rounded-2xl border border-line bg-surface p-6 shadow-xs">
            <h3 className="text-base font-semibold text-ink">Editorial Context</h3>
            <p className="mt-1 text-sm text-body leading-relaxed">
              Both {pair.left.name} and {pair.right.name} were analyzed together in our curated editorial guides:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pair.guides.map((guide) => (
                <Link
                  key={guide.slug}
                  to="/blog/$slug"
                  params={{ slug: guide.slug }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-3.5 py-1.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent transition-colors"
                >
                  <span>📖</span>
                  <span>{guide.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Comparisons Grid */}
        {related.length > 0 && (
          <section className="mb-14">
            <div className="mb-4 flex items-center gap-4">
              <h2 className="shrink-0 text-[18px] font-bold tracking-[-0.025em] text-ink sm:text-[20px]">
                Related Matchups
              </h2>
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to="/compare/$slug"
                  params={{ slug: item.slug }}
                  className="group flex items-center justify-between rounded-xl border border-line bg-surface p-3.5 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-line-2 hover:shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.left.icon}
                      alt={item.left.name}
                      onError={(e) => {
                        e.currentTarget.src = "/site-favicon.svg";
                      }}
                      className="h-8 w-8 rounded-lg object-cover ring-1 ring-line shrink-0"
                    />
                    <span className="text-xs font-bold text-accent">vs</span>
                    <img
                      src={item.right.icon}
                      alt={item.right.name}
                      onError={(e) => {
                        e.currentTarget.src = "/site-favicon.svg";
                      }}
                      className="h-8 w-8 rounded-lg object-cover ring-1 ring-line shrink-0"
                    />
                    <span className="truncate text-xs font-semibold text-ink group-hover:text-accent transition-colors">
                      {pairHeading(item)}
                    </span>
                  </div>
                  <span className="text-xs text-muted group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Modern FAQ Accordion Cards */}
        <section className="border-t border-line pt-10">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted uppercase tracking-wider">
                Common Questions
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">
                FAQ for {pair.left.name} vs {pair.right.name}
              </h2>
            </div>

            <div className="space-y-3.5">
              {faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-line bg-surface p-5 shadow-2xs"
                >
                  <h3 className="text-[15px] font-semibold text-ink">{faq.q}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-body">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
