import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { HeaderThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  // Automatically close mobile menu on route transitions
  useEffect(() => {
    setOpen(false);
  }, [currentPath]);

  // Safe deferred drawer close so clicks aren't aborted by DOM unmounting
  const handleNavClick = () => {
    setTimeout(() => setOpen(false), 50);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Brand Logo + Primary Nav links */}
        <div className="flex items-center gap-7">
          <Link
            to="/"
            preload="intent"
            className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-ink transition hover:opacity-80"
            onClick={handleNavClick}
          >
            <span>PickMacApps</span>
          </Link>

          <nav className="hidden items-center gap-5 text-[14px] text-body md:flex">
            <Link to="/" hash="apps" preload="intent" className="transition-colors hover:text-ink">
              Apps
            </Link>
            <Link to="/leaderboard" preload="intent" className="transition-colors hover:text-ink flex items-center gap-1">
              <span>Leaderboard</span>
            </Link>
            <Link to="/category" preload="intent" className="transition-colors hover:text-ink">
              Categories
            </Link>
            <Link to="/compare" preload="intent" className="transition-colors hover:text-ink">
              Alternatives
            </Link>
            <Link to="/blog" preload="intent" className="transition-colors hover:text-ink">
              Blog
            </Link>
          </nav>
        </div>

        {/* Right side: Sponsor link, Theme Switcher, and Submit Action */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <Link
            to="/sponsor"
            preload="intent"
            data-ml-goal="pricing_cta"
            className="hidden items-center gap-1.5 text-[14px] font-medium text-body transition-colors hover:text-ink sm:inline-flex"
          >
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 text-[10px]">
              ✔
            </span>
            <span>Sponsor</span>
          </Link>

          <HeaderThemeToggle />

          {/* Submit App Primary Action Button */}
          <Link
            to="/submit"
            preload="intent"
            data-ml-goal="signup_click"
            className="inline-flex items-center justify-center rounded-full bg-ink px-3 py-1.5 sm:px-4 sm:py-2 text-[12.5px] sm:text-[13.5px] font-medium text-canvas shadow-sm transition hover:opacity-90"
          >
            <span>Submit an app</span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile navigation panel */}
      {open ? (
        <nav className="border-t border-line bg-canvas px-4 py-3 md:hidden">
          <ul className="space-y-1">
            <li>
              <Link to="/" hash="apps" preload="intent" onClick={handleNavClick} className="block rounded-xl px-3 py-2.5 text-base text-ink">
                Apps
              </Link>
            </li>
            <li>
              <Link to="/leaderboard" preload="intent" onClick={handleNavClick} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-base text-ink">
                <span>🏆</span>
                <span>Leaderboard</span>
              </Link>
            </li>
            <li>
              <Link to="/category" preload="intent" onClick={handleNavClick} className="block rounded-xl px-3 py-2.5 text-base text-ink">
                Categories
              </Link>
            </li>
            <li>
              <Link to="/compare" preload="intent" onClick={handleNavClick} className="block rounded-xl px-3 py-2.5 text-base text-ink">
                Alternatives
              </Link>
            </li>
            <li>
              <Link to="/blog" preload="intent" onClick={handleNavClick} className="block rounded-xl px-3 py-2.5 text-base text-ink">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/sponsor" preload="intent" onClick={handleNavClick} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-base text-ink">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 text-[10px]">✔</span>
                <span>Sponsor</span>
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.05 12.536c-.03-3.02 2.463-4.47 2.575-4.54-1.404-2.052-3.59-2.333-4.365-2.365-1.858-.188-3.626 1.093-4.57 1.093-.944 0-2.4-1.067-3.945-1.037-2.03.03-3.9 1.18-4.945 3-2.108 3.653-.54 9.058 1.51 12.02 1.005 1.45 2.203 3.08 3.773 3.02 1.515-.06 2.09-.98 3.923-.98 1.83 0 2.352.98 3.955.95 1.635-.03 2.67-1.475 3.67-2.93 1.155-1.68 1.632-3.31 1.66-3.395-.036-.014-3.185-1.223-3.216-4.836zM14.02 3.61c.834-1.012 1.397-2.415 1.243-3.813-1.203.05-2.66.8-3.522 1.808-.775.895-1.454 2.325-1.27 3.696 1.34.104 2.71-.68 3.55-1.692z" />
    </svg>
  );
}