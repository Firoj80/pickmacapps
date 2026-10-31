import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apps } from "@/lib/catalog";

function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.05 12.536c-.03-3.02 2.463-4.47 2.575-4.54-1.404-2.052-3.59-2.333-4.365-2.365-1.858-.188-3.626 1.093-4.57 1.093-.944 0-2.4-1.067-3.945-1.037-2.03.03-3.9 1.18-4.945 3-2.108 3.653-.54 9.058 1.51 12.02 1.005 1.45 2.203 3.08 3.773 3.02 1.515-.06 2.09-.98 3.923-.98 1.83 0 2.352.98 3.955.95 1.635-.03 2.67-1.475 3.67-2.93 1.155-1.68 1.632-3.31 1.66-3.395-.036-.014-3.185-1.223-3.216-4.836zM14.02 3.61c.834-1.012 1.397-2.415 1.243-3.813-1.203.05-2.66.8-3.522 1.808-.775.895-1.454 2.325-1.27 3.696 1.34.104 2.71-.68 3.55-1.692z" />
    </svg>
  );
}

export function SiteHeader() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");

  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return apps.slice(0, 6);
    return apps
      .filter((app) => app.name.toLowerCase().includes(needle) || app.tagline.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [q]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setOpen(false);
        setMenu(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(slug: string) {
    setOpen(false);
    setQ("");
    void navigate({ to: "/app/$slug", params: { slug } });
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const first = hits[0];
    if (first) go(first.slug);
  }

  return (
    <header className="relative mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-5 pt-6 md:px-10 md:pt-8">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-ink">
          <span>Pick</span>
          <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-[6px] object-cover" />
          <span>MacApps</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <a href="/#apps" className="rounded-full px-3.5 py-2 text-muted transition hover:text-ink">
            Apps
          </a>
          <a href="/#categories" className="rounded-full px-3.5 py-2 text-muted transition hover:text-ink">
            Categories
          </a>
          <Link to="/blog" className="rounded-full px-3.5 py-2 text-muted transition hover:text-ink">
            Guides
          </Link>
          <Link to="/compare" className="rounded-full px-3.5 py-2 text-muted transition hover:text-ink">
            Comparisons
          </Link>
        </nav>
      </div>

      <div className="hidden items-center gap-2 text-sm md:flex">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2/70 px-3 py-1.5 text-xs text-muted transition hover:bg-surface-2 hover:text-ink"
          aria-label="Search apps"
        >
          <SearchGlyph />
          <span>Search</span>
          <span className="rounded border border-line bg-canvas px-1 py-0.5 text-[10px] font-medium text-muted">⌘K</span>
        </button>
        <Link
          to="/submit"
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas transition hover:opacity-90"
        >
          Submit an app
        </Link>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted"
          aria-label="Search apps"
        >
          <SearchGlyph className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setMenu((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted"
          aria-label="Open menu"
        >
          <MenuGlyph />
        </button>
      </div>

      {menu ? (
        <div className="absolute top-16 right-5 z-50 w-52 rounded-2xl border border-line bg-canvas p-2 shadow-lg md:hidden">
          <a href="/#apps" onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2 text-sm text-ink">
            Apps
          </a>
          <a href="/#categories" onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2 text-sm text-ink">
            Categories
          </a>
          <Link to="/blog" onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2 text-sm text-ink">
            Guides
          </Link>
          <Link to="/compare" onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2 text-sm text-ink">
            Comparisons
          </Link>
          <Link to="/submit" onClick={() => setMenu(false)} className="mt-1 block rounded-xl bg-ink px-3 py-2 text-center text-sm text-canvas">
            Submit an app
          </Link>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 pt-24" onClick={() => setOpen(false)}>
          <form
            onSubmit={onSearch}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-canvas shadow-xl"
          >
            <label className="flex items-center gap-3 border-b border-line px-4">
              <SearchGlyph />
              <input
                autoFocus
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search apps"
                aria-label="Search apps"
                className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </label>
            <ul className="max-h-80 overflow-auto py-2">
              {hits.length === 0 ? (
                <li className="px-4 py-3 text-sm text-muted">No apps match that.</li>
              ) : (
                hits.map((app) => (
                  <li key={app.id}>
                    <button
                      type="button"
                      onClick={() => go(app.slug)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2"
                    >
                      <img alt="" src={app.icon} className="h-8 w-8 rounded-lg object-cover" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">{app.name}</span>
                        <span className="block truncate text-xs text-muted">{app.tagline}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </form>
        </div>
      ) : null}
    </header>
  );
}

function SearchGlyph({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.34-4.34" />
    </svg>
  );
}

function MenuGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path d="M4 5h16M4 12h16M4 19h16" />
    </svg>
  );
}

export { AppleMark };
