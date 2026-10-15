import { useMemo, useState } from "react";
import { AppCard } from "@/components/app-card";
import { ChevronIcon, SearchIcon } from "@/components/icons";
import { categories, editors, sortApps, type AppItem } from "@/lib/catalog";

export function AppGrid({ apps }: { apps: AppItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [order, setOrder] = useState<"newest" | "name" | "free">("newest");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = apps.filter((app) => {
      const inCategory = category === "all" || app.category === category;
      const matches =
        !needle ||
        app.name.toLowerCase().includes(needle) ||
        app.tagline.toLowerCase().includes(needle);
      return inCategory && matches;
    });
    return sortApps(filtered, order);
  }, [apps, query, category, order]);

  return (
    <section id="apps" className="scroll-mt-20">
      <div className="mb-6 flex items-center gap-5">
        <h2 className="shrink-0 text-[19px] font-[550] tracking-[-0.025em] text-ink">
          Browse every Mac app
        </h2>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search apps..."
            aria-label="Search apps"
            className="h-11 w-full rounded-lg border border-line bg-surface pr-3.5 pl-10 text-[13.5px] text-ink transition-colors placeholder:text-muted hover:border-line-2 focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none"
          />
        </div>
        <label className="relative">
          <span className="sr-only">Filter by category</span>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface pr-9 pl-3.5 text-[13.5px] font-medium text-ink transition-colors hover:border-line-2 focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none sm:w-auto"
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <ChevronIcon className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        </label>
        <label className="relative">
          <span className="sr-only">Order by</span>
          <select
            aria-label="Order by"
            value={order}
            onChange={(event) => setOrder(event.target.value as "newest" | "name" | "free")}
            className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface pr-9 pl-3.5 text-[13.5px] font-medium text-ink transition-colors hover:border-line-2 focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none sm:w-auto"
          >
            <option value="newest">Newest</option>
            <option value="name">Name A–Z</option>
            <option value="free">Free first</option>
          </select>
          <ChevronIcon className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        </label>
      </div>
      {visible.length === 0 ? (
        <div className="mt-6 rounded-xl border border-line bg-surface px-6 py-20 text-center">
          <p className="text-[15px] font-medium text-ink">No apps found</p>
          <p className="mt-1 text-[13.5px] text-muted">Try a different search or category.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((app) => (
            <AppCard key={app.id} app={app} silver={editors.has(app.slug)} />
          ))}
        </div>
      )}
      <p className="mt-8 text-center text-[13px] text-muted">
        Showing {visible.length} of {apps.length} apps
      </p>
    </section>
  );
}
