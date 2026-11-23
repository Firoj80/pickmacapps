import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppGrid } from "@/components/app-grid";
import { GuideStrip } from "@/components/guide-strip";
import { FreshDropsBanner } from "@/components/fresh-drops-banner";
import { DesktopCategoriesBar } from "@/components/desktop-categories-bar";
import { BlackFridayCountdown } from "@/components/black-friday-countdown";
import { BadgeCheckIcon } from "@/components/icons";
import { appPriorityWeight, featuredTierWeight, getHeroAppIcons, isEditorChoice, isSeedApp, posts, shelfApps, type AppItem } from "@/lib/catalog";
import { publishedApps } from "@/lib/app-seed";
import { appCoverUrl, appIconUrl } from "@/lib/image-opt";
import { normalizeCategorySlug, shelfCategories } from "@/lib/shelf-categories";
import { homeGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { fetchOffer } from "@/lib/directory.fn";

const homeTitle = "PickMacApps - Discover the best hand-picked mac apps";
const homeDescription =
  "Explore a hand-picked collection of beautiful, useful, and powerful Mac apps";
const homeImageAlt = "Try hand-picked mac apps on the internet — PickMacApps";
const homeH1 = "Try hand-picked mac apps on the internet";

const homeFaqs = [
  {
    q: "What is PickMacApps?",
    a: "PickMacApps is a directory of Mac apps kept by Firoj Alam. A listing is a name, a short description, a pricing label, and a link to the developer.",
  },
  {
    q: "How are apps chosen?",
    a: "Apps are added by hand. Editor’s Choice is a paid placement, capped at 3 published apps. It is not a test score. The price is the one on the submit page.",
  },
  {
    q: "Are the apps free?",
    a: "The directory includes free, freemium, and paid apps. The label on each card is the pricing model. A dollar price is shown only when that listing records one.",
  },
  {
    q: "How do I submit an app?",
    a: "Use the submit page. A free listing needs the PickMacApps badge on the app’s site before it is reviewed. Editor’s Choice does not need the badge. A listing is published only after it is reviewed.",
  },
];

type HeroSort = "featured" | "hot" | "new" | "trending" | "free";

function inHeroCategory(app: AppItem, category: string) {
  if (category === "all") return true;
  if (category === "pick") return isEditorChoice(app);
  return normalizeCategorySlug(app.category) === category;
}

function arrangeHero(list: readonly AppItem[], sort?: HeroSort) {
  const next = [...list];
  if (sort === "new") {
    // Latest/Newest: Featured apps on top, then Hot apps, then all active latest added apps by createdAt desc, then seed apps
    next.sort((a, b) => {
      const pDiff = appPriorityWeight(b) - appPriorityWeight(a);
      if (pDiff !== 0) return pDiff;
      const aSeed = isSeedApp(a);
      const bSeed = isSeedApp(b);
      if (aSeed !== bSeed) return aSeed ? 1 : -1;
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA || a.name.localeCompare(b.name);
    });
    return next;
  }
  if (sort === "trending") {
    // Trending: Featured apps on top, then Hot apps, then all active most viewed apps, then seed apps
    next.sort((a, b) => {
      const pDiff = appPriorityWeight(b) - appPriorityWeight(a);
      if (pDiff !== 0) return pDiff;
      const aSeed = isSeedApp(a);
      const bSeed = isSeedApp(b);
      if (aSeed !== bSeed) return aSeed ? 1 : -1;
      const vA = a.views7d ?? 0;
      const vB = b.views7d ?? 0;
      if (vB !== vA) return vB - vA;
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeA - timeB || a.name.localeCompare(b.name);
    });
    return next;
  }
  if (sort === "free") {
    // Free: Featured apps (if free) on top, then Hot apps, then active free apps, then seed free apps
    next.sort((a, b) => {
      const pDiff = appPriorityWeight(b) - appPriorityWeight(a);
      if (pDiff !== 0) return pDiff;
      const aSeed = isSeedApp(a);
      const bSeed = isSeedApp(b);
      if (aSeed !== bSeed) return aSeed ? 1 : -1;
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeA - timeB || a.name.localeCompare(b.name);
    });
    return next;
  }
  if (sort === "hot") {
    // When user explicitly views Hot apps: strictly show Hot apps capped at MAX_HOT_SLOTS (6), oldest first
    return next
      .filter((a) => Boolean(a.isHot))
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeA - timeB || a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }
  if (sort === "featured") {
    // When user explicitly views Featured apps: strictly show Golden Badge apps, capped at MAX_TIER_SLOTS (6), oldest first
    return next
      .filter((a) => isEditorChoice(a) && a.featuredTier === "article")
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeA - timeB || a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }
  // Default home feed (sort is undefined): Gold apps (1st, oldest first), Blue apps (2nd, oldest first), Hot 🔥 apps (3rd, oldest first), then standard apps (oldest first)
  return shelfApps(next);
}

function MacLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.05 12.536c-.03-3.02 2.463-4.47 2.575-4.54-1.404-2.052-3.59-2.333-4.365-2.365-1.858-.188-3.626 1.093-4.57 1.093-.944 0-2.4-1.067-3.945-1.037-2.03.03-3.9 1.18-4.945 3-2.108 3.653-.54 9.058 1.51 12.02 1.005 1.45 2.203 3.08 3.773 3.02 1.515-.06 2.09-.98 3.923-.98 1.83 0 2.352.98 3.955.95 1.635-.03 2.67-1.475 3.67-2.93 1.155-1.68 1.632-3.31 1.66-3.395-.036-.014-3.185-1.223-3.216-4.836zM14.02 3.61c.834-1.012 1.397-2.415 1.243-3.813-1.203.05-2.66.8-3.522 1.808-.775.895-1.454 2.325-1.27 3.696 1.34.104 2.71-.68 3.55-1.692z" />
    </svg>
  );
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { q?: string; cat?: string; sort?: HeroSort } => {
    const next: { q?: string; cat?: string; sort?: HeroSort } = {};
    if (typeof search.q === "string" && search.q) next.q = search.q;
    if (typeof search.cat === "string" && search.cat && search.cat !== "all") next.cat = search.cat;
    if (search.sort === "featured" || search.sort === "new" || search.sort === "trending" || search.sort === "hot" || search.sort === "free") {
      next.sort = search.sort;
    }
    return next;
  },
  loader: () => fetchOffer(),
  component: Home,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const search = matches.at(-1)?.search as { q?: string; cat?: string; sort?: HeroSort } | undefined;
    const filtered = Boolean(search?.q || (search?.cat && search.cat !== "all") || Boolean(search?.sort));
    const seo = buildMetadata({
      title: homeTitle,
      description: homeDescription,
      ogTitle: "Try hand-picked mac apps on the internet",
      twitterTitle: "Try hand-picked mac apps on the internet",
      ogDescription: "Explore a hand-picked collection of beautiful, useful, and powerful Mac apps",
      twitterDescription: "Explore a hand-picked collection of beautiful, useful, and powerful Mac apps",
      path: "/",
      origin,
      imageAlt: homeImageAlt,
    });
    const directory = matches[0]?.context.directory;
    const list = publishedApps(directory);
    const topApps = arrangeHero(list, "featured");
    const lcpCover = topApps[0]?.demo ? appCoverUrl(topApps[0].demo) : "";
    const lcpPreload: Array<{ rel: "preload"; as: "image"; href: string; fetchPriority: "high" | "low" | "auto" }> = lcpCover
      ? [{ rel: "preload", as: "image", href: lcpCover, fetchPriority: "high" }]
      : [];

    const script = jsonLdScript(
      homeGraph(origin, filtered ? null : shelfApps(list), homeFaqs, { name: homeH1, description: homeDescription }),
    );
    return {
      meta: seo.meta,
      links: [...seo.links, ...lcpPreload, markdownAlternate(origin, "/")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function ChoiceIcons({ apps }: { apps: AppItem[] }) {
  if (apps.length === 0) return null;
  // Dynamic curved arc fan-out: middle icons lifted higher, outward icons rotated and spread (auto-arranged up to 12 apps)
  const shown = apps.slice(0, 12);
  const count = shown.length;
  const mid = (count - 1) / 2;

  // Dynamic overlap: as icon count increases from 6 up to 12, smoothly adjust overlap so they always fit comfortably
  // At 6 icons: -14px overlap. At 12 icons: -24px overlap.
  const overlap = count <= 6 ? -14 : Math.round(-14 - ((count - 6) / 6) * 10);

  return (
    <div className="relative flex items-center justify-center pt-2 pb-2 max-w-full overflow-hidden px-1">
      <div className="flex items-center justify-center">
        {shown.map((app, index) => {
          const offset = index - mid;
          const normalized = mid > 0 ? offset / mid : 0;
          // Smooth parabolic arc curve: center icons lifted higher, outward icons lower
          const translateY = Math.pow(Math.abs(normalized), 1.35) * (count > 6 ? 11 : 9);
          const rotate = normalized * (count > 6 ? 14 : 11);
          const zIndex = Math.round(50 - Math.abs(offset) * 2);

          const choice = isEditorChoice(app);
          const isGold = (choice && app.featuredTier === "article") || app.featuredTier === "article";
          const isBlue = (choice && app.featuredTier !== "article") || (app.featuredTier === "featured");
          const isHot = Boolean(app.isHot && !isGold && !isBlue);

          const appTitle = isGold
            ? `${app.name} 🌟 Gold Spotlight`
            : isBlue
            ? `${app.name} ✦ Featured`
            : isHot
            ? `${app.name} 🔥 Hot`
            : app.name;

          const ringClass = isGold
            ? "ring-2 ring-amber-400/90 shadow-[0_8px_22px_rgba(245,158,11,0.28)]"
            : isBlue
            ? "ring-2 ring-sky-400/90 shadow-[0_8px_22px_rgba(14,165,233,0.28)]"
            : "ring-2 ring-line shadow-[0_8px_20px_rgba(0,0,0,0.14)]";

          return (
            <Link
              key={app.slug}
              to="/app/$slug"
              params={{ slug: app.slug }}
              title={appTitle}
              style={{
                zIndex,
                marginLeft: index === 0 ? 0 : overlap,
                transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
              }}
              className={`group relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-[15px] sm:rounded-[17px] bg-surface ${ringClass} transition-all duration-200 hover:!z-[99] hover:!-translate-y-2.5 hover:!rotate-0 hover:scale-115 hover:shadow-[0_16px_32px_rgba(0,0,0,0.25)]`}
            >
              <div className="h-full w-full overflow-hidden rounded-[15px] sm:rounded-[17px]">
                <img
                  alt={app.name}
                  src={appIconUrl(app.icon)}
                  loading="eager"
                  decoding="async"
                  width={60}
                  height={60}
                  onError={(event) => {
                    if (event.currentTarget.src !== app.icon) {
                      event.currentTarget.src = app.icon;
                    } else {
                      event.currentTarget.src = "/site-favicon.svg";
                    }
                  }}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>

              {/* Badges: Gold Spotlight, Blue Featured, or Hot */}
              {isGold ? (
                <span
                  title="Gold Spotlight App"
                  aria-label="Gold Spotlight App"
                  className="absolute -top-1 -right-1 z-10 flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center"
                >
                  <BadgeCheckIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 fill-amber-500 text-stone-950 drop-shadow-sm" />
                </span>
              ) : isBlue ? (
                <span
                  title="Featured App"
                  aria-label="Featured App"
                  className="absolute -top-1 -right-1 z-10 flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-md ring-1.5 ring-surface"
                >
                  <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </span>
              ) : isHot ? (
                <span
                  title="Hot App"
                  aria-label="Hot App"
                  className="absolute -top-1 -right-1 z-10 flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-rose-600 text-[9px] sm:text-[10px] shadow-md ring-1.5 ring-surface"
                >
                  🔥
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Home() {
  const offer = Route.useLoaderData();
  const rawSearch = Route.useSearch();
  const { q = "", cat = "all" } = rawSearch;
  const sort = rawSearch.sort;
  const effectiveSort = sort ?? (cat === "pick" ? "featured" : undefined);
  const navigate = useNavigate();
  const { directory } = Route.useRouteContext();
  const list = publishedApps(directory);
  const chipCategories = directory?.categories?.length ? directory.categories : shelfCategories;
  const heroCategories = [
    { id: "all", label: "All categories" },
    ...chipCategories.map((item) => ({ id: item.slug, label: item.name })),
  ];
  const category = heroCategories.some((item) => item.id === cat) ? cat : "all";
  const desktopCategories = useMemo(() => {
    const counts: Record<string, number> = { all: list.length };
    for (const app of list) {
      const slug = normalizeCategorySlug(app.category);
      counts[slug] = (counts[slug] || 0) + 1;
    }

    const sortedCategories = chipCategories
      .map((c) => ({
        id: c.slug,
        name: c.name,
        emoji: c.emoji,
        count: counts[c.slug] || 0,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

    return [
      { id: "all", name: "All Apps", emoji: "✨", count: list.length },
      ...sortedCategories,
    ];
  }, [chipCategories, list]);

  const shown = arrangeHero(
    list.filter((app) => {
      if (!inHeroCategory(app, category)) return false;
      if (effectiveSort === "free" && app.pricing !== "free") return false;
      return true;
    }),
    effectiveSort,
  );

  const isFiltered = Boolean(
    rawSearch.sort ||
    (rawSearch.cat && rawSearch.cat !== "all") ||
    rawSearch.q
  );

  function updateSearch(next: { q?: string; cat?: string; sort?: HeroSort }) {
    const nextCat =
      next.cat !== undefined
        ? next.cat === "all"
          ? undefined
          : next.cat
        : cat === "all"
        ? undefined
        : cat;
    navigate({
      to: "/",
      search: {
        q: next.q !== undefined ? next.q || undefined : q || undefined,
        cat: nextCat,
        sort: next.sort !== undefined ? next.sort : sort,
      },
    });
  }

  return (
    <main className="flex-1">
      {isFiltered ? (
        /* Direct Section Header when Discover or Category filter is clicked */
        <section className="px-5 md:px-8 xl:px-10 pt-8 pb-3">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <h1 className="font-display text-[26px] sm:text-[32px] md:text-[36px] font-bold tracking-tight text-ink flex items-center gap-2.5">
              {cat === "pick" || sort === "featured" ? (
                <>
                  <span>Featured Mac apps</span>
                  <BadgeCheckIcon className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 fill-amber-500 text-stone-950 drop-shadow-xs" />
                </>
              ) : sort === "new" ? (
                <span>Latest Mac apps</span>
              ) : sort === "trending" ? (
                <span>Trending Mac apps</span>
              ) : sort === "hot" ? (
                <span>🔥 Hot Mac apps</span>
              ) : cat !== "all" ? (
                <span>
                  {chipCategories.find((c) => c.slug === cat)?.name || cat} Mac apps
                </span>
              ) : (
                <span>Mac apps</span>
              )}
            </h1>
            <span className="text-xs font-medium text-muted">
              {shown.length} {shown.length === 1 ? "app" : "apps"}
            </span>
          </div>
        </section>
      ) : (
        /* Hero Section matching macapp.supply (only shown on root homepage) */
        <section className="px-5 md:px-8 xl:px-10 pt-8 sm:pt-10 md:pt-14 pb-2.5 sm:pb-6 md:pb-10">
          <div className="max-w-5xl xl:max-w-6xl">
            <h1 className="font-display text-[34px] font-bold leading-[1.06] tracking-[-0.035em] text-ink sm:text-[46px] md:text-[54px] xl:text-[60px]">
              Try hand-picked{" "}
              <span className="text-muted">Mac apps</span>{" "}
              <span className="inline-flex items-center align-middle">
                <MacLogo className="mx-1 inline h-[0.78em] w-[0.78em] -translate-y-[0.06em] text-ink" />
              </span>
              on the internet.
            </h1>
            <p className="mt-3 text-[14px] sm:text-[16px] text-muted max-w-2xl leading-relaxed">
              Explore a hand-picked collection of beautiful, useful, and powerful Mac apps.
            </p>

            {/* Mobile: Black Friday Sale Countdown (below the site title, hot app icons hidden for now) */}
            <div className="block sm:hidden mt-3.5">
              <BlackFridayCountdown isMobile />
            </div>

            {/* Desktop: App Icons Arc strictly side-by-side with Black Friday Countdown */}
            <div className="hidden sm:flex items-center gap-4 lg:gap-6 mt-4">
              <div className="shrink-0">
                <ChoiceIcons apps={getHeroAppIcons(list, 12)} />
              </div>
              <div className="shrink-0">
                <BlackFridayCountdown />
              </div>
            </div>

            {directory ? null : (
              <p className="mt-2 text-sm text-muted">The app list could not be loaded. Try again in a moment.</p>
            )}
          </div>

          {/* Running Banner: Fresh Drops (configurable from admin) */}
          {(offer?.sidebarSettings?.enabled ?? true) && (
            <div className="w-full mt-4 sm:mt-6 md:mt-8">
              <FreshDropsBanner
                apps={list}
                settings={offer?.sidebarSettings ?? { enabled: true, duration: "24h" }}
              />
            </div>
          )}
        </section>
      )}

      {/* Direct Apps Grid */}
      <div className="w-full px-5 md:px-8 xl:px-10 pt-1 sm:pt-3 md:pt-6 pb-6">
        <h2 className="sr-only">
          {sort === "hot"
            ? "Hot Mac apps"
            : sort === "new"
            ? "Latest Mac apps"
            : sort === "trending"
            ? "Trending Mac apps"
            : "Featured Mac apps"}
        </h2>

        {/* Desktop Only: Categories Filter Strip (in the gap between Fresh Drops banner and Apps Grid) */}
        <DesktopCategoriesBar
          categories={desktopCategories}
          activeCategory={category}
          onSelect={(selectedSlug) => {
            updateSearch({ cat: selectedSlug === "all" ? "all" : selectedSlug });
          }}
        />

        {/* Discover Filter Tabs (Featured, Hot, Latest, Trending) - Mobile only (desktop uses left sidebar) */}
        <div className="mb-4 sm:mb-6 flex lg:hidden flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-line/60 pb-3 sm:pb-4">
          <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-2xs">
            {/* Featured */}
            <Link
              to="/"
              search={{ sort: "featured", cat: "all" }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                sort === "featured" || cat === "pick"
                  ? "bg-ink text-canvas shadow-xs"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <BadgeCheckIcon className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-stone-950" />
              <span>Featured</span>
            </Link>

            {/* Hot */}
            <Link
              to="/"
              search={{ sort: "hot", cat: "all" }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                sort === "hot" && cat !== "pick"
                  ? "bg-ink text-canvas shadow-xs"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <span>🔥</span>
              <span>Hot</span>
            </Link>

            {/* Latest */}
            <Link
              to="/"
              search={{ sort: "new", cat: "all" }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                sort === "new"
                  ? "bg-ink text-canvas shadow-xs"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <span>✨</span>
              <span>Latest</span>
            </Link>

            {/* Trending */}
            <Link
              to="/"
              search={{ sort: "trending", cat: "all" }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                sort === "trending"
                  ? "bg-ink text-canvas shadow-xs"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <span>📈</span>
              <span>Trending</span>
            </Link>
          </div>

          <span className="text-xs font-medium text-muted">
            {shown.length} {shown.length === 1 ? "app" : "apps"}
          </span>
        </div>

        <AppGrid
          apps={shown}
          query={q}
          category={category}
          sort={rawSearch.sort}
          categories={heroCategories}
          arranged
          offer={offer}
          onQuery={(value) => updateSearch({ q: value })}
          onCategory={(value) => updateSearch({ cat: value })}
          onSort={(value) => updateSearch({ sort: value })}
        />

        {!isFiltered && (
          <>
            <GuideStrip posts={directory?.posts ?? posts} />

            <section className="mt-20">
              <div className="flex items-center gap-5">
                <h2 className="shrink-0 text-[19px] font-[550] tracking-[-0.025em] text-ink">Questions</h2>
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
                <Link to="/how-we-pick" className="text-[13px] font-medium text-body hover:text-ink">
                  How we pick
                </Link>
              </div>
              <div className="mt-6 space-y-3">
                {homeFaqs.map((faq) => (
                  <details key={faq.q} className="rounded-xl border border-line bg-surface px-5 py-4">
                    <summary className="cursor-pointer text-[15px] font-medium text-ink">{faq.q}</summary>
                    <p className="mt-3 text-sm leading-relaxed text-body">{faq.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}