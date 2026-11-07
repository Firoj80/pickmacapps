import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { comparePairs, hubFaqs, hubIntro, hubTitle, pairHeading } from "@/lib/compare";
import { pricingLabel } from "@/lib/catalog";
import { publishedApps } from "@/lib/app-seed";
import { ScanMyDiskNote } from "@/components/scanmydisk-note";
import { compareHubGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";

const ARCHIVE = "public, s-maxage=86400, stale-while-revalidate=604800";

export const Route = createFileRoute("/compare/")({
  headers: () => ({ "Cache-Control": ARCHIVE }),
  component: CompareHub,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const directory = matches[0]?.context.directory;
    const pairs = comparePairs({
      apps: [...publishedApps(directory)],
      posts: directory?.posts ?? [],
    });
    const description = hubIntro(pairs);
    const seo = buildMetadata({
      title: hubTitle(pairs.length),
      description,
      path: "/compare",
      origin,
    });
    const script = jsonLdScript(
      compareHubGraph(
        origin,
        pairs.map((pair) => ({ name: pairHeading(pair), slug: pair.slug })),
        hubFaqs(pairs),
      ),
    );
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/compare")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function CompareHub() {
  const { directory } = Route.useRouteContext();
  const pairs = comparePairs({
    apps: [...publishedApps(directory)],
    posts: directory?.posts ?? [],
  });
  const faqs = hubFaqs(pairs);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "freemium" | "paid">("all");

  const filtered = pairs.filter((pair) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      pair.left.name.toLowerCase().includes(q) ||
      pair.right.name.toLowerCase().includes(q) ||
      pair.left.tagline.toLowerCase().includes(q) ||
      pair.right.tagline.toLowerCase().includes(q) ||
      pairHeading(pair).toLowerCase().includes(q);

    if (!matchesQuery) return false;

    if (filter === "free") {
      return pair.left.pricing === "free" || pair.right.pricing === "free";
    }
    if (filter === "freemium") {
      return pair.left.pricing === "freemium" || pair.right.pricing === "freemium";
    }
    if (filter === "paid") {
      return pair.left.pricing === "paid" || pair.right.pricing === "paid";
    }
    return true;
  });

  return (
    <main className="flex-1">
      {/* Modern Hero Section */}
      <section className="relative overflow-hidden border-b border-line px-4 pt-10 pb-10 sm:px-6 md:pt-14 md:pb-12 hero-grid">
        <div className="mx-auto max-w-[1360px]">
          {/* Breadcrumb navigation */}
          <nav className="mb-6 flex items-center gap-2 text-xs font-medium text-muted">
            <Link to="/" className="transition hover:text-ink">
              Home
            </Link>
            <span className="text-line-2">/</span>
            <span className="text-ink">Comparisons</span>
          </nav>

          <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent uppercase tracking-wider">
                ⚖️ Head-to-Head Comparisons
              </span>
              <h1 className="mt-3 text-[32px] font-bold tracking-[-0.035em] text-ink sm:text-[44px] md:leading-[1.12]">
                Compare Mac Apps Side-by-Side
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-body sm:text-[16.5px]">
                Direct, unbiased breakdowns of popular Mac utilities and tools. Compare pricing models, feature sets, and find the perfect fit for your workflow.
              </p>
            </div>

            {/* Quick Stats Metrics Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0">
              <div className="rounded-xl border border-line bg-surface px-3.5 py-2 text-left shadow-2xs">
                <p className="text-[11px] font-medium text-muted">Total Matchups</p>
                <p className="text-base font-bold text-ink">{pairs.length} Pairs</p>
              </div>
              <div className="rounded-xl border border-line bg-surface px-3.5 py-2 text-left shadow-2xs">
                <p className="text-[11px] font-medium text-muted">Integrity</p>
                <p className="text-base font-bold text-ink">100% Unbiased</p>
              </div>
              <div className="rounded-xl border border-line bg-surface px-3.5 py-2 text-left shadow-2xs">
                <p className="text-[11px] font-medium text-muted">Updated For</p>
                <p className="text-base font-bold text-ink">macOS 2026</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6 lg:py-10">
        {/* Search and Filters Toolbar */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-md">
            <svg
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search comparisons (e.g. Shottr, Raycast, MacWhisper)..."
              aria-label="Search comparisons"
              className="h-11 w-full rounded-xl border border-line bg-surface pr-4 pl-10 text-[14px] text-ink placeholder:text-muted shadow-xs transition-colors hover:border-line-2 focus-visible:border-accent focus-visible:outline-none"
            />
          </div>

          {/* Pricing Filter Buttons */}
          <div className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl bg-surface-2 p-1 border border-line">
            {(
              [
                ["all", "All Matchups"],
                ["free", "Has Free"],
                ["freemium", "Has Freemium"],
                ["paid", "Has Paid"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`h-9 rounded-lg px-3 text-[13px] font-medium transition-all ${
                  filter === id
                    ? "bg-ink text-canvas shadow-xs font-semibold"
                    : "text-body hover:text-ink hover:bg-surface/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {pairs.some((pair) => pair.left.slug === "scanmydisk" || pair.right.slug === "scanmydisk") ? (
          <div className="mb-6">
            <ScanMyDiskNote />
          </div>
        ) : null}

        {/* Comparison Matchup Cards Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-2xl">
              🔍
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink">No comparisons found</h3>
            <p className="mt-1 text-sm text-muted">
              We couldn’t find any comparisons matching "{query}". Try clearing your search or filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="mt-4 inline-flex items-center rounded-xl bg-surface-2 border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-surface"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((pair) => {
              const guide = pair.guides[0];
              return (
                <Link
                  key={pair.slug}
                  to="/compare/$slug"
                  params={{ slug: pair.slug }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-line-2 hover:shadow-md"
                >
                  <div>
                    {/* Head-to-Head Visual Header */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Left App */}
                      <div className="flex flex-1 items-center gap-2.5 min-w-0">
                        <img
                          src={pair.left.icon}
                          alt={pair.left.name}
                          onError={(e) => {
                            e.currentTarget.src = "/site-favicon.svg";
                          }}
                          className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-xs ring-1 ring-line"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14.5px] font-semibold text-ink group-hover:text-accent transition-colors">
                            {pair.left.name}
                          </p>
                          <span
                            className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
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
                      </div>

                      {/* VS Center Badge */}
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 border border-accent/25 text-[10.5px] font-extrabold text-accent shadow-xs group-hover:scale-110 group-hover:bg-accent group-hover:text-canvas transition-all">
                        VS
                      </div>

                      {/* Right App */}
                      <div className="flex flex-1 items-center justify-end gap-2.5 min-w-0 text-right">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14.5px] font-semibold text-ink group-hover:text-accent transition-colors">
                            {pair.right.name}
                          </p>
                          <span
                            className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
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
                        <img
                          src={pair.right.icon}
                          alt={pair.right.name}
                          onError={(e) => {
                            e.currentTarget.src = "/site-favicon.svg";
                          }}
                          className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-xs ring-1 ring-line"
                        />
                      </div>
                    </div>

                    {/* App Tagline Highlights */}
                    <div className="mt-4 space-y-1.5 rounded-xl border border-line/60 bg-surface-2/60 p-3 text-xs leading-relaxed text-body">
                      <p className="line-clamp-1">
                        <strong className="font-semibold text-ink">{pair.left.name}:</strong> {pair.left.tagline}
                      </p>
                      <p className="line-clamp-1">
                        <strong className="font-semibold text-ink">{pair.right.name}:</strong> {pair.right.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3 text-xs">
                    <span className="truncate max-w-[190px] text-muted" title={guide?.title}>
                      {guide ? `From ${guide.title}` : "Curated comparison"}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
                      <span>Compare</span>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Modern FAQ Section */}
        <section className="mt-20 border-t border-line pt-12">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted uppercase tracking-wider">
                Frequently Asked Questions
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                About Our Mac App Comparisons
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-line bg-surface p-5 shadow-2xs transition-all hover:border-line-2"
                >
                  <h3 className="text-[15.5px] font-semibold text-ink">{faq.q}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-body">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
