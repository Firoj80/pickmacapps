import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppGrid } from "@/components/app-grid";
import { GuideStrip } from "@/components/guide-strip";
import { FreshDropsBanner } from "@/components/fresh-drops-banner";
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

const ICON_FAN_PRESETS = [
  { rotate: -3.5, translateY: 0 },
  { rotate: -2, translateY: 2 },
  { rotate: 3, translateY: -2 },
  { rotate: 1.5, translateY: 0 },
  { rotate: -3, translateY: 3 },
  { rotate: -0.5, translateY: -1 },
  { rotate: 3, translateY: 1 },
  { rotate: -2, translateY: 0 },
];

function ChoiceIcons({ apps }: { apps: AppItem[] }) {
  if (apps.length === 0) return null;
  const shown = apps.slice(0, 8);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (slug: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setHoveredSlug(slug);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredSlug(null);
    }, 140);
  };

  return (
    <div className="relative flex items-center py-1 overflow-visible">
      <div className="flex items-center overflow-visible">
        {shown.map((app, index) => {
          const choice = isEditorChoice(app);
          const isGold = (choice && app.featuredTier === "article") || app.featuredTier === "article";
          const isBlue = (choice && app.featuredTier !== "article") || (app.featuredTier === "featured");
          const isHot = Boolean(app.isHot && !isGold && !isBlue);

          const isHovered = hoveredSlug === app.slug;
          // Left-to-right stacking: later icons overlap on top of previous icons
          const zIndex = isHovered ? 60 : index + 1;
          const preset = ICON_FAN_PRESETS[index % ICON_FAN_PRESETS.length];

          const cover = app.demo?.trim();
          const optimizedCover = cover ? appCoverUrl(cover) : "";

          return (
            <div
              key={app.slug}
              className="relative group/icon shrink-0"
              style={{
                zIndex,
                marginLeft: index === 0 ? 0 : -16,
              }}
              onMouseEnter={() => handleMouseEnter(app.slug)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Squircle App Icon: Strictly 100% IDENTICAL SIZE for all icons, subtle organic fan tilt */}
              <Link
                to="/app/$slug"
                params={{ slug: app.slug }}
                style={{
                  transform: isHovered
                    ? "rotate(0deg) translateY(-6px) scale(1.08)"
                    : `rotate(${preset.rotate}deg) translateY(${preset.translateY}px)`,
                }}
                className={`relative block h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-[14px] sm:rounded-[16px] bg-white ring-2 ring-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all duration-200 ease-out cursor-pointer ${
                  isHovered
                    ? "!shadow-[0_16px_32px_rgba(0,0,0,0.28)] !ring-amber-400 z-50"
                    : isGold
                    ? "hover:ring-amber-400"
                    : isBlue
                    ? "hover:ring-sky-400"
                    : "hover:ring-stone-300"
                }`}
                title={app.name}
              >
                <div className="h-full w-full overflow-hidden rounded-[14px] sm:rounded-[16px]">
                  <img
                    alt={app.name}
                    src={appIconUrl(app.icon)}
                    loading="eager"
                    decoding="async"
                    width={48}
                    height={48}
                    onError={(event) => {
                      if (event.currentTarget.src !== app.icon) {
                        event.currentTarget.src = app.icon;
                      } else {
                        event.currentTarget.src = "/site-favicon.svg";
                      }
                    }}
                    className="h-full w-full object-cover select-none pointer-events-none"
                  />
                </div>

                {/* Subtle Tier Badge on Icon */}
                {isGold ? (
                  <span
                    title="Gold Spotlight App"
                    className="absolute -top-1 -right-1 z-10 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center pointer-events-none"
                  >
                    <BadgeCheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 fill-amber-500 text-stone-950 drop-shadow-sm" />
                  </span>
                ) : isBlue ? (
                  <span
                    title="Featured App"
                    className="absolute -top-1 -right-1 z-10 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-xs ring-1 ring-canvas pointer-events-none"
                  >
                    <svg className="h-2 w-2 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </span>
                ) : isHot ? (
                  <span
                    title="Hot App"
                    className="absolute -top-1 -right-1 z-10 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-rose-600 text-[8px] sm:text-[9px] shadow-xs ring-1 ring-canvas pointer-events-none"
                  >
                    🔥
                  </span>
                ) : null}
              </Link>

              {/* Hover Popover Preview Card (opens straight and aligned) */}
              <div
                className={`absolute top-full left-0 pt-3 z-[70] w-[270px] sm:w-[280px] transition-all duration-200 ease-out ${
                  isHovered
                    ? "opacity-100 visible translate-y-0 pointer-events-auto"
                    : "opacity-0 invisible translate-y-2 pointer-events-none"
                }`}
                onMouseEnter={() => handleMouseEnter(app.slug)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to="/app/$slug"
                  params={{ slug: app.slug }}
                  className="block overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_36px_rgba(0,0,0,0.12)] transition-all duration-150 hover:border-line-2"
                >
                  {/* Card Top: App Screenshot Preview */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 border-b border-line flex items-center justify-center p-1.5">
                    {optimizedCover ? (
                      <img
                        alt={`${app.name} preview`}
                        src={optimizedCover}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain object-center rounded-lg"
                        onError={(e) => {
                          if (cover && e.currentTarget.src !== cover) {
                            e.currentTarget.src = cover;
                          } else {
                            e.currentTarget.style.display = "none";
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-4 bg-stone-50">
                        <img
                          alt={`${app.name} icon`}
                          src={appIconUrl(app.icon)}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-[12px] object-cover ring-1 ring-black/10 shadow-md"
                        />
                        <span className="mt-2 text-xs font-semibold text-stone-900">{app.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: App Details Bar */}
                  <div className="p-3 sm:p-3.5 flex items-start gap-2.5 bg-white">
                    <div className="h-8 w-8 shrink-0 rounded-[8px] overflow-hidden bg-surface-2 ring-1 ring-black/10 shadow-xs">
                      <img
                        alt={app.name}
                        src={appIconUrl(app.icon)}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          if (event.currentTarget.src !== app.icon) {
                            event.currentTarget.src = app.icon;
                          } else {
                            event.currentTarget.src = "/site-favicon.svg";
                          }
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-ink tracking-tight truncate">
                          {app.name}
                        </span>
                        {isGold || app.checkBadge ? (
                          <BadgeCheckIcon className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-stone-950" />
                        ) : isBlue ? (
                          <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-blue-600 text-white">
                            <svg className="h-2 w-2 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </span>
                        ) : isHot ? (
                          <span className="text-[10px]">🔥</span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted line-clamp-2 leading-relaxed font-normal">
                        {app.tagline}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
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

            {/* Mobile: Black Friday Sale Countdown (below the site title, hot app icons hidden for now) */}
            <div className="block sm:hidden mt-4">
              <BlackFridayCountdown isMobile />
            </div>

            {/* Desktop: App Icons Row with Black Friday Sale Banner in the same row, centered across screen width */}
            <div className="hidden sm:flex items-center mt-5 sm:mt-6 w-full relative z-30 overflow-visible min-h-[56px]">
              <div className="shrink-0 relative overflow-visible z-30">
                <ChoiceIcons apps={getHeroAppIcons(list, 8)} />
              </div>

              <div className="sm:relative sm:ml-auto lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:ml-0 z-20 pointer-events-auto">
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