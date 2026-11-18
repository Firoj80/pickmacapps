import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { fetchOffer } from "@/lib/directory.fn";
import {
  type CurrencyCode,
  detectLocalCurrency,
  convertPrice,
  SUPPORTED_CURRENCIES,
} from "@/lib/currency";

export type ClaimSpotOffer = Awaited<ReturnType<typeof fetchOffer>>;

export function ClaimSpotCard({
  tier,
  offer: initialOffer,
}: {
  tier: "article" | "featured";
  offer?: ClaimSpotOffer | null;
}) {
  const [offer, setOffer] = useState<ClaimSpotOffer | null>(initialOffer ?? null);

  // If initialOffer was not provided by SSR, fetch it on client
  useEffect(() => {
    if (initialOffer) {
      setOffer(initialOffer);
      return;
    }
    fetchOffer().then((data) => setOffer(data)).catch(() => {});
  }, [initialOffer]);

  const isGold = tier === "article";

  const [currency] = useState<CurrencyCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pma_currency");
      if (saved && saved in SUPPORTED_CURRENCIES) return saved as CurrencyCode;
    }
    return detectLocalCurrency(offer?.country);
  });

  // Calculate prices strictly matching submit.tsx and admin backend
  const rawFeaturedDollars = Math.round((offer?.featuredPriceCents ?? offer?.priceCents ?? 9900) / 100);
  const rawFeaturedCompareDollars = Math.round((offer?.featuredCompareCents ?? offer?.compareCents ?? 19900) / 100);
  const rawArticleDollars = Math.round((offer?.articlePriceCents ?? 12000) / 100);
  const rawArticleCompareDollars = Math.round((offer?.articleCompareCents ?? 24900) / 100);

  const rawPriceDollars = isGold ? rawArticleDollars : rawFeaturedDollars;
  const rawCompareDollars = isGold ? rawArticleCompareDollars : rawFeaturedCompareDollars;

  const priceConv = useMemo(
    () => convertPrice(rawPriceDollars, currency, offer?.rates),
    [rawPriceDollars, currency, offer?.rates]
  );

  const compareConv = useMemo(
    () => convertPrice(rawCompareDollars, currency, offer?.rates),
    [rawCompareDollars, currency, offer?.rates]
  );

  const salePrice = priceConv.formatted;
  const originalPrice = compareConv.formatted;

  const discountPercent =
    rawCompareDollars > rawPriceDollars
      ? Math.round(((rawCompareDollars - rawPriceDollars) / rawCompareDollars) * 100)
      : 0;

  const discountLabel = discountPercent > 0 ? `${discountPercent}% OFF` : null;

  const outerFrameClass = isGold
    ? "relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-500/50 bg-amber-500/[0.05] p-[2px] shadow-[0_6px_24px_rgba(245,158,11,0.18)] transition-all duration-300 group-hover:border-amber-400 group-hover:shadow-[0_14px_36px_rgba(245,158,11,0.32)] group-hover:-translate-y-1"
    : "relative overflow-hidden rounded-2xl border-2 border-dashed border-sky-500/50 bg-sky-500/[0.05] p-[2px] shadow-[0_6px_24px_rgba(14,165,233,0.18)] transition-all duration-300 group-hover:border-sky-400 group-hover:shadow-[0_14px_36px_rgba(14,165,233,0.32)] group-hover:-translate-y-1";

  const previewBgClass = isGold
    ? "from-[#1d1627] via-[#14101d] to-[#0c0a11]"
    : "from-[#0d182b] via-[#091220] to-[#050b14]";

  const glowStyle = isGold
    ? { background: "radial-gradient(circle at 50% 45%, rgba(245, 158, 11, 0.22), transparent 70%)" }
    : { background: "radial-gradient(circle at 50% 45%, rgba(14, 165, 233, 0.22), transparent 70%)" };

  return (
    <Link
      to="/submit"
      search={{ tier: isGold ? "article" : "featured" }}
      className="group flex flex-col transition-all duration-300 ease-out cursor-pointer"
      title={isGold ? `List your app in Gold Spotlight (${salePrice})` : `List your app in Blue Featured (${salePrice})`}
    >
      {/* Visual Screen Preview Card matching AppCard 1200/630 ratio */}
      <div className={outerFrameClass}>
        <div
          style={glowStyle}
          className={`relative z-10 aspect-[1200/630] overflow-hidden rounded-[14px] bg-gradient-to-br ${previewBgClass} p-3.5 sm:p-4 flex flex-col justify-between text-white select-none`}
        >
          {/* macOS window title bar with traffic lights & header */}
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500/80" />
              <span className="h-2 w-2 rounded-full bg-amber-500/80" />
              <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[10px] text-white/40">pickmacapps.store/your-app</span>
            </div>

            {/* Discount Tag if compare price is higher */}
            {discountLabel ? (
              <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500/25 to-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-200 ring-1 ring-amber-400/40 shadow-xs">
                <span className="animate-pulse">🔥</span>
                <span>{discountLabel}</span>
              </div>
            ) : null}
          </div>

          {/* Center Relatable App Mockup */}
          <div className="flex flex-col items-center justify-center text-center my-auto py-1">
            {/* Dashed App Icon Placeholder with + */}
            <div className="relative group-hover:scale-105 transition-transform duration-300">
              <div
                className={`flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-[14px] border-2 border-dashed ${
                  isGold ? "border-amber-300/70 bg-amber-400/10" : "border-sky-300/70 bg-sky-400/10"
                } text-xl font-bold shadow-md`}
              >
                <span className={isGold ? "text-amber-300" : "text-sky-300"}>+</span>
              </div>
              <span
                className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                  isGold ? "bg-amber-400 text-stone-950" : "bg-sky-400 text-white"
                }`}
              >
                ★
              </span>
            </div>

            <p className="mt-2 text-[15px] sm:text-base font-bold tracking-tight text-white drop-shadow-sm">
              Your App Here
            </p>
            <p className="mt-0.5 text-xs text-white/70 max-w-[260px] line-clamp-1">
              {isGold
                ? "🌟 Gold Spotlight #1 Row + Medium In-Depth Article"
                : "🔹 Blue Verified Placement + Reach 50K+ Mac Users"}
            </p>
          </div>

          {/* Bottom Bar: Tier Badge on left, Price Tag on right */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              {isGold ? (
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2 py-0.5 text-[10px] font-bold text-stone-950 shadow-xs ring-1 ring-amber-200/70">
                  ★ Gold Spotlight
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs ring-1 ring-sky-300/40">
                  ✦ Blue Featured
                </span>
              )}
              <span className="text-[11px] text-white/50">7 Days Active</span>
            </div>

            {/* Price with strikethrough if compare price is higher */}
            <div className="flex items-center gap-1.5">
              {discountPercent > 0 && (
                <span className="text-[11px] text-white/50 line-through">{originalPrice}</span>
              )}
              <span className={`text-xs sm:text-[13px] font-extrabold ${isGold ? "text-amber-300" : "text-sky-300"}`}>
                {salePrice}
              </span>
              {discountLabel && (
                <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[9.5px] font-bold text-rose-300 ring-1 ring-rose-400/30">
                  {discountLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info matching AppCard footer (Icon + Title + Price Pill) */}
      <div className="mt-3.5 flex items-start gap-3 px-1">
        {/* Logo Squircle Placeholder */}
        <div
          className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[11px] border-2 border-dashed ${
            isGold ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-300" : "border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-300"
          } text-[11px] font-bold shadow-xs`}
          title="Your App Logo"
        >
          <span className="text-xs leading-none">+</span>
          <span className="text-[8px] font-semibold leading-none tracking-tight opacity-75">Logo</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-ink group-hover:text-accent transition-colors">
                Your App Name Here
              </h3>
              {/* Verified checkmark badge icon */}
              {isGold ? (
                <span title="Gold Verified Badge Included" className="flex shrink-0 items-center text-amber-500">
                  <svg className="h-4 w-4 fill-amber-500" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </span>
              ) : (
                <span title="Blue Verified Badge Included" className="flex shrink-0 items-center text-sky-500">
                  <svg className="h-4 w-4 fill-sky-500" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </span>
              )}
            </div>

            {/* Click to Claim Button / Price Pill */}
            <div className="flex items-center gap-1 shrink-0">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  isGold
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 group-hover:bg-amber-500 group-hover:text-stone-950"
                    : "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30 group-hover:bg-sky-500 group-hover:text-white"
                } transition-colors`}
              >
                <span>Claim Spot</span>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </div>

          <p className="mt-1 line-clamp-1 text-[13px] text-muted">
            {isGold
              ? `List your app here · Top spot + Medium article · ${salePrice}`
              : `List your app here · Instant discovery · ${salePrice}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
