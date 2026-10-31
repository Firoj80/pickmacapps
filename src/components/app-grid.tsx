import { useMemo, useState } from "react";
import { AppCard } from "@/components/app-card";
import { categories, homeGroups, shelfApps, type AppItem } from "@/lib/catalog";

export function AppGrid({
  apps,
  query,
  category,
  onQuery,
  onCategory,
}: {
  apps: AppItem[];
  query: string;
  category: string;
  onQuery: (value: string) => void;
  onCategory: (value: string) => void;
}) {
  const [order, setOrder] = useState<"newest" | "name" | "free">("newest");

  const visible = useMemo(
    () => shelfApps(apps, query, category, order),
    [apps, query, category, order],
  );

  return (
    <section id="apps" className="scroll-mt-24">
      <div id="categories" className="flex scroll-mt-8 flex-wrap items-center gap-1 text-sm">
        <FilterTab active={category === "all"} onClick={() => onCategory("all")}>
          All
        </FilterTab>
        {categories.map((item) => (
          <FilterTab key={item.slug} active={category === item.slug} onClick={() => onCategory(item.slug)}>
            {item.name}
          </FilterTab>
        ))}
        <span aria-hidden="true" className="mx-2 hidden h-4 w-px bg-line sm:inline-block" />
        <FilterTab active={order === "newest"} onClick={() => setOrder("newest")}>
          Latest
        </FilterTab>
        <FilterTab active={order === "name"} onClick={() => setOrder("name")}>
          A–Z
        </FilterTab>
        <FilterTab active={order === "free"} onClick={() => setOrder("free")}>
          Free
        </FilterTab>
        <span className="ml-auto text-[13px] text-muted">
          {visible.length} apps
        </span>
      </div>

      {query ? (
        <button type="button" onClick={() => onQuery("")} className="mt-3 text-[13px] text-accent hover:underline">
          Clear “{query}”
        </button>
      ) : null}

      {visible.length === 0 ? (
        <p className="mt-10 text-[15px] text-body">Nothing on the shelf matches that.</p>
      ) : category === "all" && !query ? (
        <GroupedShelf apps={visible} order={order} />
      ) : (
        <div className="shelf mt-8 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((app) => (
            <AppCard key={app.id} app={app} size="md" />
          ))}
        </div>
      )}
    </section>
  );
}

function GroupedShelf({ apps, order }: { apps: AppItem[]; order: "newest" | "name" | "free" }) {
  const { choice, groups } = homeGroups(apps, order);
  return (
    <div className="mt-8 space-y-16 pb-8">
      {choice.length ? (
        <section className="shelf grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2">
          {choice.map((app) => (
            <AppCard key={app.id} app={app} size="lg" />
          ))}
        </section>
      ) : null}
      {groups.map((group) => (
        <section key={group.id}>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">{group.title}</h2>
          <p className="mt-1 text-sm text-muted">{group.line}</p>
          <div className="shelf mt-6 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {group.apps.map((app) => (
              <AppCard key={app.id} app={app} size="md" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 transition-colors duration-200 ${active ? "bg-surface-2 font-medium text-ink" : "text-muted hover:bg-surface-2/70 hover:text-ink"}`}
    >
      {children}
    </button>
  );
}
