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
  const [order, setOrder] = useState<"oldest" | "newest" | "name" | "free">("oldest");
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
      {visible.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="text-[15px] font-medium text-ink">No apps match that filter</p>
          <p className="mt-1 text-[13px] text-muted">Try choosing another category or clearing your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {slice.map((app, index) => (
            <AppCard key={app.id} app={app} priority={page === 0 && index < 2} />
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
