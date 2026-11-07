import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppCard } from "@/components/app-card";
import { shelfApps, type AppItem } from "@/lib/catalog";
import { shelfCategories } from "@/lib/shelf-categories";

const PAGE = 60;

export type HeroSort = "hot" | "new" | "trending" | "free";

export function AppGrid({
  apps,
  query,
  category = "all",
  sort = "hot",
  categories = [],
  onQuery,
  onCategory,
  onSort,
  arranged = false,
  filters = "all",
}: {
  apps: AppItem[];
  query: string;
  category?: string;
  sort?: HeroSort;
  categories?: { id: string; label: string; emoji?: string }[];
  onQuery: (value: string) => void;
  onCategory?: (value: string) => void;
  onSort?: (value: HeroSort) => void;
  arranged?: boolean;
  filters?: "all" | "search";
}) {
  const [order, setOrder] = useState<"newest" | "name" | "free">("newest");
  const [page, setPage] = useState(0);

  const visible = useMemo(() => {
    if (!arranged) return shelfApps(apps, query, category, order);
    const needle = query.trim().toLowerCase();
    return apps.filter(
      (app) => !needle || app.name.toLowerCase().includes(needle) || app.tagline.toLowerCase().includes(needle),
    );
  }, [apps, query, category, order, arranged]);

  useEffect(() => {
    setPage(0);
  }, [query, category, order, sort]);

  const start = page * PAGE;
  const slice = visible.slice(start, start + PAGE);
  const last = Math.min(start + PAGE, visible.length);
  const pages = Math.ceil(visible.length / PAGE);

  const categoryList =
    categories.length > 0
      ? categories
      : [
          { id: "all", label: "All categories" },
          ...shelfCategories.map((c) => ({ id: c.slug, label: c.name })),
        ];

  return (
    <section id="apps" className="scroll-mt-20">
      {/* Section Header */}
      <div className="mb-4 flex items-center gap-4">
        <h2 className="shrink-0 text-[18px] font-bold tracking-[-0.025em] text-ink sm:text-[20px]">
          Browse every Mac app
        </h2>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>

      {/* MOBILE CONTROLS (matches user reference image: 3 stacked full-width rounded controls) */}
      <div className="flex flex-col gap-2.5 sm:hidden">
        {/* 1. Full-width Search Input */}
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search apps..."
            aria-label="Search apps"
            className="h-12 w-full rounded-xl border border-line bg-surface pr-4 pl-11 text-[14.5px] text-ink placeholder:text-muted/70 shadow-xs transition-colors focus-visible:border-accent focus-visible:outline-none"
          />
        </div>

        {/* 2. Full-width Category Dropdown */}
        {onCategory ? (
          <div className="relative">
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(event) => onCategory(event.target.value)}
              className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-line bg-surface pr-10 pl-4 text-[14.5px] font-medium text-ink shadow-xs transition-colors focus-visible:border-accent focus-visible:outline-none"
            >
              {categoryList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-muted" />
          </div>
        ) : null}

        {/* 3. Full-width Sort / Free Dropdown */}
        {onSort ? (
          <div className="relative">
            <select
              aria-label="Order by"
              value={sort}
              onChange={(event) => onSort(event.target.value as HeroSort)}
              className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-line bg-surface pr-10 pl-4 text-[14.5px] font-medium text-ink shadow-xs transition-colors focus-visible:border-accent focus-visible:outline-none"
            >
              <option value="new">Newest</option>
              <option value="hot">Hot</option>
              <option value="trending">Trending</option>
              <option value="free">Free</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-muted" />
          </div>
        ) : null}
      </div>

      {/* DESKTOP CONTROLS (Toolbar: Search on left + Category & Sort on right) */}
      <div className="hidden sm:flex sm:items-center sm:gap-3">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search apps..."
            aria-label="Search apps"
            className="h-10 w-full rounded-xl border border-line bg-surface pr-4 pl-10 text-[13.5px] text-ink transition-colors placeholder:text-muted hover:border-line-2 focus-visible:border-accent focus-visible:outline-none"
          />
        </div>

        {onCategory ? (
          <div className="relative shrink-0">
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(event) => onCategory(event.target.value)}
              className="h-10 cursor-pointer appearance-none rounded-xl border border-line bg-surface pr-8 pl-3.5 text-[13.5px] font-medium text-ink shadow-xs transition-colors hover:border-line-2 focus-visible:border-accent focus-visible:outline-none"
            >
              {categoryList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.emoji ? `${item.emoji} ` : ""}{item.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          </div>
        ) : null}

        {onSort ? (
          <div className="inline-flex h-10 shrink-0 items-center rounded-xl bg-[#e8e8ed] p-1 dark:bg-white/10">
            {(
              [
                ["hot", "🔥 Hot"],
                ["new", "✨ Latest"],
                ["trending", "📈 Trending"],
                ["free", "🎁 Free"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => onSort(id)}
                className={`h-8 rounded-lg px-3 text-[12.5px] font-medium tracking-[-0.01em] transition-all ${
                  sort === id
                    ? "bg-white text-[#1d1d1f] shadow-xs dark:bg-[#1d1d1f] dark:text-white"
                    : "text-[#6e6e73] hover:text-[#1d1d1f] dark:text-[#a1a1a6] dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="text-[15px] font-medium text-ink">No apps match that filter</p>
          <p className="mt-1 text-[13px] text-muted">Try choosing another category or clearing your search.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}

      {pages > 1 ? (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="App pages">
          <PageButton label="Previous page" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
            <path d="M20 12H4M11 19l-7-7 7-7" />
          </PageButton>
          <PageButton label="Next page" disabled={page >= pages - 1} onClick={() => setPage((value) => value + 1)}>
            <path d="M4 12h16M13 5l7 7-7 7" />
          </PageButton>
        </nav>
      ) : null}
      <p className="mt-4 text-center text-[13px] text-muted">
        {visible.length === 0 ? "Showing 0 apps" : `Showing ${start + 1}–${last} of ${visible.length} apps`}
      </p>
    </section>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink transition-colors hover:border-line-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

function SearchIcon({ className = "pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ChevronDownIcon({ className = "pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
