import { useState, useRef, useEffect } from "react";
import {
  CURRENCY_LIST,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "@/lib/currency";

export function CurrencySelector({
  value,
  onChange,
  className = "",
  label = "Currency:",
}: {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  className?: string;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = SUPPORTED_CURRENCIES[value] || SUPPORTED_CURRENCIES.USD;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {label && <span className="font-medium text-muted hidden sm:inline">{label}</span>}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink shadow-2xs hover:border-line-2 hover:bg-surface-2 transition-all cursor-pointer"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-sm leading-none">{current.flag}</span>
          <span className="font-bold text-ink">{current.code}</span>
          <span className="text-muted text-[11px] font-medium">({current.symbol})</span>
          <svg
            className={`h-3 w-3 text-muted transition-transform duration-150 ${
              isOpen ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1.5 w-44 rounded-xl border border-line bg-surface p-1 shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1 text-[10px] font-semibold text-muted uppercase tracking-wider border-b border-line/60">
            Select Currency
          </div>
          <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
            {CURRENCY_LIST.map((c) => {
              const isSelected = c.code === value;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-accent/10 font-bold text-accent"
                      : "text-ink hover:bg-surface-2"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{c.flag}</span>
                    <span>{c.code}</span>
                  </div>
                  <span className="text-[11px] text-muted font-medium">{c.symbol}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
