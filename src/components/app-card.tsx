import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { addedLabel, isEditorChoice, pricingLabel, type AppItem } from "@/lib/catalog";
import { appCoverUrl, appIconUrl } from "@/lib/image-opt";

function coverSrc(demo: string) {
  const clean = demo.trim();
  if (!clean || /\.mp4($|\?)/i.test(clean)) return "";
  return clean;
}

import { trackAppClick } from "@/lib/click-tracking";

export function getOrSetVisitorId(): string {
  if (typeof window === "undefined") return "";
  let vid = localStorage.getItem("pma_vid");
  if (!vid) {
    vid = "v_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("pma_vid", vid);
  }
  return vid;
}

export function trackClick(appId: string, type: "click" | "try" = "click") {
  void trackAppClick(appId, undefined, type);
}

export function AppCard({
  app,
  priority = false,
  rank,
  choice: forcedChoice,
}: {
  app: AppItem;
  size?: "lg" | "md" | "sm";
  priority?: boolean;
  rank?: number;
  choice?: boolean;
}) {
  const choice = forcedChoice ?? isEditorChoice(app);
  const cover = coverSrc(app.demo);
  const optimizedCover = appCoverUrl(cover);
  const optimizedIcon = appIconUrl(app.icon);
  const [coverSrcActive, setCoverSrcActive] = useState(optimizedCover);
  const [coverFailed, setCoverFailed] = useState(false);
  const [upvotes, setUpvotes] = useState(app.upvoteCount ?? 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    setCoverSrcActive(optimizedCover);
    setCoverFailed(false);
  }, [optimizedCover]);

  useEffect(() => {
    if (typeof window !== "undefined" && app.id) {
      const votedList = JSON.parse(localStorage.getItem("pma_voted") || "[]");
      if (Array.isArray(votedList) && votedList.includes(app.id)) {
        setHasVoted(true);
      }
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

  const showCover = Boolean(coverSrcActive) && !coverFailed;
  const isGold = choice && app.featuredTier === "article";
  const isBlue = choice && app.featuredTier !== "article";
  const isHotCard = Boolean(app.isHot) && !choice;
  const isAnimated = isGold || isBlue;

  // Metadata strings for mobile row
  const domain = app.website
    ? app.website
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .split("/")[0]
        .split("?")[0]
    : "";

  const categoryLabel = app.categoryName || app.category || "Utility";

  const visits =
    (app.tryCount ?? 0) > 0
      ? `${app.tryCount} tries`
      : (app.views7d ?? 0) > 0
      ? `${app.views7d} visits`
      : null;

  // Desktop Outer Frame Class
  const outerFrameClass = isGold
    ? "relative overflow-hidden rounded-2xl bg-amber-400/40 p-[2px] shadow-[0_6px_26px_-8px_rgba(245,158,11,0.38)] transition-all duration-300 group-hover:shadow-[0_14px_34px_-6px_rgba(245,158,11,0.48)] dark:bg-amber-500/25"
    : isBlue
    ? "relative overflow-hidden rounded-2xl bg-sky-400/40 p-[2px] shadow-[0_6px_26px_-8px_rgba(14,165,233,0.34)] transition-all duration-300 group-hover:shadow-[0_14px_34px_-6px_rgba(14,165,233,0.45)] dark:bg-sky-500/25"
    : "relative overflow-hidden rounded-2xl border border-line/60 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 group-hover:border-line-2 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.14)]";

  const waveRingClass = isGold
    ? "card-wave-ring card-wave-ring-gold"
    : "card-wave-ring card-wave-ring-blue";

  const hoverWaveClass = isGold
    ? "card-hover-wave card-hover-wave-gold z-15"
    : isBlue
    ? "card-hover-wave card-hover-wave-blue z-15"
    : "card-hover-wave card-hover-wave-neutral z-15";

  // Mobile Thinner Card Outer Class
  const mobileCardClass = isGold
    ? "relative overflow-hidden rounded-2xl border-1.5 border-amber-500/60 bg-gradient-to-r from-amber-500/[0.14] via-amber-500/[0.04] to-surface p-3 shadow-[0_4px_22px_rgba(245,158,11,0.22)] transition-all active:scale-[0.99]"
    : isBlue
    ? "relative overflow-hidden rounded-2xl border-1.5 border-sky-500/60 bg-gradient-to-r from-sky-500/[0.14] via-sky-500/[0.04] to-surface p-3 shadow-[0_4px_22px_rgba(14,165,233,0.22)] transition-all active:scale-[0.99]"
    : isHotCard
    ? "relative overflow-hidden rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-500/[0.09] via-rose-500/[0.03] to-surface p-3 shadow-[0_4px_16px_rgba(244,63,94,0.15)] transition-all active:scale-[0.99]"
    : "relative overflow-hidden rounded-2xl border border-line/80 bg-surface/90 p-3 shadow-2xs transition-all active:scale-[0.99] hover:border-line-2";

  return (
    <Link
      to="/app/$slug"
      params={{ slug: app.slug }}
      onClick={() => trackClick(app.id, "click")}
      className="group block transition-transform duration-300 ease-out sm:hover:-translate-y-0.5"
    >
      {/* ======================================================== */}
      {/* 1. MOBILE VIEW (< sm): Thinner horizontal row app card */}
      {/* ======================================================== */}
      <div className="sm:hidden">
        <div className={mobileCardClass}>
          <div className="flex items-center gap-2.5">
            {/* Rank Indicator (if provided) */}
            {typeof rank === "number" ? (
              <div className="flex flex-col items-center justify-center shrink-0 w-5">
                {rank === 1 ? (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] leading-none text-amber-400">👑</span>
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-400/20 text-[9.5px] font-bold text-amber-300 ring-1 ring-amber-400/50 mt-0.5">
                      1
                    </span>
                  </div>
                ) : rank === 2 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-400/20 text-[10px] font-bold text-slate-300 ring-1 ring-slate-400/40">
                    2
                  </span>
                ) : rank === 3 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-700/20 text-[10px] font-bold text-amber-500 ring-1 ring-amber-700/40">
                    3
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-muted/70">
                    {rank}
                  </span>
                )}
              </div>
            ) : null}

            {/* App Icon with Crown / Badge overlay */}
            <div className="relative shrink-0">
              <img
                alt={`${app.name} icon`}
                src={optimizedIcon}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                width={50}
                height={50}
                onError={(event) => {
                  if (event.currentTarget.src !== app.icon) {
                    event.currentTarget.src = app.icon;
                  } else {
                    event.currentTarget.src = "/site-favicon.svg";
                  }
                }}
                className={`h-12 w-12 rounded-[13px] object-cover shadow-sm ${
                  isGold
                    ? "ring-2 ring-amber-400/90"
                    : isBlue
                    ? "ring-2 ring-sky-400/90"
                    : "ring-1 ring-line/80"
                }`}
              />
              {/* Overlay Icon Crown / Badge */}
              {isGold ? (
                <span className="absolute -top-1.5 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-stone-950 text-[10px] font-bold shadow-xs ring-1 ring-stone-950">
                  👑
                </span>
              ) : isBlue ? (
                <span className="absolute -top-1.5 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white text-[9px] font-bold shadow-xs ring-1 ring-stone-950">
                  ✦
                </span>
              ) : isHotCard ? (
                <span className="absolute -top-1.5 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-600 text-[9px] shadow-xs ring-1 ring-stone-950">
                  🔥
                </span>
              ) : null}
            </div>

            {/* Center Content Column: Name, Tagline, Meta */}
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              {/* Row 1: Name + Badges */}
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="truncate text-[14.5px] font-bold tracking-tight text-ink group-hover:text-accent transition-colors">
                  {app.name}
                </h3>
                {choice ? (
                  isGold ? (
                    <span title="Gold Verified Badge" className="flex shrink-0 items-center text-amber-400">
                      <svg className="h-3.5 w-3.5 fill-amber-400" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </span>
                  ) : (
                    <span title="Blue Verified Badge" className="flex shrink-0 items-center text-sky-400">
                      <svg className="h-3.5 w-3.5 fill-sky-400" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </span>
                  )
                ) : null}

                {isGold ? (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.2 text-[9.5px] font-bold bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40">
                    <span>⚡</span>
                    <span>Boosted</span>
                  </span>
                ) : isBlue ? (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.2 text-[9.5px] font-bold bg-sky-400/20 text-sky-300 ring-1 ring-sky-400/40">
                    <span>✦</span>
                    <span>Featured</span>
                  </span>
                ) : isHotCard ? (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.2 text-[9.5px] font-bold bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40">
                    <span>🔥</span>
                    <span>Hot</span>
                  </span>
                ) : null}
              </div>

              {/* Row 2: Tagline */}
              <p className="mt-0.5 line-clamp-1 text-[12px] text-muted leading-tight">
                {app.tagline}
              </p>

              {/* Row 3: Meta line */}
              <div className="mt-1 flex items-center gap-2 text-[10.5px] text-muted overflow-hidden">
                {domain ? (
                  <span className="inline-flex items-center gap-1 truncate max-w-[90px]">
                    <svg className="h-3 w-3 shrink-0 text-muted/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span className="truncate">{domain}</span>
                  </span>
                ) : null}

                <span className="inline-flex items-center gap-1 shrink-0">
                  <svg className="h-3 w-3 shrink-0 text-muted/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.6 13.4 12 22l-8-8V4h10l6.6 6.6a2 2 0 0 1 0 2.8z" />
                    <circle cx="8.2" cy="8.2" r="1.4" />
                  </svg>
                  <span className="truncate max-w-[75px]">{categoryLabel}</span>
                </span>

                {visits ? (
                  <span className="inline-flex items-center gap-0.5 shrink-0 text-emerald-400 font-medium">
                    <span className="text-[10px]">✨</span>
                    <span>{visits}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 shrink-0 text-muted">
                    {pricingLabel[app.pricing] || "Free"}
                  </span>
                )}
              </div>
            </div>

            {/* Right Upvote Squircle Box (Matching Reference Image) */}
            <button
              type="button"
              onClick={handleUpvote}
              title={hasVoted ? "You upvoted this app" : "Upvote this app"}
              className={`shrink-0 flex flex-col items-center justify-between w-12 h-13 rounded-2xl py-1 px-1 transition-all cursor-pointer select-none active:scale-95 shadow-sm ${
                isGold
                  ? "bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 ring-1 ring-amber-200/80 hover:brightness-105"
                  : isBlue
                  ? "bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 ring-1 ring-sky-300/80 hover:brightness-105"
                  : hasVoted
                  ? "border border-amber-500/50 bg-amber-500/15 ring-1 ring-amber-500/30"
                  : "border border-line/80 bg-surface-2 hover:border-line-2 shadow-2xs"
              }`}
            >
              {/* Embedded Mini-squircle for Up-arrow */}
              <div
                className={`flex items-center justify-center w-7 h-5.5 rounded-lg shadow-2xs ${
                  isGold
                    ? "bg-stone-950/85 text-amber-400"
                    : isBlue
                    ? "bg-stone-950/85 text-sky-300"
                    : hasVoted
                    ? "bg-amber-500/25 text-amber-300"
                    : "bg-surface text-muted"
                }`}
              >
                <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                  <path d="M12 4l-6.5 7.5h4v8.5h5v-8.5h4z" />
                </svg>
              </div>

              {/* Bottom Bold Vote Count */}
              <span
                className={`text-[12.5px] font-black leading-none mb-0.5 ${
                  isGold
                    ? "text-stone-950"
                    : isBlue
                    ? "text-white"
                    : hasVoted
                    ? "text-amber-400"
                    : "text-ink"
                }`}
              >
                {upvotes}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DESKTOP VIEW (>= sm): Full visual screen preview card */}
      {/* ======================================================== */}
      <div className="hidden sm:flex sm:flex-col">
        {/* Visual Screen Preview Card (Adaptive canvas with animated tier border wave) */}
        <div className={outerFrameClass}>
          {isAnimated ? <div aria-hidden="true" className={waveRingClass} /> : null}
          <div
            className={`relative z-10 aspect-[1200/630] overflow-hidden bg-surface-2 dark:bg-[#101114] ${
              isAnimated ? "rounded-[14px]" : "rounded-2xl"
            }`}
          >
            <div aria-hidden="true" className={hoverWaveClass} />
            {showCover ? (
              <img
                alt={`${app.name} preview`}
                src={coverSrcActive}
                loading={priority ? "eager" : "lazy"}
                decoding={priority ? "sync" : "async"}
                fetchPriority={priority ? "high" : "auto"}
                width={1200}
                height={630}
                onError={() => {
                  if (coverSrcActive !== cover && cover) {
                    setCoverSrcActive(cover);
                  } else {
                    setCoverFailed(true);
                  }
                }}
                className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.025]"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-[#0f0f11] p-6 text-center dark:bg-[#141416]">
                <img
                  alt={`${app.name} icon`}
                  src={optimizedIcon}
                  loading={priority ? "eager" : "lazy"}
                  decoding="async"
                  width={64}
                  height={64}
                  onError={(event) => {
                    if (event.currentTarget.src !== app.icon) {
                      event.currentTarget.src = app.icon;
                    } else {
                      event.currentTarget.src = "/site-favicon.svg";
                    }
                  }}
                  className="h-16 w-16 rounded-[18px] object-cover shadow-lg ring-1 ring-white/10"
                />
                <p className="mt-3 text-sm font-semibold text-white/90">{app.name}</p>
                <p className="mt-1 line-clamp-2 max-w-[240px] text-xs text-white/60">{app.tagline}</p>
              </div>
            )}

            {/* Badges on Preview Canvas (Top-Left: Featured tier only) */}
            {isGold || isBlue ? (
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                {isGold ? (
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2.5 py-0.5 text-[10.5px] font-bold text-stone-950 shadow-xs ring-1 ring-amber-200/70">
                    ★ Featured
                  </span>
                ) : isBlue ? (
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-2.5 py-0.5 text-[10.5px] font-bold text-white shadow-xs ring-1 ring-sky-300/40">
                    ✦ Featured
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* Top-Right Arrow Action Circle Indicator */}
            <div className="absolute top-2.5 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-md transition-all duration-200 group-hover:scale-110 group-hover:bg-black/70 group-hover:text-white">
              <svg className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer Info: App icon on left + Name with Badge & Tagline underneath */}
        <div className="mt-3.5 flex items-start gap-3 px-1">
          <img
            alt={`${app.name} icon`}
            src={optimizedIcon}
            loading="lazy"
            decoding="async"
            width={40}
            height={40}
            onError={(event) => {
              if (event.currentTarget.src !== app.icon) {
                event.currentTarget.src = app.icon;
              } else {
                event.currentTarget.src = "/site-favicon.svg";
              }
            }}
            className="h-10 w-10 shrink-0 rounded-[11px] object-cover shadow-sm ring-1 ring-line"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <h3 className="truncate text-[15.5px] font-semibold tracking-[-0.015em] text-ink group-hover:text-accent">
                  {app.name}
                </h3>
                {choice ? (
                  isGold ? (
                    <span title="Editor’s Choice (Featured + Article)" className="flex shrink-0 items-center text-amber-500">
                      <svg className="h-4 w-4 fill-amber-500" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </span>
                  ) : (
                    <span title="Featured App" className="flex shrink-0 items-center text-sky-500">
                      <svg className="h-4 w-4 fill-sky-500" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </span>
                  )
                ) : null}
                {app.isHot ? (
                  <span title="Hot App" className="flex shrink-0 items-center text-sm" role="img" aria-label="Hot">
                    🔥
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Upvote Button Badge */}
                <button
                  type="button"
                  onClick={handleUpvote}
                  title={hasVoted ? "You upvoted this app" : "Upvote this app"}
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-all ${
                    hasVoted
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30"
                      : "bg-surface-2 text-muted ring-1 ring-line hover:bg-amber-500/10 hover:text-amber-600 hover:ring-amber-400/30 cursor-pointer"
                  }`}
                >
                  <span className="text-[10px]">▲</span>
                  <span>{upvotes}</span>
                </button>

                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none ${
                    app.pricing === "free"
                      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400"
                      : app.pricing === "freemium"
                      ? "bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400"
                      : "bg-surface-2 text-muted ring-1 ring-line"
                  }`}
                >
                  {pricingLabel[app.pricing] || "Free"}
                </span>
              </div>
            </div>
            <p className="mt-0.5 line-clamp-1 text-[13px] leading-tight text-body/80">
              {app.tagline}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
