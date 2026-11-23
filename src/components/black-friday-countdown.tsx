import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";

// Black Friday Sale ends on November 30, 2026 at 23:59:59 UTC
const BFCM_END_TIMESTAMP = new Date(Date.UTC(2026, 10, 30, 23, 59, 59)).getTime();
export const BFCM_COUPON_CODE = "BFCM50";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function calculateTimeLeft(): TimeLeft {
  const diff = BFCM_END_TIMESTAMP - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export function BlackFridayCountdown({
  className = "",
  isMobile = false,
  isSubmitPage = false,
  isSponsorPage = false,
  salePrice = "$15",
  originalPrice = "$29",
  onApplyCoupon,
}: {
  className?: string;
  isMobile?: boolean;
  isSubmitPage?: boolean;
  isSponsorPage?: boolean;
  salePrice?: string;
  originalPrice?: string;
  onApplyCoupon?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyCoupon = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(BFCM_COUPON_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (timeLeft.expired) {
    return null;
  }

  // Sponsor page layout: wide banner placed above main placement card
  if (isSponsorPage) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 p-4 sm:p-5 text-stone-900 shadow-sm backdrop-blur-md ${className}`}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/15 blur-2xl" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-black shadow-xs">
                🔥 Black Friday Sale
              </span>
              <span className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                50% OFF All Sponsorships
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-300">
                ✓ Auto-Applied
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span>
                Feature your app in the #1 Hero Spot for just{" "}
                <strong className="text-amber-900 font-bold">{salePrice}</strong>{" "}
                <span className="line-through text-stone-400">({originalPrice})</span> with promo code{" "}
                <span className="font-mono font-bold text-amber-900">{BFCM_COUPON_CODE}</span>
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-stone-500">Ends Nov 30</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Countdown Timer */}
            <div className="flex items-center gap-1.5 font-mono">
              <div className="flex flex-col items-center">
                <span className="min-w-[30px] rounded-lg bg-white border border-stone-200 px-2 py-1 text-center font-mono text-xs font-extrabold text-stone-900 shadow-2xs">
                  {mounted ? String(timeLeft.days).padStart(2, "0") : "12"}
                </span>
                <span className="text-[9px] font-semibold text-stone-500 uppercase mt-0.5">Days</span>
              </div>
              <span className="font-bold text-stone-400 -mt-3.5">:</span>
              <div className="flex flex-col items-center">
                <span className="min-w-[30px] rounded-lg bg-white border border-stone-200 px-2 py-1 text-center font-mono text-xs font-extrabold text-stone-900 shadow-2xs">
                  {mounted ? String(timeLeft.hours).padStart(2, "0") : "00"}
                </span>
                <span className="text-[9px] font-semibold text-stone-500 uppercase mt-0.5">Hours</span>
              </div>
              <span className="font-bold text-stone-400 -mt-3.5">:</span>
              <div className="flex flex-col items-center">
                <span className="min-w-[30px] rounded-lg bg-white border border-stone-200 px-2 py-1 text-center font-mono text-xs font-extrabold text-stone-900 shadow-2xs">
                  {mounted ? String(timeLeft.minutes).padStart(2, "0") : "00"}
                </span>
                <span className="text-[9px] font-semibold text-stone-500 uppercase mt-0.5">Mins</span>
              </div>
              <span className="font-bold text-stone-400 -mt-3.5">:</span>
              <div className="flex flex-col items-center">
                <span className="min-w-[30px] rounded-lg bg-white border border-stone-200 px-2 py-1 text-center font-mono text-xs font-extrabold text-stone-900 shadow-2xs">
                  {mounted ? String(timeLeft.seconds).padStart(2, "0") : "00"}
                </span>
                <span className="text-[9px] font-semibold text-stone-500 uppercase mt-0.5">Secs</span>
              </div>
            </div>

            <Link
              to="/submit"
              search={{ tier: "article", coupon: BFCM_COUPON_CODE }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-2 text-xs font-extrabold text-neutral-950 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Claim 50% OFF ({salePrice})</span>
              <span className="text-sm leading-none">→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Submit page layout: wide banner placed at top of submit page
  if (isSubmitPage) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 p-4 sm:p-5 text-stone-900 shadow-sm backdrop-blur-md ${className}`}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/15 blur-2xl" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-black shadow-xs">
                🔥 Black Friday Sale
              </span>
              <span className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                50% OFF All Paid Listings
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-300">
                ✓ Auto-Applied
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span>
                Promo code <span className="font-mono font-bold text-amber-900">{BFCM_COUPON_CODE}</span> auto-applied · 50% discount active for Golden Spotlight & Hot Boost
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-stone-500">Ends Nov 30</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Countdown Timer */}
            <div className="flex items-center gap-1.5 font-mono">
              <div className="flex flex-col items-center">
                <span className="min-w-[30px] rounded-lg bg-white border border-stone-200 px-2 py-1 text-center font-mono text-xs font-extrabold text-stone-900 shadow-2xs">
                  {mounted ? String(timeLeft.days).padStart(2, "0") : "12"}
                </span>
                <span className="text-[9px] font-semibold text-stone-500 uppercase mt-0.5">Days</span>
              </div>
              <span className="font-bold text-stone-400 -mt-3.5">:</span>
              <div className="flex flex-col items-center">
                <span className="min-w-[30px] rounded-lg bg-white border border-stone-200 px-2 py-1 text-center font-mono text-xs font-extrabold text-stone-900 shadow-2xs">
                  {mounted ? String(timeLeft.hours).padStart(2, "0") : "00"}
                </span>
                <span className="text-[9px] font-semibold text-stone-500 uppercase mt-0.5">Hours</span>
              </div>
              <span className="font-bold text-stone-400 -mt-3.5">:</span>
              <div className="flex flex-col items-center">
                <span className="min-w-[30px] rounded-lg bg-white border border-stone-200 px-2 py-1 text-center font-mono text-xs font-extrabold text-stone-900 shadow-2xs">
                  {mounted ? String(timeLeft.minutes).padStart(2, "0") : "00"}
                </span>
                <span className="text-[9px] font-semibold text-stone-500 uppercase mt-0.5">Mins</span>
              </div>
              <span className="font-bold text-stone-400 -mt-3.5">:</span>
              <div className="flex flex-col items-center">
                <span className="min-w-[30px] rounded-lg bg-white border border-stone-200 px-2 py-1 text-center font-mono text-xs font-extrabold text-stone-900 shadow-2xs">
                  {mounted ? String(timeLeft.seconds).padStart(2, "0") : "00"}
                </span>
                <span className="text-[9px] font-semibold text-stone-500 uppercase mt-0.5">Secs</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onApplyCoupon?.();
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-100 px-3.5 py-2 text-xs font-extrabold text-emerald-800 shadow-xs transition-all hover:bg-emerald-200 active:scale-95 cursor-pointer"
            >
              <span>{copied ? "✓ Copied BFCM50" : "✓ 50% Applied"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout: sleek horizontal banner placed below site title
  if (isMobile) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-rose-500/15 p-3.5 text-stone-900 shadow-xs ${className}`}
      >
        {/* Glow accent */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-500/15 blur-xl" />

        <div className="flex items-center justify-between gap-2 border-b border-black/[0.08] pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
              BLACK FRIDAY SALE IS LIVE · 50% OFF
            </span>
          </div>
          <span className="text-[10px] font-medium text-stone-500">Ends Nov 30</span>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          {/* Coupon chip with 1-click copy */}
          <button
            type="button"
            onClick={copyCoupon}
            title="Click to copy coupon code"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100/90 px-2.5 py-1 text-xs font-mono font-bold text-amber-900 hover:bg-amber-200 transition cursor-pointer active:scale-95"
          >
            <span>{BFCM_COUPON_CODE}</span>
            <span className="text-[10px] text-amber-700 font-sans">
              {copied ? "✓ Copied" : "Copy"}
            </span>
          </button>

          {/* Countdown timer */}
          <div className="flex items-center gap-1 font-mono text-xs font-bold text-stone-900">
            <span className="rounded bg-white border border-stone-200 px-1.5 py-0.5 text-stone-900">
              {mounted ? String(timeLeft.days).padStart(2, "0") : "14"}d
            </span>
            <span>:</span>
            <span className="rounded bg-white border border-stone-200 px-1.5 py-0.5 text-stone-900">
              {mounted ? String(timeLeft.hours).padStart(2, "0") : "00"}h
            </span>
            <span>:</span>
            <span className="rounded bg-white border border-stone-200 px-1.5 py-0.5 text-stone-900">
              {mounted ? String(timeLeft.minutes).padStart(2, "0") : "00"}m
            </span>
            <span>:</span>
            <span className="rounded bg-white border border-stone-200 px-1.5 py-0.5 text-stone-900">
              {mounted ? String(timeLeft.seconds).padStart(2, "0") : "00"}s
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-black/[0.08] flex items-center justify-between text-xs">
          <span className="text-[11px] text-stone-600">50% off all paid listings</span>
          <Link
            to="/submit"
            search={{ coupon: BFCM_COUPON_CODE }}
            className="font-bold text-amber-800 hover:underline flex items-center gap-1"
          >
            <span>Claim 50% OFF</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  // Desktop layout: placed in hero, height strictly matches icon height (h-11 sm:h-12)
  return (
    <div
      className={`relative shrink-0 inline-flex items-center gap-2 sm:gap-2.5 h-11 sm:h-12 rounded-[14px] sm:rounded-[16px] border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 px-3 text-stone-900 shadow-sm backdrop-blur-md transition-all hover:border-amber-400 ${className}`}
    >
      {/* Decorative ambient flare */}
      <div className="pointer-events-none absolute -right-6 -bottom-6 h-16 w-16 rounded-full bg-amber-500/15 blur-lg" />

      {/* Sale Pill */}
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-black shadow-xs shrink-0 whitespace-nowrap">
        🔥 BLACK FRIDAY SALE IS LIVE
      </span>

      {/* Coupon Code & Discount Pill */}
      <div className="flex items-center gap-1.5 text-xs shrink-0 whitespace-nowrap">
        <span className="font-extrabold text-amber-900">50% OFF</span>
        <button
          type="button"
          onClick={copyCoupon}
          title="Click to copy coupon code BFCM50"
          className="inline-flex items-center gap-1 rounded-md border border-amber-300/90 bg-amber-100 px-1.5 py-0.5 font-mono text-xs font-bold text-amber-900 hover:bg-amber-200 transition cursor-pointer active:scale-95"
        >
          <span>{BFCM_COUPON_CODE}</span>
          <span className="text-[9.5px] text-amber-700 font-sans">
            {copied ? "✓" : "Copy"}
          </span>
        </button>
      </div>

      {/* Subtle Divider */}
      <div className="h-5 w-px bg-stone-300 shrink-0" />

      {/* Countdown Timer Blocks (Clean single line) */}
      <div className="flex items-center gap-1 font-mono text-xs shrink-0 whitespace-nowrap">
        <span className="rounded-md bg-white border border-stone-200 px-1.5 py-0.5 font-bold text-stone-900 shadow-2xs">
          {mounted ? String(timeLeft.days).padStart(2, "0") : "14"}d
        </span>
        <span className="text-stone-400">:</span>
        <span className="rounded-md bg-white border border-stone-200 px-1.5 py-0.5 font-bold text-stone-900 shadow-2xs">
          {mounted ? String(timeLeft.hours).padStart(2, "0") : "00"}h
        </span>
        <span className="text-stone-400">:</span>
        <span className="rounded-md bg-white border border-stone-200 px-1.5 py-0.5 font-bold text-stone-900 shadow-2xs">
          {mounted ? String(timeLeft.minutes).padStart(2, "0") : "00"}m
        </span>
        <span className="text-stone-400">:</span>
        <span className="rounded-md bg-white border border-stone-200 px-1.5 py-0.5 font-bold text-stone-900 shadow-2xs">
          {mounted ? String(timeLeft.seconds).padStart(2, "0") : "00"}s
        </span>
      </div>

      {/* Direct CTA button */}
      <Link
        to="/submit"
        search={{ coupon: BFCM_COUPON_CODE }}
        className="ml-1 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 sm:px-3 py-1.5 text-xs font-extrabold text-neutral-950 shadow-xs transition-all hover:brightness-105 active:scale-95 shrink-0 whitespace-nowrap"
      >
        <span>Claim</span>
        <span className="text-sm leading-none">→</span>
      </Link>
    </div>
  );
}
