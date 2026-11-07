import { Link, useRouteContext } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { shelfCategories } from "@/lib/shelf-categories";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Read categories from root context if available, otherwise fallback
  const rootContext = useRouteContext({ from: "__root__" }) as { directory?: { categories?: Array<{ slug: string; name: string; emoji?: string }> } };
  const categories = rootContext?.directory?.categories?.length
    ? rootContext.directory.categories
    : shelfCategories;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Brand Logo + Primary Nav links */}
        <div className="flex items-center gap-7">
          <Link
            to="/"
            className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-ink transition hover:opacity-80"
            onClick={() => setOpen(false)}
          >
            <span>PickMac</span>
            <span className="inline-flex items-center justify-center text-[18px]">💻</span>
            <span>Apps</span>
          </Link>

          <nav className="hidden items-center gap-5 text-[14px] text-body md:flex">
            <a href="/#apps" className="transition-colors hover:text-ink">
              Apps
            </a>

            {/* Categories Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setCategoriesOpen((prev) => !prev)}
                className="flex items-center gap-1.5 transition-colors hover:text-ink cursor-pointer"
                aria-expanded={categoriesOpen}
              >
                <span>Categories</span>
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-150 ${categoriesOpen ? "rotate-180" : ""}`}
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

              {categoriesOpen ? (
                <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl border border-line bg-surface/95 p-2 shadow-xl backdrop-blur-xl z-50">
                  <div className="space-y-0.5">
                    {categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        to="/category/$slug"
                        params={{ slug: cat.slug }}
                        onClick={() => setCategoriesOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-body transition-colors hover:bg-surface-2 hover:text-ink"
                      >
                        <span className="text-[15px]">{cat.emoji ?? "📁"}</span>
                        <span>{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <Link to="/compare" className="transition-colors hover:text-ink">
              Alternatives
            </Link>
            <Link to="/blog" className="transition-colors hover:text-ink">
              Blog
            </Link>
          </nav>
        </div>

        {/* Right side: Sponsor link and Submit Action */}
        <div className="flex items-center gap-4">
          <Link
            to="/sponsor"
            className="hidden items-center gap-1.5 text-[14px] font-medium text-body transition-colors hover:text-ink sm:inline-flex"
          >
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 text-[10px]">
              ✔
            </span>
            <span>Sponsor</span>
          </Link>

          {/* Submit App Primary Action Button */}
          <Link
            to="/submit"
            className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-canvas shadow-sm transition hover:opacity-90"
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
              <a href="/#apps" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-base text-ink">
                Apps
              </a>
            </li>
            <li>
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Categories</span>
                <div className="mt-1.5 grid grid-cols-2 gap-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      to="/category/$slug"
                      params={{ slug: cat.slug }}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-body hover:text-ink"
                    >
                      <span>{cat.emoji ?? "📁"}</span>
                      <span className="truncate">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </li>
            <li>
              <Link to="/compare" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-base text-ink">
                Alternatives
              </Link>
            </li>
            <li>
              <Link to="/blog" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-base text-ink">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/sponsor" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-base text-ink">
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