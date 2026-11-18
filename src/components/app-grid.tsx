import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppCard } from "@/components/app-card";
import { ClaimSpotCard } from "@/components/claim-spot-card";
import { isEditorChoice, shelfApps, type AppItem } from "@/lib/catalog";
import { shelfCategories } from "@/lib/shelf-categories";

const PAGE = 60;

export type HeroSort = "featured" | "hot" | "new" | "trending" | "free";

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

  const isDefaultHomeFeed =
    category === "all" &&
    !query.trim() &&
    (sort === "featured" || !sort);

  const { topRow1, topRow2, followingApps } = useMemo(() => {
    if (!isDefaultHomeFeed) {
      return { topRow1: [], topRow2: [], followingApps: [] };
    }

    const sortOldest = (a: AppItem, b: AppItem) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeA - timeB || a.name.localeCompare(b.name);
    };

    const goldApps = [...apps.filter((a) => isEditorChoice(a) && a.featuredTier === "article")].sort(sortOldest);
    const blueApps = [...apps.filter((a) => isEditorChoice(a) && a.featuredTier !== "article")].sort(sortOldest);

    const topGold = goldApps.slice(0, 3);
    const extraGold = goldApps.slice(3);

    const topBlue = blueApps.slice(0, 3);
    const extraBlue = blueApps.slice(3);

    const otherApps = apps.filter((a) => !isEditorChoice(a));

    return {
      topRow1: topGold,
      topRow2: topBlue,
      followingApps: [...extraGold, ...extraBlue, ...otherApps],
    };
  }, [apps, isDefaultHomeFeed]);

  const totalFeedItems = isDefaultHomeFeed ? 6 + followingApps.length : visible.length;
  const pages = Math.ceil(totalFeedItems / PAGE);

  const categoryList =
    categories.length > 0
      ? categories
      : [
          { id: "all", label: "All categories" },
          ...shelfCategories.map((c) => ({ id: c.slug, label: c.name })),
        ];

  let contentNodes: ReactNode = null;
  let countLabel = "";

  if (visible.length === 0) {
    contentNodes = (
      <div className="mt-8 rounded-2xl border border-dashed border-line p-8 text-center">
        <p className="text-[15px] font-medium text-ink">No apps match that filter</p>
        <p className="mt-1 text-[13px] text-muted">Try choosing another category or clearing your search.</p>
      </div>
    );
    countLabel = "Showing 0 apps";
  } else if (isDefaultHomeFeed) {
    if (page === 0) {
      const page0Followers = followingApps.slice(0, PAGE - 6);
      const appsOnPage = topRow1.length + topRow2.length + page0Followers.length;
      countLabel = `Showing 1–${Math.min(apps.length, appsOnPage)} of ${apps.length} apps`;

      contentNodes = (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {/* Row 1: Dedicated top 3 Golden Badge spots */}
          {[0, 1, 2].map((i) => {
            const goldApp = topRow1[i];
            return goldApp ? (
              <AppCard key={goldApp.id} app={goldApp} priority />
            ) : (
              <ClaimSpotCard key={`gold-spot-${i + 1}`} tier="article" spotIndex={i + 1} />
            );
          })}

          {/* Row 2: Dedicated top 3 Blue Badge spots */}
          {[0, 1, 2].map((i) => {
            const blueApp = topRow2[i];
            return blueApp ? (
              <AppCard key={blueApp.id} app={blueApp} priority={false} />
            ) : (
              <ClaimSpotCard key={`blue-spot-${i + 1}`} tier="featured" spotIndex={i + 1} />
            );
          })}

          {/* Following Rows: Remaining Gold/Blue apps, followed by Hot and standard catalog apps */}
          {page0Followers.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      );
    } else {
      const startIdx = (PAGE - 6) + (page - 1) * PAGE;
      const pageFollowers = followingApps.slice(startIdx, startIdx + PAGE);
      const startAppNum = topRow1.length + topRow2.length + (PAGE - 6) + (page - 1) * PAGE + 1;
      const endAppNum = Math.min(apps.length, startAppNum + pageFollowers.length - 1);
      countLabel = `Showing ${startAppNum}–${endAppNum} of ${apps.length} apps`;

      contentNodes = (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {pageFollowers.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      );
    }
  } else {
    const start = page * PAGE;
    const slice = visible.slice(start, start + PAGE);
    const last = Math.min(start + PAGE, visible.length);
    countLabel = `Showing ${start + 1}–${last} of ${visible.length} apps`;

    contentNodes = (
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
        {slice.map((app, index) => (
          <AppCard key={app.id} app={app} priority={page === 0 && index < 2} />
        ))}
      </div>
    );
  }

  return (
    <section id="apps" className="scroll-mt-20">
      {contentNodes}

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
        {countLabel}
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
