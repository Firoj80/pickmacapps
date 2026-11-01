import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("theme", theme);
}

export function SiteHeader() {
  const [themeOpen, setThemeOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setThemeOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="shrink-0 text-[18px] font-medium text-ink transition-opacity hover:opacity-75 sm:text-[20px]">
          PickMacApps
        </Link>
        <nav className="flex items-center gap-0.5 overflow-x-auto sm:gap-2">
          <a href="/#apps" className="hidden shrink-0 items-center rounded-lg px-3 py-2 text-sm text-body transition-colors hover:text-ink sm:inline-flex">
            Apps
          </a>
          <Link to="/compare" className="inline-flex shrink-0 items-center rounded-lg px-2 py-2 text-sm text-body transition-colors hover:text-ink sm:px-3">
            Alternatives
          </Link>
          <Link to="/blog" className="inline-flex shrink-0 items-center rounded-lg px-2 py-2 text-sm text-body transition-colors hover:text-ink sm:px-3">
            Blog
          </Link>
          <Link
            to="/submit"
            className="inline-flex items-center rounded-lg border border-line-2 bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
          >
            Submit
          </Link>
          <div className="relative">
            <button
              type="button"
              aria-label="Change theme"
              aria-haspopup="menu"
              aria-expanded={themeOpen}
              title="Theme"
              onClick={() => setThemeOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-body transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <SunIcon />
            </button>
            {themeOpen ? (
              <div role="menu" className="absolute top-11 right-0 z-50 w-36 rounded-xl border border-line bg-canvas p-1 shadow-lg">
                {(["light", "dark", "system"] as const).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    role="menuitem"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink capitalize hover:bg-surface-2"
                    onClick={() => {
                      applyTheme(theme);
                      setThemeOpen(false);
                    }}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}

function SunIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
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
