import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import type { AppItem } from "@/lib/catalog";
import type { DiscontinuedAppInfo } from "@/lib/discontinued-apps";

interface AppAlternativesProps {
  discontinued: DiscontinuedAppInfo;
  allApps: AppItem[];
}

export function AppAlternatives({ discontinued, allApps }: AppAlternativesProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "paid" | "choice">("all");
  const currentYear = new Date().getFullYear();

  // Find apps in the exact same category first
  const sameCategoryApps = useMemo(() => {
    return allApps.filter((a) => a.category === discontinued.category);
  }, [allApps, discontinued.category]);

  // If the category has fewer than 6 apps, supplement with other top apps
  const candidateApps = useMemo(() => {
    if (sameCategoryApps.length >= 6) {
      return sameCategoryApps;
    }
    const otherApps = allApps.filter((a) => a.category !== discontinued.category);
    // Prioritize editor choice and hot apps
    const sortedOthers = [...otherApps].sort((a, b) => {
      const scoreA = (a.editorChoice ? 2 : 0) + (a.isHot ? 1 : 0);
      const scoreB = (b.editorChoice ? 2 : 0) + (b.isHot ? 1 : 0);
      return scoreB - scoreA;
    });
    return [...sameCategoryApps, ...sortedOthers].slice(0, 12);
  }, [allApps, sameCategoryApps, discontinued.category]);

  // Filter apps based on search query and pricing tab
  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidateApps.filter((app) => {
      if (filter === "free" && app.pricing !== "free") return false;
      if (filter === "paid" && app.pricing === "free") return false;
      if (filter === "choice" && !app.editorChoice) return false;
      if (!q) return true;
      return (
        app.name.toLowerCase().includes(q) ||
        app.tagline.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q)
      );
    });
  }, [candidateApps, search, filter]);

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted">
          <Link to="/" className="hover:text-ink transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            to="/category/$slug"
            params={{ slug: discontinued.category }}
            className="hover:text-ink transition-colors"
          >
            {discontinued.categoryName} Mac Apps
          </Link>
          <span>/</span>
          <span className="text-body font-medium">{discontinued.name} Alternatives</span>
        </nav>

        {/* Hero Header */}
        <header className="border-b border-line pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
              <span>⚠️ Listing Retired</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
              <span>Verified Alternatives ({currentYear})</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/50 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>macOS Sequoia & Apple Silicon</span>
            </span>
          </div>

          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Best Alternatives to {discontinued.name} for Mac
          </h1>

          {/* Contextual Notice Box */}
          <div className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4.5 sm:p-5 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">ℹ️</span>
              <div className="space-y-1">
                <p className="font-semibold text-[15px]">
                  <strong>{discontinued.name}</strong> is no longer listed or maintained on PickMacApps.
                </p>
                <p className="text-xs text-amber-900/90 dark:text-amber-300 leading-relaxed">
                  Looking for reliable macOS {discontinued.categoryName.toLowerCase()} tools? We have curated the top-rated,
                  actively maintained alternatives below — vetted for clean native Swift performance, Apple Gatekeeper notarization, and fair pricing.
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder={`Search ${discontinued.categoryName.toLowerCase()} alternatives...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-xs text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink cursor-pointer"
                >
                  ✕
                </button>
              ) : null}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer ${
                  filter === "all" ? "bg-ink text-canvas font-semibold" : "text-muted hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                All ({candidateApps.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("free")}
                className={`rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer ${
                  filter === "free" ? "bg-ink text-canvas font-semibold" : "text-muted hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => setFilter("paid")}
                className={`rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer ${
                  filter === "paid" ? "bg-ink text-canvas font-semibold" : "text-muted hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                Paid / One-Time
              </button>
              <button
                type="button"
                onClick={() => setFilter("choice")}
                className={`rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer ${
                  filter === "choice" ? "bg-ink text-canvas font-semibold" : "text-muted hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                ⭐ Featured Choice
              </button>
            </div>
          </div>
        </header>

        {/* Alternatives Grid Section */}
        <section aria-label="Alternative apps grid" className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">
              Recommended Alternatives ({filteredApps.length})
            </h2>
            <Link
              to="/category/$slug"
              params={{ slug: discontinued.category }}
              className="text-xs font-semibold text-ink underline-offset-4 hover:underline"
            >
              View All {discontinued.categoryName} Apps →
            </Link>
          </div>

          {filteredApps.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-12 text-center">
              <p className="text-sm font-semibold text-ink">No alternatives match your search.</p>
              <p className="mt-1 text-xs text-muted">Try clearing the search query or switching filter tabs.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-4 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-canvas hover:opacity-90 transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredApps.map((item, index) => (
                <AppCard key={item.id} app={item} choice={item.editorChoice} priority={index < 4} />
              ))}
            </div>
          )}
        </section>

        {/* Category Shelf Hub Callout */}
        <section className="mt-12 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-2xl">{discontinued.categoryEmoji}</span>
              <h3 className="mt-2 text-lg font-bold text-ink">
                Explore the Complete {discontinued.categoryName} Mac Shelf
              </h3>
              <p className="mt-1 text-xs text-muted max-w-xl leading-relaxed">
                Browse our full curated catalog of {discontinued.categoryName.toLowerCase()} utilities. Compare pricing, review feature breakdowns, and discover indie Mac software.
              </p>
            </div>
            <Link
              to="/category/$slug"
              params={{ slug: discontinued.category }}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-canvas hover:opacity-90 transition shadow-xs"
            >
              Browse All {discontinued.categoryName} Apps →
            </Link>
          </div>
        </section>

        {/* Why Switch & How We Pick Alternatives */}
        <section className="mt-10 border-t border-line pt-8">
          <h3 className="font-display text-base font-semibold text-ink">
            How PickMacApps Evaluates Mac Alternatives
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-line bg-surface p-4">
              <span className="text-base">⚡</span>
              <h4 className="mt-2 font-semibold text-ink">Native Performance</h4>
              <p className="mt-1 text-muted leading-relaxed">
                Prioritizing native Swift & AppKit apps that use minimal memory and maintain zero background battery drain on MacBooks.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <span className="text-base">🔒</span>
              <h4 className="mt-2 font-semibold text-ink">Privacy & Security</h4>
              <p className="mt-1 text-muted leading-relaxed">
                Apple Gatekeeper notarized apps with strict local data handling — no hidden background telemetry or forced cloud accounts.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <span className="text-base">💳</span>
              <h4 className="mt-2 font-semibold text-ink">Fair Pricing</h4>
              <p className="mt-1 text-muted leading-relaxed">
                Favoring straightforward one-time lifetime purchases, honest freemium tiers, or generous open-source solutions over recurring fees.
              </p>
            </div>
          </div>

          {/* Submitter CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between rounded-xl bg-stone-50/70 dark:bg-stone-900/40 p-4 border border-line text-xs gap-3">
            <span className="text-muted">
              Are you the developer of an alternative Mac app in the {discontinued.categoryName} space?
            </span>
            <Link
              to="/submit"
              className="shrink-0 font-semibold text-ink underline underline-offset-4 hover:opacity-80"
            >
              Submit your app to PickMacApps →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
