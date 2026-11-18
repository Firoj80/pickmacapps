import { Link } from "@tanstack/react-router";

export function ClaimSpotCard({
  tier,
  spotIndex,
}: {
  tier: "article" | "featured";
  spotIndex: number;
}) {
  const isGold = tier === "article";

  const outerFrameClass = isGold
    ? "relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/[0.04] p-[2px] shadow-[0_4px_20px_rgba(245,158,11,0.12)] transition-all duration-300 group-hover:border-amber-500/80 group-hover:shadow-[0_12px_28px_rgba(245,158,11,0.25)]"
    : "relative overflow-hidden rounded-2xl border-2 border-dashed border-sky-500/40 bg-sky-500/[0.04] p-[2px] shadow-[0_4px_20px_rgba(14,165,233,0.12)] transition-all duration-300 group-hover:border-sky-500/80 group-hover:shadow-[0_12px_28px_rgba(14,165,233,0.25)]";

  const previewBgClass = isGold
    ? "from-[#1a1424] via-[#120f18] to-[#0d0c10]"
    : "from-[#0d1626] via-[#0a101d] to-[#060a12]";

  const iconBgClass = isGold
    ? "bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 ring-amber-300/40"
    : "bg-gradient-to-br from-sky-400 to-blue-600 text-white ring-sky-300/40";

  const tagColorClass = isGold
    ? "bg-amber-400/15 text-amber-700 dark:text-amber-300 border-amber-400/30"
    : "bg-sky-400/15 text-sky-700 dark:text-sky-300 border-sky-400/30";

  const glowStyle = isGold
    ? { background: "radial-gradient(circle at 50% 40%, rgba(245, 158, 11, 0.22), transparent 70%)" }
    : { background: "radial-gradient(circle at 50% 40%, rgba(14, 165, 233, 0.22), transparent 70%)" };

  return (
    <Link
      to="/submit"
      search={{ tier: isGold ? "article" : "featured" }}
      className="group flex flex-col transition-transform duration-300 ease-out hover:-translate-y-0.5 cursor-pointer"
      title={isGold ? "Claim Gold Spotlight Spot" : "Claim Blue Featured Spot"}
    >
      {/* Visual Screen Preview Card matching AppCard 1200/630 ratio & frame */}
      <div className={outerFrameClass}>
        <div
          style={glowStyle}
          className={`relative z-10 aspect-[1200/630] overflow-hidden rounded-[14px] bg-gradient-to-br ${previewBgClass} p-4 flex flex-col items-center justify-center text-center text-white`}
        >
          {/* Top-Left Tier Badge */}
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
            {isGold ? (
              <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2.5 py-0.5 text-[10.5px] font-bold text-stone-950 shadow-xs ring-1 ring-amber-200/70">
                ★ Gold Spot #{spotIndex}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-2.5 py-0.5 text-[10.5px] font-bold text-white shadow-xs ring-1 ring-sky-300/40">
                ✦ Blue Spot #{spotIndex}
              </span>
            )}
          </div>

          {/* Top-Right Arrow Action Circle Indicator matching AppCard */}
          <div className="absolute top-2.5 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-md transition-all duration-200 group-hover:scale-110 group-hover:bg-black/70 group-hover:text-white">
            <svg
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </div>

          {/* Center Emblem with + Icon */}
          <div
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl ${iconBgClass} font-extrabold text-2xl shadow-lg ring-2 transition-transform duration-300 group-hover:scale-110`}
          >
            +
          </div>

          <p className={`mt-2.5 sm:mt-3 text-sm font-bold tracking-tight ${isGold ? "text-amber-200" : "text-sky-200"}`}>
            {isGold ? "Claim Gold Spotlight" : "Claim Blue Featured"}
          </p>
          <p className="mt-0.5 text-[11px] text-white/60">
            {isGold ? "Row 1 Priority · Medium Article · 7 Days" : "Row 2 Placement · Verified Badge · 7 Days"}
          </p>
        </div>
      </div>

      {/* Footer Info: App icon + Name with Badge & Tagline underneath matching AppCard */}
      <div className="mt-3.5 flex items-start gap-3 px-1">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] ${iconBgClass} font-bold text-lg shadow-sm ring-1 ring-line`}
        >
          +
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="truncate text-[15.5px] font-semibold tracking-[-0.015em] text-ink group-hover:text-accent">
                {isGold ? "Your App in Gold Spotlight" : "Your App in Blue Featured"}
              </h3>
            </div>
            <span className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${tagColorClass}`}>
              {isGold ? "★ Claim" : "✦ Claim"}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-[13px] text-muted">
            {isGold
              ? "Occupy Row 1 with dedicated editorial coverage"
              : "Occupy Row 2 with verified blue badge"}
          </p>
        </div>
      </div>
    </Link>
  );
}
