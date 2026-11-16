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
  onApplyCoupon,
}: {
  className?: string;
  isMobile?: boolean;
  isSubmitPage?: boolean;
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

  // Submit page layout: wide banner placed at top of submit page
  if (isSubmitPage) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950/70 p-4 text-white shadow-lg backdrop-blur-md ${className}`}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/15 blur-2xl" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-black shadow-xs">
                🔥 Black Friday Sale
              </span>
              <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                50% OFF All Paid Listings
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/80 mt-0.5">
              <span>Use coupon code:</span>
              <button
                type="button"
                onClick={(e) => {
                  copyCoupon(e);
                  onApplyCoupon?.();
                }}
                title="Click to copy & apply coupon code"
                className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-300 hover:bg-amber-400/30 transition cursor-pointer active:scale-95"
              >
                <span>{BFCM_COUPON_CODE}</span>
                <span className="text-[10px] text-amber-200 font-sans">
                  {copied ? "✓ Copied & Applied" : "Copy & Apply"}
                </span>
              </button>
              <span className="text-white/60">· Valid till Nov 30</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Countdown Timer */}
            <div className="flex items-center gap-1.5 font-mono">
              <div className="flex flex-col items-center">
                <span className="min-w-[28px] rounded-lg bg-white/10 px-2 py-1 text-center font-mono text-xs font-extrabold text-amber-300 shadow-inner">
                  {mounted ? String(timeLeft.days).padStart(2, "0") : "14"}
                </span>
                <span className="text-[9px] font-semibold text-white/60 uppercase mt-0.5">Days</span>
              </div>
              <span className="font-bold text-amber-400 -mt-3.5">:</span>
              <div className="flex flex-col items-center">
                <span className="min-w-[28px] rounded-lg bg-white/10 px-2 py-1 text-center font-mono text-xs font-extrabold text-amber-300 shadow-inner">
                  {mounted ? String(timeLeft.hours).padStart(2, "0") : "00"}
                </span>
                <span className="text-[9px] font-semibold text-white/60 uppercase mt-0.5">Hours</span>
              </div>
              <span className="font-bold text-amber-400 -mt-3.5">:</span>
              <div className="flex flex-col items-center">
                <span className="min-w-[28px] rounded-lg bg-white/10 px-2 py-1 text-center font-mono text-xs font-extrabold text-amber-300 shadow-inner">
                  {mounted ? String(timeLeft.minutes).padStart(2, "0") : "00"}
                </span>
                <span className="text-[9px] font-semibold text-white/60 uppercase mt-0.5">Mins</span>
              </div>
              <span className="font-bold text-amber-400 -mt-3.5">:</span>
              <div className="flex flex-col items-center">
                <span className="min-w-[28px] rounded-lg bg-white/10 px-2 py-1 text-center font-mono text-xs font-extrabold text-amber-300 shadow-inner">
                  {mounted ? String(timeLeft.seconds).padStart(2, "0") : "00"}
                </span>
                <span className="text-[9px] font-semibold text-white/60 uppercase mt-0.5">Secs</span>
              </div>
            </div>

            {/* Direct Action Button */}
            <button
              type="button"
              onClick={() => {
                onApplyCoupon?.();
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-2 text-xs font-extrabold text-neutral-950 shadow-md transition-all hover:scale-105 hover:shadow-amber-500/25 active:scale-95 cursor-pointer"
            >
              <span>{copied ? "✓ 50% Applied!" : "Apply 50% Discount"}</span>
              <span className="text-sm leading-none">→</span>
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
        className={`relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950/60 p-3.5 text-white shadow-md ${className}`}
      >
        {/* Glow accent */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-500/20 blur-xl" />

        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              Black Friday Sale · 50% OFF
            </span>
          </div>
          <span className="text-[10px] font-medium text-white/70">Ends Nov 30</span>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          {/* Coupon chip with 1-click copy */}
          <button
            type="button"
            onClick={copyCoupon}
            title="Click to copy coupon code"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-xs font-mono font-bold text-amber-300 hover:bg-amber-400/25 transition cursor-pointer active:scale-95"
          >
            <span>{BFCM_COUPON_CODE}</span>
            <span className="text-[10px] text-amber-200/80 font-sans">
              {copied ? "✓ Copied" : "Copy"}
            </span>
          </button>

          {/* Countdown timer */}
          <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-200">
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-white">
              {mounted ? String(timeLeft.days).padStart(2, "0") : "14"}d
            </span>
            <span>:</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-white">
              {mounted ? String(timeLeft.hours).padStart(2, "0") : "00"}h
            </span>
            <span>:</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-white">
              {mounted ? String(timeLeft.minutes).padStart(2, "0") : "00"}m
            </span>
            <span>:</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-white">
              {mounted ? String(timeLeft.seconds).padStart(2, "0") : "00"}s
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-[11px] text-white/70">50% off all paid listings</span>
          <Link
            to="/submit"
            search={{ coupon: BFCM_COUPON_CODE }}
            className="font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Claim 50% OFF</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  // Desktop layout: placed next to the hot app icons in hero
  return (
    <div
      className={`relative shrink-0 inline-flex items-center gap-3.5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950/70 py-2 px-3.5 text-white shadow-lg backdrop-blur-md transition-all hover:border-amber-400/60 ${className}`}
    >
      {/* Decorative ambient flare */}
      <div className="pointer-events-none absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-amber-500/15 blur-lg" />

      {/* Sale info column */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-black shadow-xs">
            🔥 Black Friday
          </span>
          <span className="text-xs font-bold text-white tracking-tight">
            50% OFF Paid Listing
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-white/80 mt-1">
          <span>Use coupon:</span>
          <button
            type="button"
            onClick={copyCoupon}
            title="Click to copy coupon code"
            className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/20 px-1.5 py-0.5 font-mono text-xs font-bold text-amber-300 hover:bg-amber-400/30 transition cursor-pointer active:scale-95"
          >
            <span>{BFCM_COUPON_CODE}</span>
            <span className="text-[10px] text-amber-200 font-sans">
              {copied ? "✓ Copied" : "Copy"}
            </span>
          </button>
          <span className="text-[10px] text-white/60">· Valid till Nov 30</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-10 w-px bg-white/15" />

      {/* Countdown Timer Blocks */}
      <div className="flex items-center gap-1.5">
        <div className="flex flex-col items-center">
          <span className="min-w-[28px] rounded-lg bg-white/10 px-1.5 py-1 text-center font-mono text-xs font-extrabold text-amber-300 shadow-inner">
            {mounted ? String(timeLeft.days).padStart(2, "0") : "14"}
          </span>
          <span className="text-[9px] font-semibold text-white/60 uppercase mt-0.5">Days</span>
        </div>
        <span className="font-bold text-amber-400 -mt-3.5">:</span>
        <div className="flex flex-col items-center">
          <span className="min-w-[28px] rounded-lg bg-white/10 px-1.5 py-1 text-center font-mono text-xs font-extrabold text-amber-300 shadow-inner">
            {mounted ? String(timeLeft.hours).padStart(2, "0") : "00"}
          </span>
          <span className="text-[9px] font-semibold text-white/60 uppercase mt-0.5">Hours</span>
        </div>
        <span className="font-bold text-amber-400 -mt-3.5">:</span>
        <div className="flex flex-col items-center">
          <span className="min-w-[28px] rounded-lg bg-white/10 px-1.5 py-1 text-center font-mono text-xs font-extrabold text-amber-300 shadow-inner">
            {mounted ? String(timeLeft.minutes).padStart(2, "0") : "00"}
          </span>
          <span className="text-[9px] font-semibold text-white/60 uppercase mt-0.5">Mins</span>
        </div>
        <span className="font-bold text-amber-400 -mt-3.5">:</span>
        <div className="flex flex-col items-center">
          <span className="min-w-[28px] rounded-lg bg-white/10 px-1.5 py-1 text-center font-mono text-xs font-extrabold text-amber-300 shadow-inner">
            {mounted ? String(timeLeft.seconds).padStart(2, "0") : "00"}
          </span>
          <span className="text-[9px] font-semibold text-white/60 uppercase mt-0.5">Secs</span>
        </div>
      </div>

      {/* Direct CTA button */}
      <Link
        to="/submit"
        search={{ coupon: BFCM_COUPON_CODE }}
        className="ml-1 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-2 text-xs font-extrabold text-neutral-950 shadow-md transition-all hover:scale-105 hover:shadow-amber-500/25 active:scale-95"
      >
        <span>Claim 50% OFF</span>
        <span className="text-sm leading-none">→</span>
      </Link>
    </div>
  );
}
