import { Link } from "@tanstack/react-router";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="shrink-0 text-[18px] font-medium text-ink transition-opacity hover:opacity-75 sm:text-[20px]" onClick={() => setOpen(false)}>
          PickMacApps
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <a href="/#apps" className="rounded-lg px-3 py-2 text-sm text-body transition-colors hover:text-ink">
            Apps
          </a>
          <Link to="/compare" className="rounded-lg px-3 py-2 text-sm text-body transition-colors hover:text-ink">
            Alternatives
          </Link>
          <Link to="/blog" className="rounded-lg px-3 py-2 text-sm text-body transition-colors hover:text-ink">
            Blog
          </Link>
          <Link to="/sponsor" className="rounded-lg px-3 py-2 text-sm text-body transition-colors hover:text-ink">
            Sponsor
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/#apps" className="hidden rounded-lg px-3 py-2 text-sm text-body transition-colors hover:text-ink sm:inline-flex" aria-label="Search apps">
            Search
          </a>
          <Link
            to="/submit"
            className="inline-flex items-center rounded-full bg-ink px-3.5 py-2 text-sm font-medium text-canvas transition hover:opacity-90"
          >
            <span className="sm:hidden">Submit</span>
            <span className="hidden sm:inline">Submit an app</span>
          </Link>
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
      {open ? (
        <nav className="border-t border-line bg-canvas px-4 py-3 md:hidden">
          <ul className="space-y-1">
            <li>
              <a href="/#apps" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base text-ink">
                Apps
              </a>
            </li>
            <li>
              <Link to="/compare" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base text-ink">
                Alternatives
              </Link>
            </li>
            <li>
              <Link to="/blog" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base text-ink">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/sponsor" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base text-ink">
                Sponsor
              </Link>
            </li>
            <li>
              <a href="/#apps" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base text-ink">
                Search
              </a>
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