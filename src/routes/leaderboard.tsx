import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { publishedApps } from "@/lib/app-seed";
import type { AppItem } from "@/lib/catalog";
import { appIconUrl } from "@/lib/image-opt";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { getOrSetVisitorId, trackClick } from "@/components/app-card";

export const Route = createFileRoute("/leaderboard")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Math.max(1, Number(search.page) || 1),
  }),
  component: LeaderboardPage,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: "Mac Apps Leaderboard — Top Rated macOS Apps Ranked by Upvotes",
      description:
        "Explore the official macOS app leaderboard ranked by community upvotes. Discover the best Mac software, productivity tools, developer utilities, and AI apps.",
      ogTitle: "Mac Apps Leaderboard — Top Rated macOS Apps Ranked by Upvotes",
      ogDescription:
        "Discover which Mac apps are voted the best by thousands of macOS users and developers. Upvote your favorite apps live.",
      path: "/leaderboard",
      origin,
    });
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/leaderboard")],
    };
  },
});

function LeaderboardPage() {
  const { directory } = Route.useRouteContext();
  const list = publishedApps(directory);
  const { page } = Route.useSearch();
  const navigate = useNavigate();

  // Sort apps strictly by upvotes descending
  const sortedApps = useMemo(() => {
    return [...list].sort((a, b) => {
      const votesA = Number(a.upvoteCount ?? 0);
      const votesB = Number(b.upvoteCount ?? 0);
      if (votesB !== votesA) return votesB - votesA;
      const choiceA = Number(Boolean(a.editorChoice));
      const choiceB = Number(Boolean(b.editorChoice));
      if (choiceB !== choiceA) return choiceB - choiceA;
      const clicksA = Number(a.clickCount ?? 0) + Number(a.tryCount ?? 0);
      const clicksB = Number(b.clickCount ?? 0) + Number(b.tryCount ?? 0);
      if (clicksB !== clicksA) return clicksB - clicksA;
      return a.name.localeCompare(b.name);
    });
  }, [list]);

  const totalVotes = useMemo(() => {
    return sortedApps.reduce((acc, app) => acc + Number(app.upvoteCount ?? 0), 0);
  }, [sortedApps]);

  const pageSize = 30;
  const totalApps = sortedApps.length;
  const totalPages = Math.max(1, Math.ceil(totalApps / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  // On page 1, top 3 are featured in the podium, so show ranks 4 to 30 in the list below.
  // On page 2+, show standard 30 apps per page (31-60, 61-90, etc.)
  const listApps =
    currentPage === 1
      ? sortedApps.slice(3, 30)
      : sortedApps.slice(startIndex, startIndex + pageSize);

  const baseRank = currentPage === 1 ? 4 : startIndex + 1;

  function goToPage(p: number) {
    navigate({
      to: "/leaderboard",
      search: { page: p },
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] px-3.5 py-5 sm:px-6 sm:py-8 lg:py-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 flex items-center gap-2 text-xs text-muted">
        <Link to="/" className="hover:text-ink transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink">Leaderboard</span>
      </nav>

      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-line bg-gradient-to-b from-surface via-surface/60 to-surface/20 p-5 sm:p-10 shadow-xs mb-6 sm:mb-10">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-amber-300/40 bg-amber-50 px-3 py-1 text-[11px] sm:text-xs font-bold text-amber-800 shadow-2xs dark:bg-amber-950/40 dark:border-amber-700/50 dark:text-amber-300">
            <span>🏆</span>
            <span>The Official macOS App Leaderboard</span>
          </div>

          <h1 className="font-display mt-3 sm:mt-4 text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink">
            Top Mac Apps Ranked by Upvotes
          </h1>

          <p className="mt-2.5 sm:mt-3 max-w-2xl text-xs sm:text-base text-body leading-relaxed">
            Real-time rankings powered by verified community upvotes. Discover the highest-rated software for Mac,
            or click the upvote button to boost your favorite applications.
          </p>

          {/* Quick Metrics Bar - Mobile responsive grid & desktop flex */}
          <div className="mt-5 sm:mt-6 grid grid-cols-3 gap-2 w-full max-w-sm sm:max-w-none sm:flex sm:w-auto sm:flex-wrap sm:justify-center sm:gap-3 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-line bg-surface/90 px-2.5 py-2 sm:px-4 sm:py-2 shadow-2xs text-center">
              <span className="text-[10px] sm:text-xs text-muted">Ranked:</span>
              <strong className="text-xs sm:text-sm text-ink">{totalApps} apps</strong>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-line bg-surface/90 px-2.5 py-2 sm:px-4 sm:py-2 shadow-2xs text-center">
              <span className="text-[10px] sm:text-xs text-muted">Upvotes:</span>
              <strong className="text-xs sm:text-sm text-emerald-600">▲ {totalVotes.toLocaleString()}</strong>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-line bg-surface/90 px-2.5 py-2 sm:px-4 sm:py-2 shadow-2xs text-center">
              <span className="text-[10px] sm:text-xs text-muted">Page:</span>
              <strong className="text-xs sm:text-sm text-ink">
                {currentPage} of {totalPages}
              </strong>
            </div>
          </div>
        </div>
      </header>

      {/* Top 3 Podium Cards on Page 1 - Strictly 1 then 2 then 3 */}
      {currentPage === 1 && sortedApps.length >= 3 ? (
        <section aria-label="Top 3 Ranked Apps" className="mb-6 sm:mb-10">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <span>🏆</span>
              <span>Top 3 Leaders</span>
            </h2>
            <span className="text-[11px] sm:text-xs text-muted">Rank #1 to #3</span>
          </div>

          {/* Strictly 1, then 2, then 3 for both mobile single-column and desktop 3-column */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
            {/* Rank 1 (Gold) */}
            <PodiumCard app={sortedApps[0]} rank={1} tone="gold" />
            {/* Rank 2 (Silver) */}
            <PodiumCard app={sortedApps[1]} rank={2} tone="silver" />
            {/* Rank 3 (Bronze) */}
            <PodiumCard app={sortedApps[2]} rank={3} tone="bronze" />
          </div>
        </section>
      ) : null}

      {/* Main Leaderboard List (30 apps per page) */}
      <section aria-label="All Apps Ranked" className="rounded-2xl sm:rounded-3xl border border-line bg-surface/40 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 border-b border-line px-4 py-3 sm:px-5 sm:py-4 bg-surface">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-ink">Catalog Rankings</h2>
            <p className="text-[11px] sm:text-xs text-muted">
              {currentPage === 1
                ? `Showing apps #4 to #${Math.min(30, totalApps)} of ${totalApps} (Top 3 featured in Podium above)`
                : `Showing apps #${startIndex + 1} to #${Math.min(startIndex + pageSize, totalApps)} of ${totalApps}`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-semibold text-muted">
              30 apps per page
            </span>
          </div>
        </div>

        {listApps.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-xs sm:text-sm text-muted">No apps found on this page.</div>
        ) : (
          <div className="divide-y divide-line">
            {listApps.map((app, idx) => {
              const rank = baseRank + idx;
              return <LeaderboardRow key={app.id || app.slug} app={app} rank={rank} />;
            })}
          </div>
        )}

        {/* Pagination Bar - Mobile touch-optimized */}
        {totalPages > 1 ? (
          <nav
            aria-label="Leaderboard pagination"
            className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-line px-4 py-3 sm:px-6 sm:py-4 bg-surface"
          >
            <div className="text-[11px] sm:text-xs text-muted">
              Page <span className="font-semibold text-ink">{currentPage}</span> of{" "}
              <span className="font-semibold text-ink">{totalPages}</span> · Total {totalApps} apps
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded-xl border border-line bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-ink hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
              >
                ← Prev
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 5) return true;
                    if (p === 1 || p === totalPages) return true;
                    return Math.abs(p - currentPage) <= 1;
                  })
                  .map((p, pIdx, arr) => {
                    const prev = arr[pIdx - 1];
                    const showEllipsis = prev && p - prev > 1;

                    return (
                      <span key={p} className="flex items-center">
                        {showEllipsis ? (
                          <span className="px-0.5 sm:px-1 text-[11px] sm:text-xs text-muted">…</span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => goToPage(p)}
                          className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl text-xs font-bold transition cursor-pointer ${
                            currentPage === p
                              ? "bg-ink text-canvas shadow-xs"
                              : "border border-line bg-white text-body hover:border-line-2 hover:text-ink"
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-xl border border-line bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-ink hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
              >
                Next →
              </button>
            </div>
          </nav>
        ) : null}
      </section>
    </main>
  );
}

function PodiumCard({
  app,
  rank,
  tone,
}: {
  app: AppItem;
  rank: number;
  tone: "gold" | "silver" | "bronze";
}) {
  const isGold = tone === "gold";
  const medalEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border p-3.5 sm:p-5 shadow-xs transition hover:shadow-md ${
        isGold
          ? "border-amber-300/80 bg-gradient-to-b from-amber-50/80 via-surface to-surface dark:from-amber-950/25 ring-1 ring-amber-300/60"
          : tone === "silver"
          ? "border-stone-300 bg-gradient-to-b from-stone-50/90 via-surface to-surface dark:from-stone-900/40"
          : "border-amber-700/25 bg-gradient-to-b from-orange-50/60 via-surface to-surface dark:from-orange-950/25"
      }`}
    >
      <div>
        {/* Top bar: Rank medal + category + pricing */}
        <div className="flex items-center justify-between gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] sm:text-xs font-bold shadow-2xs ${
              isGold
                ? "bg-amber-400 text-black ring-1 ring-amber-500/40"
                : tone === "silver"
                ? "bg-stone-200 text-stone-900"
                : "bg-amber-700/20 text-amber-900 dark:text-amber-200"
            }`}
          >
            <span>{medalEmoji}</span>
            <span>Rank #{rank}</span>
          </span>

          <div className="flex items-center gap-1">
            <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-muted capitalize truncate max-w-[80px] sm:max-w-none">
              {app.category}
            </span>
            <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-muted capitalize">
              {app.pricing}
            </span>
          </div>
        </div>

        {/* App info */}
        <div className="mt-2.5 sm:mt-4 flex items-center gap-2.5 sm:gap-3">
          {app.icon ? (
            <img
              src={appIconUrl(app.icon)}
              alt=""
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl object-cover ring-1 ring-line shadow-xs shrink-0"
            />
          ) : (
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-surface-2 text-xs sm:text-sm font-bold text-muted">
              {app.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Link
              to="/app/$slug"
              params={{ slug: app.slug }}
              className="font-bold text-sm sm:text-base text-ink hover:text-accent transition-colors truncate block"
            >
              {app.name}
            </Link>
            <div className="text-[11px] sm:text-xs text-muted truncate">/{app.slug}</div>
          </div>
        </div>

        <p className="mt-2 sm:mt-3 text-xs text-body line-clamp-2 leading-snug sm:leading-relaxed">
          {app.tagline || app.description}
        </p>
      </div>

      <div className="mt-3 sm:mt-5 pt-2.5 sm:pt-3 border-t border-line/60 flex items-center justify-between gap-2">
        <LeaderboardUpvoteButton app={app} />
        <Link
          to="/app/$slug"
          params={{ slug: app.slug }}
          className="rounded-xl border border-line bg-surface px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-ink hover:bg-surface-2 transition shadow-2xs"
        >
          View App →
        </Link>
      </div>
    </div>
  );
}

function LeaderboardRow({ app, rank }: { app: AppItem; rank: number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 p-3 sm:p-4 sm:px-6 hover:bg-surface/80 transition group">
      {/* Left side: Rank + Icon + Details */}
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
        {/* Rank Number Badge */}
        <span
          className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl font-display text-xs font-bold ${
            rank === 1
              ? "bg-amber-400 text-black shadow-xs ring-1 ring-amber-500/50"
              : rank === 2
              ? "bg-stone-200 text-stone-900"
              : rank === 3
              ? "bg-amber-700/20 text-amber-900"
              : "bg-surface-2 text-muted"
          }`}
        >
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
        </span>

        {/* App Icon */}
        <Link to="/app/$slug" params={{ slug: app.slug }} className="shrink-0 mt-0.5 sm:mt-0">
          {app.icon ? (
            <img
              src={appIconUrl(app.icon)}
              alt=""
              className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl object-cover ring-1 ring-line/80 shadow-2xs group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-surface-2 text-xs font-bold text-muted">
              {app.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </Link>

        {/* Text Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <Link
              to="/app/$slug"
              params={{ slug: app.slug }}
              className="font-semibold text-sm sm:text-base text-ink hover:text-accent transition-colors truncate"
            >
              {app.name}
            </Link>

            {app.editorChoice ? (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                {app.featuredTier === "article" ? "🌟 Gold" : "🔹 Blue"}
              </span>
            ) : null}

            {app.isHot ? (
              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                🔥 Hot
              </span>
            ) : null}

            <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] sm:text-[10.5px] font-medium text-muted capitalize">
              {app.category}
            </span>

            <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] sm:text-[10.5px] font-medium text-muted capitalize">
              {app.pricing}
            </span>
          </div>

          <p className="mt-0.5 text-[11.5px] sm:text-xs text-muted line-clamp-1 leading-relaxed">
            {app.tagline || app.description}
          </p>
        </div>
      </div>

      {/* Right side: Interactive Upvote Button + Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-9.5 sm:pl-0 pt-0.5 sm:pt-0">
        <LeaderboardUpvoteButton app={app} />

        <div className="flex items-center gap-1.5">
          {app.website ? (
            <a
              href={app.website}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackClick(app.id, "try")}
              className="rounded-xl border border-line bg-surface px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-body hover:text-ink hover:border-line-2 transition shadow-2xs"
            >
              Try App ↗
            </a>
          ) : null}

          <Link
            to="/app/$slug"
            params={{ slug: app.slug }}
            className="rounded-xl bg-ink px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-canvas hover:opacity-90 transition shadow-2xs"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}

function LeaderboardUpvoteButton({ app }: { app: AppItem }) {
  const [upvotes, setUpvotes] = useState(app.upvoteCount ?? 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && app.id) {
      try {
        const votedList = JSON.parse(localStorage.getItem("pma_voted") || "[]");
        if (Array.isArray(votedList) && votedList.includes(app.id)) {
          setHasVoted(true);
        }
      } catch {}
    }
  }, [app.id]);

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVoted || voting || !app.id) return;

    setVoting(true);
    setUpvotes((prev) => prev + 1);
    setHasVoted(true);

    try {
      const votedList = JSON.parse(localStorage.getItem("pma_voted") || "[]");
      if (Array.isArray(votedList)) {
        votedList.push(app.id);
        localStorage.setItem("pma_voted", JSON.stringify(votedList));
      }
    } catch {}

    const visitorId = getOrSetVisitorId();
    fetch("/api/upvote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appId: app.id, visitorId }),
    })
      .then((res) => res.json())
      .then((data: { ok?: boolean; upvoteCount?: number }) => {
        if (data.ok && typeof data.upvoteCount === "number") {
          setUpvotes(data.upvoteCount);
        }
      })
      .catch(() => {})
      .finally(() => setVoting(false));
  };

  return (
    <button
      type="button"
      onClick={handleUpvote}
      disabled={hasVoted || voting}
      title={hasVoted ? "You have upvoted this app" : "Upvote this app"}
      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold transition shadow-2xs ${
        hasVoted
          ? "border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 cursor-default"
          : "border border-line bg-surface text-ink hover:border-accent hover:text-accent hover:scale-[1.02] cursor-pointer"
      }`}
    >
      <span className={hasVoted ? "text-amber-600 dark:text-amber-400" : "text-accent"}>▲</span>
      <span>{upvotes}</span>
      {hasVoted ? <span className="text-[10px] font-normal text-muted">voted</span> : null}
    </button>
  );
}
