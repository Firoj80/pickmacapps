import { useEffect, useState } from "react";
import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { publishedApps } from "@/lib/app-seed";
import { appIconUrl } from "@/lib/image-opt";
import type { AppItem } from "@/lib/catalog";

export function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const { directory } = useRouteContext({ from: "__root__" });
  const allApps = publishedApps(directory);
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose(); // toggle
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim()
    ? allApps.filter((app) => {
        const q = query.toLowerCase();
        return (
          app.name.toLowerCase().includes(q) ||
          app.tagline.toLowerCase().includes(q) ||
          (app.categoryName || "").toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : allApps.slice(0, 6);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl transition-all">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <svg
            className="h-5 w-5 text-muted shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            autoFocus
            type="text"
            placeholder="Search macOS apps by name, category or feature..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base text-ink placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted hover:text-ink"
          >
            ESC
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-line/40">
          <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {query.trim() ? "Search Results" : "Featured Apps"}
          </div>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted">
              No apps found matching "{query}"
            </div>
          ) : (
            filtered.map((app) => (
              <Link
                key={app.slug}
                to="/app/$slug"
                params={{ slug: app.slug }}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2 group"
              >
                <img
                  src={appIconUrl(app.icon)}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-line/50"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink group-hover:text-accent truncate">
                      {app.name}
                    </span>
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted capitalize">
                      {app.pricing}
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">
                    {app.tagline}
                  </p>
                </div>
                <svg
                  className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
