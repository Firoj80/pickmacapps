import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import type { AppItem } from "@/lib/catalog";
import { appIconUrl } from "@/lib/image-opt";

export function LeaderboardBanner({ apps }: { apps: AppItem[] }) {
  // Select top 10 apps strictly decided by upvotes
  const top10 = useMemo(() => {
    return [...apps]
      .sort((a, b) => {
        const votesA = Number(a.upvoteCount ?? 0);
        const votesB = Number(b.upvoteCount ?? 0);
        if (votesB !== votesA) return votesB - votesA;
        const clicksA = Number(a.clickCount ?? 0) + Number(a.tryCount ?? 0);
        const clicksB = Number(b.clickCount ?? 0) + Number(b.tryCount ?? 0);
        if (clicksB !== clicksA) return clicksB - clicksA;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 10);
  }, [apps]);

  if (top10.length === 0) return null;

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Banner Top Header */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 px-0.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/15 text-xs text-amber-500">
            🏆
          </span>
          <span className="font-semibold text-ink">Top 10 Leaderboard</span>
          <span className="hidden sm:inline-block rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-medium text-muted">
            Ranked by Community Upvotes
          </span>
        </div>

        <Link
          to="/leaderboard"
          className="group inline-flex items-center gap-1 font-semibold text-accent hover:underline transition-colors"
        >
          <span>View Full Leaderboard</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      {/* Marquee Running Banner Track */}
      <div className="relative w-full overflow-hidden py-1">
        {/* Left & Right Gradient Fade Masks */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-20 bg-gradient-to-r from-canvas via-canvas/80 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-20 bg-gradient-to-l from-canvas via-canvas/80 to-transparent"
        />

        {/* Double-loop for smooth continuous infinite scrolling */}
        <div className="animate-marquee flex items-center gap-3">
          {[0, 1].map((copyIndex) => (
            <div key={`loop-${copyIndex}`} className="flex items-center gap-3 shrink-0">
              {top10.map((app, idx) => {
                const rank = idx + 1;
                return (
                  <Link
                    key={`${app.id || app.slug}-${copyIndex}-${idx}`}
                    to="/app/$slug"
                    params={{ slug: app.slug }}
                    className="group flex items-center gap-2.5 rounded-2xl border border-line bg-surface/90 px-3.5 py-2 shadow-xs transition hover:border-accent hover:bg-surface hover:shadow-sm shrink-0"
                    title={`#${rank} ${app.name} (${Number(app.upvoteCount ?? 0)} upvotes)`}
                  >
                    {/* Rank Badge */}
                    <span
                      className={`flex h-5 items-center justify-center rounded-md px-1.5 text-[10.5px] font-bold ${
                        rank === 1
                          ? "bg-amber-400 text-black shadow-xs ring-1 ring-amber-500/40"
                          : rank === 2
                          ? "bg-stone-300 text-stone-900 ring-1 ring-stone-400/40"
                          : rank === 3
                          ? "bg-amber-700/20 text-amber-900 ring-1 ring-amber-700/30"
                          : "bg-surface-2 text-muted font-semibold"
                      }`}
                    >
                      {rank === 1 ? "🥇 #1" : rank === 2 ? "🥈 #2" : rank === 3 ? "🥉 #3" : `#${rank}`}
                    </span>

                    {/* App Icon */}
                    {app.icon ? (
                      <img
                        src={appIconUrl(app.icon)}
                        alt=""
                        className="h-7 w-7 rounded-lg object-cover ring-1 ring-line/80 shadow-2xs"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 text-[10px] font-bold text-muted">
                        {app.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* App Name */}
                    <span className="text-xs font-semibold text-ink group-hover:text-accent transition-colors whitespace-nowrap">
                      {app.name}
                    </span>

                    {/* Upvotes Chip */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent whitespace-nowrap">
                      <span>▲</span>
                      <span>{Number(app.upvoteCount ?? 0)}</span>
                    </span>

                    {/* Pricing / Category tag */}
                    <span className="hidden md:inline-block text-[10.5px] text-muted capitalize whitespace-nowrap">
                      · {app.pricing}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
