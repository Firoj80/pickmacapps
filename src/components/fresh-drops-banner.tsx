import { useMemo, useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  formatSidebarRelativeTime,
  getSidebarCutoff,
  isEditorChoice,
  pricingLabel,
  type AppItem,
  type SidebarSettings,
} from "@/lib/catalog";
import { appIconUrl } from "@/lib/image-opt";
import { BadgeCheckIcon } from "@/components/icons";

export function FreshDropsBanner({
  apps,
  settings,
}: {
  apps: AppItem[];
  settings?: SidebarSettings;
}) {
  const enabled = settings?.enabled ?? true;
  const duration = settings?.duration ?? "24h";

  const { matchingApps, fallbackApps, isFallback } = useMemo(() => {
    const sorted = [...apps].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA || a.name.localeCompare(b.name);
    });

    const cutoff = getSidebarCutoff(duration);
    const matching =
      cutoff > 0
        ? sorted.filter((app) => {
            const t = new Date(app.createdAt).getTime();
            return !isNaN(t) && t >= cutoff;
          })
        : sorted;

    if (matching.length > 0) {
      return {
        matchingApps: matching.slice(0, 15),
        fallbackApps: [],
        isFallback: false,
      };
    }

    return {
      matchingApps: [],
      fallbackApps: sorted.slice(0, 10),
      isFallback: true,
    };
  }, [apps, duration]);

  // Touch pause state so mobile taps freeze the moving ribbon and cleanly register clicks
  const [touchPaused, setTouchPaused] = useState(false);
  const touchTimerRef = useRef<number | null>(null);

  const handleTouchStart = () => {
    if (touchTimerRef.current) window.clearTimeout(touchTimerRef.current);
    setTouchPaused(true);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) window.clearTimeout(touchTimerRef.current);
    touchTimerRef.current = window.setTimeout(() => {
      setTouchPaused(false);
    }, 600);
  };

  if (!enabled) return null;

  const durationBadge =
    duration === "24h"
      ? "Last 24 Hours"
      : duration === "7d"
      ? "Last 7 Days"
      : duration === "15d"
      ? "Last 15 Days"
      : duration === "30d"
      ? "Last 30 Days"
      : "All Recent";

  const listToRender = isFallback ? fallbackApps : matchingApps;
  if (listToRender.length === 0) return null;

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Banner Top Header */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 px-0.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent/15 text-xs text-accent">
            ⚡
          </span>
          <h2 className="font-semibold text-ink text-xs inline">
            {duration === "24h" ? "Fresh Drops" : "Recently Added"}
          </h2>
          <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10.5px] font-semibold text-ink">
            {durationBadge}
          </span>
          {isFallback ? (
            <span className="hidden sm:inline-block text-[11px] text-muted">
              · Latest catalog additions
            </span>
          ) : (
            <span className="hidden sm:inline-block text-[11px] text-muted">
              · {matchingApps.length} {matchingApps.length === 1 ? "app" : "apps"} added
            </span>
          )}
        </div>

        <Link
          to="/"
          search={{ sort: "new", cat: "all" }}
          className="group inline-flex items-center gap-1 font-semibold text-accent hover:underline transition-colors"
        >
          <span>View All Latest</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      {/* Marquee Running Banner Track */}
      <div
        className="relative w-full overflow-hidden py-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
        <div
          className="animate-marquee flex items-center gap-3"
          style={{
            animationDuration: "70s",
            ...(touchPaused ? { animationPlayState: "paused" } : {}),
          }}
        >
          {[0, 1].map((copyIndex) => (
            <div key={`loop-${copyIndex}`} className="flex items-center gap-3 shrink-0">
              {listToRender.map((app, idx) => {
                const choice = isEditorChoice(app);
                const isGold = (choice && app.featuredTier === "article") || app.featuredTier === "article";
                const isHot = Boolean(app.isHot && !isGold);
                const timeAgo = formatSidebarRelativeTime(app.createdAt);
                const price = pricingLabel[app.pricing] || "Free";

                return (
                  <Link
                    key={`${app.id || app.slug}-${copyIndex}-${idx}`}
                    to="/app/$slug"
                    params={{ slug: app.slug }}
                    className="group flex items-center gap-2.5 rounded-2xl border border-line bg-surface/90 px-3.5 py-2 shadow-xs transition hover:border-accent hover:bg-surface hover:shadow-sm shrink-0"
                    title={`${app.name} — ${app.tagline}`}
                  >
                    {/* App Icon */}
                    {app.icon ? (
                      <img
                        src={appIconUrl(app.icon)}
                        alt=""
                        className="h-7 w-7 rounded-lg object-cover ring-1 ring-line/80 shadow-2xs"
                        loading="lazy"
                        onError={(e) => {
                          if (e.currentTarget.src !== app.icon) {
                            e.currentTarget.src = app.icon;
                          } else {
                            e.currentTarget.src = "/site-favicon.svg";
                          }
                        }}
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

                    {/* Gold / Hot badge */}
                    {isGold ? (
                      <span title="Gold Spotlight App" className="shrink-0">
                        <BadgeCheckIcon className="h-3.5 w-3.5 fill-amber-500 text-stone-950" />
                      </span>
                    ) : isHot ? (
                      <span title="Hot App" className="text-[11px] shrink-0">
                        🔥
                      </span>
                    ) : null}

                    {/* Relative Time Added Pill */}
                    {timeAgo ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10.5px] font-semibold text-white whitespace-nowrap">
                        <span>✨</span>
                        <span className="text-white">{timeAgo}</span>
                      </span>
                    ) : null}

                    {/* Pricing Pill */}
                    <span className="text-[10.5px] font-medium text-white capitalize whitespace-nowrap">
                      · {price}
                    </span>

                    {/* Tagline snippet */}
                    <span className="hidden md:inline-block text-[10.5px] text-white max-w-[260px] truncate whitespace-nowrap">
                      · {app.tagline}
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
