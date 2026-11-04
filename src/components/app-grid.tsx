import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppCard } from "@/components/app-card";
import { categories, shelfApps, type AppItem } from "@/lib/catalog";

const PAGE = 60;

export function AppGrid({
  apps,
  query,
  category,
  onQuery,
  onCategory,
  arranged = false,
  filters = "all",
}: {
  apps: AppItem[];
  query: string;
  category: string;
  onQuery: (value: string) => void;
  onCategory: (value: string) => void;
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
  }, [query, category, order]);

  const start = page * PAGE;
  const slice = visible.slice(start, start + PAGE);
  const last = Math.min(start + PAGE, visible.length);
  const pages = Math.ceil(visible.length / PAGE);

  return (
    <section id="apps" className="scroll-mt-20">
      <div className="mb-6 flex items-center gap-5">
        <h2 className="shrink-0 text-[19px] font-[550] tracking-[-0.025em] text-ink">Browse every Mac app</h2>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search apps..."
            aria-label="Search apps"
            className="h-11 w-full rounded-lg border border-line bg-surface pr-3.5 pl-10 text-[13.5px] text-ink transition-colors placeholder:text-muted hover:border-line-2 focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none"
          />
        </div>
        {filters === "all" ? (
          <>
            <Select label="Filter by category" value={category} onChange={onCategory}>
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select label="Order by" value={order} onChange={(value) => setOrder(value as "newest" | "name" | "free")}>
              <option value="newest">Newest</option>
              <option value="name">Name A–Z</option>
              <option value="free">Free first</option>
            </Select>
          </>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-[15px] text-body">No apps match that.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}

      {pages > 1 ? (
        <nav className="mt-6 flex items-center justify-center gap-2" aria-label="App pages">
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

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface pr-9 pl-3.5 text-[13.5px] font-medium text-ink transition-colors hover:border-line-2 focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none sm:w-auto"
      >
        {children}
      </select>
      <svg className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
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

function SearchIcon() {
  return (
    <svg className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
