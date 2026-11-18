import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppCard } from "@/components/app-card";
import { ClaimSpotCard, type ClaimSpotOffer } from "@/components/claim-spot-card";
import { isEditorChoice, MAX_HOT_SLOTS, shelfApps, type AppItem } from "@/lib/catalog";
import { shelfCategories } from "@/lib/shelf-categories";

const PAGE = 60;
const MAX_HOME_TIER_SLOTS = 6; // All 6 slots are Gold (article) tier

export type HeroSort = "featured" | "hot" | "new" | "trending" | "free";

type GridItem =
  | { kind: "app"; app: AppItem; priority: boolean }
  | { kind: "claim"; tier: "article" };

export function AppGrid({
  apps,
  query,
  category = "all",
  sort = "featured",
  categories = [],
  onQuery,
  onCategory,
  onSort,
  arranged = false,
  filters = "all",
  offer,
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
  offer?: ClaimSpotOffer | null;
}) {
  const [order, setOrder] = useState<"oldest" | "newest" | "name" | "free">("oldest");
  const [page, setPage] = useState(0);

  // Standard filtered view (search, category, sort tabs)
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

  // Default home feed: root landing page with no search, all categories, and no explicit sort filter
  const isDefaultHomeFeed =
    category === "all" &&
    !query.trim() &&
    !sort;

  // Build the fluid priority-queue display list for the default home feed
  const displayItems = useMemo((): GridItem[] => {
    if (!isDefaultHomeFeed) return [];

    const byOldest = (a: AppItem, b: AppItem) => {
      const tA = new Date(a.createdAt).getTime() || 0;
      const tB = new Date(b.createdAt).getTime() || 0;
      return tA - tB || a.name.localeCompare(b.name);
    };

    // Priority 1: Gold badge apps (editorChoice + featuredTier="article"), oldest first, max 6
    const goldApps = apps
      .filter((a) => isEditorChoice(a) && a.featuredTier === "article")
      .sort(byOldest)
      .slice(0, MAX_HOME_TIER_SLOTS);

    // Priority 2 (legacy): Blue badge apps still displayed if in DB, but no new claim cards offered
    const blueApps = apps
      .filter((a) => isEditorChoice(a) && a.featuredTier !== "article")
      .sort(byOldest);

    // Priority 3: Hot apps (isHot, non-editor-choice), oldest first, capped at max 6
    const hotApps = apps
      .filter((a) => Boolean(a.isHot) && !isEditorChoice(a))
      .sort(byOldest)
      .slice(0, MAX_HOT_SLOTS);

    // Priority 4: All other apps (not editor choice, not hot), oldest first
    const otherApps = apps
      .filter((a) => !isEditorChoice(a) && !a.isHot)
      .sort(byOldest);

    const goldFull = goldApps.length >= MAX_HOME_TIER_SLOTS;

    return [
      // Gold badge apps first (up to 6)
      ...goldApps.map((app, i) => ({ kind: "app" as const, app, priority: i < 2 })),
      // Legacy Blue badge apps (existing DB records, no new slots offered)
      ...blueApps.map((app) => ({ kind: "app" as const, app, priority: false })),
      // Single Gold claim card when Gold slots < 6
      ...(!goldFull ? [{ kind: "claim" as const, tier: "article" as const }] : []),
      // Hot apps
      ...hotApps.map((app) => ({ kind: "app" as const, app, priority: false })),
      // All remaining apps, oldest first
      ...otherApps.map((app) => ({ kind: "app" as const, app, priority: false })),
    ];
  }, [apps, isDefaultHomeFeed]);

  const categoryList =
    categories.length > 0
      ? categories
      : [
          { id: "all", label: "All categories" },
          ...shelfCategories.map((c) => ({ id: c.slug, label: c.name })),
        ];

  // Pagination
  const totalItems = isDefaultHomeFeed ? displayItems.length : visible.length;
  const pages = Math.ceil(totalItems / PAGE);
  const start = page * PAGE;
  const end = Math.min(start + PAGE, totalItems);

  // Count actual app items (excluding claim cards) for display label
  const appCount = isDefaultHomeFeed
    ? displayItems.filter((item) => item.kind === "app").length
    : visible.length;

  let contentNodes: ReactNode = null;
  let countLabel = "";

  if (!isDefaultHomeFeed && visible.length === 0) {
    contentNodes = (
      <div className="mt-8 rounded-2xl border border-dashed border-line p-8 text-center">
        <p className="text-[15px] font-medium text-ink">No apps match that filter</p>
        <p className="mt-1 text-[13px] text-muted">Try choosing another category or clearing your search.</p>
      </div>
    );
    countLabel = "Showing 0 apps";
  } else if (isDefaultHomeFeed) {
    const pageItems = displayItems.slice(start, end);
    const pageAppCount = pageItems.filter((item) => item.kind === "app").length;
    // Count apps shown so far (not claim cards)
    const appsBeforePage = displayItems.slice(0, start).filter((i) => i.kind === "app").length;
    const appsEndPage = appsBeforePage + pageAppCount;
    countLabel =
      appCount === 0
        ? "Showing 0 apps"
        : `Showing ${appsBeforePage + 1}–${appsEndPage} of ${appCount} apps`;

    contentNodes = (
      <div className="grid grid-cols-1 gap-y-3 sm:gap-x-6 sm:gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
        {pageItems.map((item) => {
          if (item.kind === "claim") {
            return (
              <ClaimSpotCard
                key={`claim-${item.tier}`}
                tier={item.tier}
                offer={offer}
              />
            );
          }
          return (
            <AppCard
              key={item.app.id}
              app={item.app}
              priority={item.priority}
            />
          );
        })}
      </div>
    );
  } else {
    const slice = visible.slice(start, end);
    const last = Math.min(start + PAGE, visible.length);
    countLabel = `Showing ${start + 1}–${last} of ${visible.length} apps`;

    contentNodes = (
      <div className="grid grid-cols-1 gap-y-3 sm:gap-x-6 sm:gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
        {slice.map((app, index) => (
          <AppCard
            key={app.id}
            app={app}
            priority={page === 0 && index < 2}
          />
        ))}
        {sort === "featured" && visible.length < MAX_HOME_TIER_SLOTS && (
          <ClaimSpotCard tier="article" offer={offer} />
        )}
      </div>
    );
  }

  return (
    <section id="apps" className="scroll-mt-20">
      {contentNodes}

      {pages > 1 ? (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="App pages">
          <PageButton label="Previous page" disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
            <path d="M20 12H4M11 19l-7-7 7-7" />
          </PageButton>
          <PageButton label="Next page" disabled={page >= pages - 1} onClick={() => setPage((v) => v + 1)}>
            <path d="M4 12h16M13 5l7 7-7 7" />
          </PageButton>
        </nav>
      ) : null}
      <p className="mt-4 text-center text-[13px] text-muted">{countLabel}</p>
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
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}
