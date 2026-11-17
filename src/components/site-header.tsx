import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { HeaderThemeToggle } from "@/components/theme-toggle";
import { PickMacAppsIcon } from "@/components/brand-logo";
import { SiteSidebarContent } from "@/components/site-sidebar";

export function SiteHeader({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const [open, setOpen] = useState(false);
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [currentPath]);

  // Lock background scroll and listen for Escape when mobile drawer is open
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-0 z-40 w-full lg:hidden border-b border-line/70 bg-surface/85 backdrop-blur-xl">
        <header className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          {/* Mobile Brand Logo */}
          <Link
            to="/"
            preload="intent"
            className="flex shrink-0 items-center gap-2.5 text-[16px] font-bold tracking-tight text-ink"
            onClick={() => setOpen(false)}
          >
            <PickMacAppsIcon className="h-5.5 w-5.5 shrink-0" />
            <span>PickMacApps</span>
          </Link>

          {/* Action Controls */}
          <div className="flex shrink-0 items-center gap-2">
            <HeaderThemeToggle />

            <Link
              to="/submit"
              className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-canvas transition hover:opacity-90"
            >
              Submit
            </Link>

            {/* Menu Trigger Button (3 lines) */}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-ink cursor-pointer transition active:scale-95"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>
      </div>

      {/* Fullscreen Backdrop: clicking anywhere outside closes the left menu */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden cursor-pointer"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-over Left Side Menu for Mobile (Desktop-style left menu) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] sm:w-[300px] max-w-[85vw] bg-canvas border-r border-line shadow-2xl flex flex-col transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className="h-full px-4 pt-4 pb-2">
          <SiteSidebarContent
            onOpenSearch={() => {
              setOpen(false);
              onOpenSearch?.();
            }}
            onClose={() => setOpen(false)}
            isMobile
          />
        </div>
      </aside>
    </>
  );
}
