import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { addedLabel, isEditorChoice, pricingLabel, type AppItem } from "@/lib/catalog";
import { appCoverUrl, appIconUrl } from "@/lib/image-opt";

function coverSrc(demo: string) {
  const clean = demo.trim();
  if (!clean || /\.mp4($|\?)/i.test(clean)) return "";
  return clean;
}

export function AppCard({ app, priority = false }: { app: AppItem; size?: "lg" | "md" | "sm"; priority?: boolean }) {
  const choice = isEditorChoice(app);
  const cover = coverSrc(app.demo);
  const optimizedCover = appCoverUrl(cover);
  const optimizedIcon = appIconUrl(app.icon);
  const [coverSrcActive, setCoverSrcActive] = useState(optimizedCover);
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    setCoverSrcActive(optimizedCover);
    setCoverFailed(false);
  }, [optimizedCover]);

  const showCover = Boolean(coverSrcActive) && !coverFailed;
  const isGold = choice && app.featuredTier === "article";
  const isBlue = choice && app.featuredTier !== "article";
  const isHotCard = Boolean(app.isHot) && !choice;
  const isAnimated = isGold || isBlue || isHotCard;

  const outerFrameClass = isGold
    ? "relative overflow-hidden rounded-2xl bg-amber-400/40 p-[2px] shadow-[0_6px_26px_-8px_rgba(245,158,11,0.38)] transition-all duration-300 group-hover:shadow-[0_14px_34px_-6px_rgba(245,158,11,0.48)] dark:bg-amber-500/25"
    : isBlue
    ? "relative overflow-hidden rounded-2xl bg-sky-400/40 p-[2px] shadow-[0_6px_26px_-8px_rgba(14,165,233,0.34)] transition-all duration-300 group-hover:shadow-[0_14px_34px_-6px_rgba(14,165,233,0.45)] dark:bg-sky-500/25"
    : isHotCard
    ? "relative overflow-hidden rounded-2xl bg-rose-400/40 p-[2px] shadow-[0_6px_24px_-8px_rgba(244,63,94,0.32)] transition-all duration-300 group-hover:shadow-[0_14px_32px_-6px_rgba(244,63,94,0.42)] dark:bg-rose-500/25"
    : "relative overflow-hidden rounded-2xl border border-line/60 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 group-hover:border-line-2 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.14)]";

  const waveRingClass = isGold
    ? "card-wave-ring card-wave-ring-gold"
    : isBlue
    ? "card-wave-ring card-wave-ring-blue"
    : "card-wave-ring card-wave-ring-hot";

  const hoverWaveClass = isGold
    ? "card-hover-wave card-hover-wave-gold z-15"
    : isBlue
    ? "card-hover-wave card-hover-wave-blue z-15"
    : isHotCard
    ? "card-hover-wave card-hover-wave-hot z-15"
    : "card-hover-wave card-hover-wave-neutral z-15";

  return (
    <Link
      to="/app/$slug"
      params={{ slug: app.slug }}
      className="group flex flex-col transition-transform duration-300 ease-out hover:-translate-y-0.5"
    >
      {/* Visual Screen Preview Card (Adaptive canvas with animated tier border wave) */}
      <div className={outerFrameClass}>
        {isAnimated ? <div aria-hidden="true" className={waveRingClass} /> : null}
        <div
          className={`relative z-10 aspect-[16/9] overflow-hidden bg-surface-2 dark:bg-[#101114] ${
            isAnimated ? "rounded-[14px]" : "rounded-2xl"
          }`}
        >
          <div aria-hidden="true" className={hoverWaveClass} />
          {showCover ? (
            <>
              <img
                alt=""
                aria-hidden="true"
                src={coverSrcActive}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
                className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-55 blur-3xl saturate-125"
              />
              <img
                alt={`${app.name} preview`}
                src={coverSrcActive}
                loading={priority ? "eager" : "lazy"}
                decoding={priority ? "sync" : "async"}
                fetchPriority={priority ? "high" : "auto"}
                width={800}
                height={450}
                onError={() => {
                  if (coverSrcActive !== cover && cover) {
                    setCoverSrcActive(cover);
                  } else {
                    setCoverFailed(true);
                  }
                }}
                className="relative z-10 h-full w-full object-contain transition duration-300"
              />
            </>
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

          {/* Badges on Preview Canvas (Top-Left) */}
          <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5">
            {isGold ? (
              <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2.5 py-0.5 text-[10.5px] font-bold text-stone-950 shadow-xs ring-1 ring-amber-200/70">
                ★ Featured
              </span>
            ) : isBlue ? (
              <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-2.5 py-0.5 text-[10.5px] font-bold text-white shadow-xs ring-1 ring-sky-300/40">
                ✦ Featured
              </span>
            ) : isHotCard ? (
              <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-2.5 py-0.5 text-[10.5px] font-bold text-white shadow-xs ring-1 ring-rose-300/40">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-200 opacity-85" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                <span>🔥 Hot</span>
              </div>
            ) : null}

            <span
              className={`flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-tight shadow-xs backdrop-blur-md ${
                app.pricing === "free"
                  ? "bg-emerald-600/90 text-white ring-1 ring-emerald-400/40"
                  : app.pricing === "freemium"
                  ? "bg-sky-600/90 text-white ring-1 ring-sky-400/40"
                  : "bg-black/65 text-white/90 ring-1 ring-white/20"
              }`}
            >
              {pricingLabel[app.pricing] || "Free"}
            </span>
          </div>

          {/* Top-Right Arrow Action Circle Indicator */}
          <div className="absolute top-3 right-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-md transition-all duration-200 group-hover:scale-110 group-hover:bg-black/70 group-hover:text-white">
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
              {/* Verified / Editor badge icon: Gold for Article, Blue for Featured */}
              {choice ? (
                app.featuredTier === "article" ? (
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

            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none ${
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
          <p className="mt-0.5 line-clamp-1 text-[13px] leading-tight text-body/80">
            {app.tagline}
          </p>
        </div>
      </div>
    </Link>
  );
}

function Spec({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]">
      <span className="flex shrink-0 items-center gap-1.5 text-muted">
        {icon}
        {label}
      </span>
      <span aria-hidden="true" className="h-px min-w-3 flex-1 bg-line-2" />
      <span className="shrink-0 font-medium text-ink">{value}</span>
    </div>
  );
}

function LayersIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.6 13.4 12 22l-8-8V4h10l6.6 6.6a2 2 0 0 1 0 2.8z" />
      <circle cx="8.2" cy="8.2" r="1.4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}
