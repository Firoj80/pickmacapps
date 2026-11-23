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
        <div className="relative overflow-hidden rounded-2xl border-1.5 border-amber-400/80 bg-gradient-to-r from-amber-50/90 via-[#FFFDF5] to-white p-3.5 shadow-xs transition-all active:scale-[0.99]">
          <div className="flex items-center gap-2.5">
            {/* Rank / Spot Indicator (Omitted on homescreen when rank is undefined) */}
            {typeof rank === "number" ? (
              <div className="flex flex-col items-center justify-center shrink-0 w-6">
                {rank === 1 ? (
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] leading-none text-amber-500 select-none">👑</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-400 bg-amber-100 text-[10px] font-bold text-amber-950 shadow-2xs mt-0.5">
                      1
                    </span>
                  </div>
                ) : rank === 2 ? (
                  <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full border border-stone-300 bg-stone-100 text-[10.5px] font-bold text-stone-900 shadow-2xs">
                    2
                  </span>
                ) : rank === 3 ? (
                  <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full border border-amber-600/40 bg-amber-50 text-[10.5px] font-bold text-amber-800 shadow-2xs">
                    3
                  </span>
                ) : (
                  <span className="text-[12px] font-semibold text-stone-500">
                    {rank}
                  </span>
                )}
              </div>
            ) : null}

            {/* Dashed App Icon Placeholder with + */}
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-dashed border-amber-500/80 bg-amber-100/90 text-amber-900 text-xl font-bold shadow-xs">
                <span>+</span>
              </div>
              <BadgeCheckIcon className="absolute -bottom-1 -right-1 h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
            </div>

            {/* Center Content Column */}
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              {/* Row 1: Title + Black Friday 50% OFF Badge */}
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="truncate text-[14.5px] font-bold tracking-tight text-stone-950 group-hover:text-accent transition-colors">
                  Your App Here
                </h3>
                <span title="Gold Verified Badge" className="flex shrink-0 items-center">
                  <BadgeCheckIcon className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-stone-950" />
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-gradient-to-r from-amber-500 to-rose-500 px-1.5 py-0.2 text-[9.5px] font-extrabold text-black shadow-xs">
                  <span>🔥</span>
                  <span>50% OFF</span>
                </span>
              </div>

              {/* Row 2: Tagline */}
              <p className="mt-0.5 line-clamp-1 text-[12px] text-stone-700 font-medium leading-tight">
                Black Friday Sale · Gold #1 Spot + Article (Code: BFCM50)
              </p>

              {/* Row 3: Meta line with pricing in USD */}
              <div className="mt-1 flex items-center gap-2 text-[10.5px] text-stone-500 overflow-hidden">
                <span className="inline-flex items-center gap-1 truncate max-w-[85px]">
                  <svg className="h-3 w-3 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <span className="text-[10px] text-stone-400 line-through">{originalPrice}</span>
                  <span className="text-[12px] font-black text-amber-950">{salePrice}</span>
                  <span className="rounded bg-rose-100 px-1 py-0.2 text-[9px] font-bold text-rose-800 ring-1 ring-rose-300">
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400/70 via-amber-300/50 to-amber-500/70 p-[2px] shadow-[0_4px_20px_rgba(245,158,11,0.18)] transition-all duration-300 group-hover:shadow-[0_10px_28px_rgba(245,158,11,0.28)] group-hover:-translate-y-0.5">
          <div className="relative z-10 aspect-[1200/630] overflow-hidden rounded-[14px] bg-gradient-to-br from-[#FFFDF9] via-[#FAF7F0] to-[#F5EEDB] p-4 sm:p-5 flex flex-col justify-between text-stone-900 select-none border border-amber-200/60">
            {/* macOS window title bar with traffic lights & header */}
            <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] pb-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56] shadow-2xs" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E] shadow-2xs" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F] shadow-2xs" />
                <span className="ml-2 rounded-md bg-white/90 border border-amber-200/70 px-2 py-0.5 font-mono text-[10.5px] text-stone-600 shadow-2xs">
                  pickmacapps.store/your-app
                </span>
              </div>

              {/* Black Friday 50% OFF Badge */}
              <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-black shadow-xs">
                <span>🔥</span>
                <span>BLACK FRIDAY 50% OFF</span>
                <span className="font-mono bg-black/20 px-1 py-0.2 rounded text-[9.5px] text-white">BFCM50</span>
              </div>
            </div>

            {/* Center Relatable App Mockup */}
            <div className="flex flex-col items-center justify-center text-center my-auto py-1">
              {/* Dashed App Icon Placeholder with + */}
              <div className="relative group-hover:scale-105 transition-transform duration-300">
                <div className="flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-[16px] border-2 border-dashed border-amber-500/80 bg-gradient-to-br from-amber-200/70 via-amber-100 to-amber-300/50 text-2xl font-black text-amber-900 shadow-md">
                  <span>+</span>
                </div>
                <BadgeCheckIcon className="absolute -bottom-1 -right-1 h-5 w-5 shrink-0 fill-amber-500 text-stone-950 drop-shadow-xs" />
              </div>

              <h4 className="mt-2 text-base sm:text-[18px] font-bold tracking-tight text-stone-950">
                Feature Your Mac App Here
              </h4>
              <p className="mt-0.5 text-xs sm:text-[12.5px] text-stone-700 max-w-[340px] font-medium leading-snug">
                Claim the #1 Gold Spotlight · 50% OFF with code <span className="font-mono font-bold text-amber-950">BFCM50</span>
              </p>
            </div>

            {/* Bottom Bar: Tier Badge on left, Price Tag on right */}
            <div className="flex items-center justify-between pt-2 border-t border-black/[0.06]">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/50 px-2.5 py-0.5 text-[10px] font-bold text-amber-950 shadow-2xs">
                  <BadgeCheckIcon className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-stone-950" />
                  <span>Gold Spotlight · 7 Days</span>
                </span>
              </div>

              {/* Price in USD with strikethrough & BFCM tag */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-400 line-through font-medium">{originalPrice}</span>
                <span className="text-sm sm:text-base font-black text-stone-950">
                  {salePrice}
                </span>
                <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[9.5px] font-extrabold text-emerald-800">
                  50% OFF
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info matching AppCard footer (Icon + Title + Price Pill) */}
        <div className="mt-3.5 flex items-start gap-3 px-1">
          {/* Logo Squircle Placeholder */}
          <div
            className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[11px] border-2 border-dashed border-amber-500/70 bg-amber-100 text-amber-900 text-[11px] font-bold shadow-xs"
            title="Your App Logo"
          >
            <span className="text-xs leading-none">+</span>
            <span className="text-[8px] font-semibold leading-none tracking-tight opacity-75">Logo</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <h3 className="truncate text-[15.5px] font-semibold tracking-[-0.015em] text-ink group-hover:text-accent transition-colors">
                  Your App Name Here
                </h3>
                {/* Verified checkmark badge icon */}
                <span title="Gold Verified Badge Included" className="flex shrink-0 items-center">
                  <BadgeCheckIcon className="h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
                </span>
              </div>

              {/* Click to Claim Button / Price Pill */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1.5 text-xs font-extrabold text-stone-950 shadow-xs hover:brightness-105 transition-all">
                  <span>Claim Spot</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </div>

            <p className="mt-1 line-clamp-1 text-[13px] text-stone-600 font-normal">
              Black Friday 50% OFF with code BFCM50 · Top Spot + Medium Article · Only {salePrice}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
