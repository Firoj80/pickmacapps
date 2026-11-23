import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheckIcon } from "@/components/icons";
import { fetchOffer } from "@/lib/directory.fn";

export type ClaimSpotOffer = Awaited<ReturnType<typeof fetchOffer>>;

export function ClaimSpotCard({
  tier: _tier,
  offer: initialOffer,
  rank,
}: {
  tier?: "article" | "featured";
  offer?: ClaimSpotOffer | null;
  rank?: number;
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

  // Calculate base prices in USD from backend settings
  const rawArticleDollars = Math.round((offer?.articlePriceCents ?? 12000) / 100);

  // Black Friday 50% OFF discount (matching coupon BFCM50 auto-applied on submit page)
  const articleSaleDollars = Math.round(rawArticleDollars * 0.5);

  const salePrice = `$${articleSaleDollars}`;
  const originalPrice = `$${rawArticleDollars}`;

  return (
    <Link
      to="/submit"
      search={{ tier: "article", coupon: "BFCM50" }}
      className="group block transition-all duration-300 ease-out cursor-pointer"
      title={`Claim Gold Spotlight — Black Friday 50% OFF (${salePrice})`}
    >
      {/* ======================================================== */}
      {/* 1. MOBILE VIEW (< sm): Thinner horizontal row claim card */}
      {/* ======================================================== */}
      <div className="sm:hidden">
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-500/70 bg-gradient-to-r from-amber-500/[0.14] via-amber-500/[0.04] to-surface p-3 shadow-[0_4px_22px_rgba(245,158,11,0.22)] transition-all active:scale-[0.99]">
          <div className="flex items-center gap-2.5">
            {/* Rank / Spot Indicator (Omitted on homescreen when rank is undefined) */}
            {typeof rank === "number" ? (
              <div className="flex flex-col items-center justify-center shrink-0 w-6">
                {rank === 1 ? (
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] leading-none text-amber-400 select-none">👑</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-400/80 bg-amber-400/15 text-[10px] font-bold text-amber-300 shadow-2xs mt-0.5">
                      1
                    </span>
                  </div>
                ) : rank === 2 ? (
                  <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full border border-amber-400/60 bg-amber-400/10 text-[10.5px] font-bold text-amber-300/90 shadow-2xs">
                    2
                  </span>
                ) : rank === 3 ? (
                  <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full border border-amber-700/60 bg-amber-700/15 text-[10.5px] font-bold text-amber-500/90 shadow-2xs">
                    3
                  </span>
                ) : (
                  <span className="text-[12px] font-semibold text-muted/70">
                    {rank}
                  </span>
                )}
              </div>
            ) : null}

            {/* Dashed App Icon Placeholder with + */}
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-dashed border-amber-400/80 bg-amber-400/10 text-amber-300 text-xl font-bold shadow-md">
                <span>+</span>
              </div>
              <BadgeCheckIcon className="absolute -bottom-1 -right-1 h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
            </div>

            {/* Center Content Column */}
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              {/* Row 1: Title + Black Friday 50% OFF Badge */}
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="truncate text-[14.5px] font-bold tracking-tight text-ink group-hover:text-accent transition-colors">
                  Your App Here
                </h3>
                <span title="Gold Verified Badge" className="flex shrink-0 items-center">
                  <BadgeCheckIcon className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-stone-950" />
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-gradient-to-r from-rose-500/25 to-amber-500/25 px-1.5 py-0.2 text-[9.5px] font-extrabold text-amber-300 ring-1 ring-amber-400/40">
                  <span>🔥</span>
                  <span>BFCM 50% OFF</span>
                </span>
              </div>

              {/* Row 2: Tagline */}
              <p className="mt-0.5 line-clamp-1 text-[12px] text-amber-300/90 font-medium leading-tight">
                Black Friday Sale · Gold #1 Spot + Article (Code: BFCM50)
              </p>

              {/* Row 3: Meta line with pricing in USD */}
              <div className="mt-1 flex items-center gap-2 text-[10.5px] text-stone-400 overflow-hidden">
                <span className="inline-flex items-center gap-1 truncate max-w-[85px]">
                  <svg className="h-3 w-3 shrink-0 text-amber-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>pickmacapps</span>
                </span>
                <span className="inline-flex items-center gap-1 shrink-0">
                  <span>7 Days</span>
                </span>
                <span className="inline-flex items-center gap-1.5 shrink-0 font-bold">
                  <span className="text-[10px] text-muted line-through">{originalPrice}</span>
                  <span className="text-[12px] font-black text-amber-300">{salePrice}</span>
                  <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[9px] font-bold text-rose-300 ring-1 ring-rose-400/30">
                    50% OFF
                  </span>
                </span>
              </div>
            </div>

            {/* Right Action Box (Matching Upvote Box Style) */}
            <div className="shrink-0 flex flex-col items-center justify-between w-12 h-13 rounded-2xl py-1 px-1 transition-all select-none shadow-sm bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 ring-1 ring-amber-200/80">
              <div className="flex items-center justify-center w-7 h-5.5 rounded-lg shadow-2xs bg-stone-950/85 text-amber-400">
                <span className="text-sm font-black leading-none">+</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-tight leading-none mb-0.5 text-stone-950">
                Claim
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DESKTOP VIEW (>= sm): Full visual screen preview card */}
      {/* ======================================================== */}
      <div className="hidden sm:flex sm:flex-col">
        {/* Visual Screen Preview Card matching AppCard 1200/630 ratio */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-500/50 bg-amber-500/[0.05] p-[2px] shadow-[0_6px_24px_rgba(245,158,11,0.18)] transition-all duration-300 group-hover:border-amber-400 group-hover:shadow-[0_14px_36px_rgba(245,158,11,0.32)] group-hover:-translate-y-1">
          <div
            style={{ background: "radial-gradient(circle at 50% 45%, rgba(245, 158, 11, 0.22), transparent 70%)" }}
            className="relative z-10 aspect-[1200/630] overflow-hidden rounded-[14px] bg-gradient-to-br from-[#1d1627] via-[#14101d] to-[#0c0a11] p-3.5 sm:p-4 flex flex-col justify-between text-white select-none"
          >
            {/* macOS window title bar with traffic lights & header */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[10px] text-white/40">pickmacapps.store/your-app</span>
              </div>

              {/* Black Friday 50% OFF Badge */}
              <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/30 to-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-200 ring-1 ring-amber-400/50 shadow-xs">
                <span className="animate-pulse">🔥</span>
                <span>BLACK FRIDAY 50% OFF</span>
                <span className="font-mono bg-black/40 px-1 py-0.2 rounded text-[9.5px] text-amber-300">BFCM50</span>
              </div>
            </div>

            {/* Center Relatable App Mockup */}
            <div className="flex flex-col items-center justify-center text-center my-auto py-1">
              {/* Dashed App Icon Placeholder with + */}
              <div className="relative group-hover:scale-105 transition-transform duration-300">
                <div className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-[14px] border-2 border-dashed border-amber-300/70 bg-amber-400/10 text-xl font-bold shadow-md">
                  <span className="text-amber-300">+</span>
                </div>
                <BadgeCheckIcon className="absolute -bottom-1 -right-1 h-4.5 w-4.5 shrink-0 fill-amber-400 text-stone-950" />
              </div>

              <p className="mt-2 text-[15px] sm:text-base font-bold tracking-tight text-white drop-shadow-sm">
                Your App Here
              </p>
              <p className="mt-0.5 text-xs text-amber-300/90 max-w-[280px] line-clamp-1 font-medium">
                🔥 Black Friday 50% OFF · Gold Spotlight #1 + Medium Article
              </p>
            </div>

            {/* Bottom Bar: Tier Badge on left, Price Tag on right */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2 py-0.5 text-[10px] font-bold text-stone-950 shadow-xs ring-1 ring-amber-200/70">
                  <BadgeCheckIcon className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-stone-950" />
                  <span>Gold Spotlight</span>
                </span>
                <span className="text-[11px] text-white/50">7 Days Active</span>
              </div>

              {/* Price in USD with strikethrough & BFCM tag */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-white/50 line-through">{originalPrice}</span>
                <span className="text-xs sm:text-[14px] font-black text-amber-300">
                  {salePrice}
                </span>
                <span className="rounded bg-rose-500/25 px-1.5 py-0.5 text-[9.5px] font-extrabold text-rose-300 ring-1 ring-rose-400/40">
                  50% OFF · BFCM50
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info matching AppCard footer (Icon + Title + Price Pill) */}
        <div className="mt-3.5 flex items-start gap-3 px-1">
          {/* Logo Squircle Placeholder */}
          <div
            className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[11px] border-2 border-dashed border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-[11px] font-bold shadow-xs"
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
                <span title="Gold Verified Badge Included" className="flex shrink-0 items-center">
                  <BadgeCheckIcon className="h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
                </span>
              </div>

              {/* Click to Claim Button / Price Pill */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
                  <span>Claim Spot</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </div>

            <p className="mt-1 line-clamp-1 text-[13px] text-stone-300 font-normal">
              Black Friday 50% OFF with code BFCM50 · Top Spot + Medium Article · Only {salePrice}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
