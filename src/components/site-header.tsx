import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { HeaderThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const [open, setOpen] = useState(false);
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [currentPath]);

  const handleNavClick = () => {
    setTimeout(() => setOpen(false), 50);
  };

  return (
    <div className="sticky top-0 z-40 w-full lg:hidden border-b border-line/70 bg-surface/85 backdrop-blur-xl">
      <header className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Mobile Brand Logo */}
        <Link
          to="/"
          preload="intent"
          className="flex shrink-0 items-center gap-2 text-[16px] font-bold tracking-tight text-ink"
          onClick={handleNavClick}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5 text-ink" aria-hidden="true">
            <path d="M17.05 12.536c-.03-3.02 2.463-4.47 2.575-4.54-1.404-2.052-3.59-2.333-4.365-2.365-1.858-.188-3.626 1.093-4.57 1.093-.944 0-2.4-1.067-3.945-1.037-2.03.03-3.9 1.18-4.945 3-2.108 3.653-.54 9.058 1.51 12.02 1.005 1.45 2.203 3.08 3.773 3.02 1.515-.06 2.09-.98 3.923-.98 1.83 0 2.352.98 3.955.95 1.635-.03 2.67-1.475 3.67-2.93 1.155-1.68 1.632-3.31 1.66-3.395-.036-.014-3.185-1.223-3.216-4.836zM14.02 3.61c.834-1.012 1.397-2.415 1.243-3.813-1.203.05-2.66.8-3.522 1.808-.775.895-1.454 2.325-1.27 3.696 1.34.104 2.71-.68 3.55-1.692z" />
          </svg>
          <span>PickMacApps</span>
        </Link>

        {/* Action Controls */}
        <div className="flex shrink-0 items-center gap-2">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-ink cursor-pointer"
              aria-label="Search apps"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          )}

          <HeaderThemeToggle />

          <Link
            to="/submit"
            className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-canvas transition hover:opacity-90"
          >
            Submit
          </Link>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-ink"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {open && (
        <nav className="border-t border-line bg-surface px-5 py-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Menu
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link to="/" search={{ sort: "hot", cat: "pick" }} onClick={handleNavClick} className="rounded-lg p-2 hover:bg-surface-2 text-ink">
              ⭐ Featured
            </Link>
            <Link to="/" search={{ sort: "hot", cat: "all" }} onClick={handleNavClick} className="rounded-lg p-2 hover:bg-surface-2 text-ink">
              🔥 Hot
            </Link>
            <Link to="/" search={{ sort: "new", cat: "all" }} onClick={handleNavClick} className="rounded-lg p-2 hover:bg-surface-2 text-ink">
              ✨ Latest
            </Link>
            <Link to="/" search={{ sort: "trending", cat: "all" }} onClick={handleNavClick} className="rounded-lg p-2 hover:bg-surface-2 text-ink">
              📈 Trending
            </Link>
            <Link to="/category" onClick={handleNavClick} className="rounded-lg p-2 hover:bg-surface-2 text-ink">
              📂 Categories
            </Link>
            <Link to="/leaderboard" onClick={handleNavClick} className="rounded-lg p-2 hover:bg-surface-2 text-ink">
              🏆 Leaderboard
            </Link>
            <Link to="/compare" onClick={handleNavClick} className="rounded-lg p-2 hover:bg-surface-2 text-ink">
              ⚖️ Alternatives
            </Link>
            <Link to="/blog" onClick={handleNavClick} className="rounded-lg p-2 hover:bg-surface-2 text-ink">
              📖 Blog
            </Link>
            <Link to="/sponsor" onClick={handleNavClick} className="rounded-lg p-2 hover:bg-surface-2 text-ink">
              💎 Sponsor
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
