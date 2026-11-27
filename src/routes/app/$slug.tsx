import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import { AppAlternatives } from "@/components/app-alternatives";
import { Missing } from "@/components/missing";
import { BadgeCheckIcon } from "@/components/icons";
import { isEditorChoice, posts, pricingClass, pricingLabel, type AppItem } from "@/lib/catalog";
import { appPairs } from "@/lib/compare";
import { directoryFromMatches, resolveRouteDirectoryMatch } from "@/lib/directory-cache";
import { publishedApps } from "@/lib/app-seed";
import { getDiscontinuedAppInfo } from "@/lib/discontinued-apps";
import { appGraph, jsonLdScript } from "@/lib/jsonld";
import { appCoverUrl, appIconUrl } from "@/lib/image-opt";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy, site } from "@/lib/site";
import { trackGoal } from "@/lib/analytics";
import { getAppTotalClicks, trackAppClick } from "@/lib/click-tracking";

function appShareImage(demo?: string) {
  const clean = demo?.trim() ?? "";
  if (!clean || /\.mp4($|\?)/i.test(clean)) return site.ogImage;
  return clean;
}

function appMetaDescription(app: AppItem): string {
  return `Discover ${app.name} for Mac. Explore its features, pricing, compatibility and alternatives.`;
}

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "Just now";
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  if (diffWeeks < 5) return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  return `${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
}

export const Route = createFileRoute("/app/$slug")({
  beforeLoad: async ({ context }) => {
    const resolved = await resolveRouteDirectoryMatch(
      context.directory,
      () => true,
    );
    return { directory: resolved.directory };
  },
  component: AppPage,
  notFoundComponent: () => <Missing title="App not found" body="That Mac app isn't in the directory." />,
  head: ({ params, matches }) => {
    const dir = directoryFromMatches(matches);
    const app = publishedApps(dir).find((item) => item.slug === params.slug);
    if (!app) {
      const tombstones = (dir as { tombstones?: { slug: string; name?: string; category?: string }[] })?.tombstones;
      const discontinued = getDiscontinuedAppInfo(params.slug, tombstones);
      const currentYear = new Date().getFullYear();
      const title = `Best Alternatives to ${discontinued.name} for Mac (${currentYear}) | PickMacApps`;
      const description = `${discontinued.name} is no longer listed on PickMacApps. Discover the top ${discontinued.categoryName.toLowerCase()} alternatives and verified macOS apps.`;
      const origin = originFrom(matches);
      const path = `/app/${params.slug}`;

      const seo = buildMetadata({
        title,
        description,
        ogTitle: `Best Alternatives to ${discontinued.name} for Mac (${currentYear})`,
        ogDescription: description,
        twitterTitle: `Best Alternatives to ${discontinued.name} for Mac (${currentYear})`,
        twitterDescription: description,
        path,
        origin,
        noindex: false,
      });

      // Curate top alternatives for ItemList structured data
      const catApps = publishedApps(dir)
        .filter((a) => a.category === discontinued.category)
        .slice(0, 8);
      const alternativeList = catApps.length > 0 ? catApps : publishedApps(dir).slice(0, 8);

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Top Alternatives to ${discontinued.name} for Mac`,
        description,
        itemListElement: alternativeList.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: `${origin}/app/${item.slug}`,
          description: item.tagline,
        })),
      };

      const script = jsonLdScript(jsonLd);

      return {
        meta: seo.meta,
        links: [...seo.links, markdownAlternate(origin, path)],
        ...(script ? { scripts: [script] } : {}),
      };
    }
    const title = `${app.name} for Mac: Features & Pricing | PickMacApps`;
    const description = appMetaDescription(app);
    const seo = buildMetadata({
      title,
      description,
      ogTitle: `${app.name} for Mac: Features & Pricing`,
      ogDescription: description,
      twitterTitle: `${app.name} for Mac: Features & Pricing`,
      twitterDescription: description,
      path: `/app/${params.slug}`,
      origin: originFrom(matches),
      image: appShareImage(app.demo),
      imageAlt: `${app.name} for Mac — Features & Pricing`,
    });
    const script = jsonLdScript(appGraph(originFrom(matches), app));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(originFrom(matches), `/app/${params.slug}`)],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function AppPage() {
  const { slug } = Route.useParams();
  const { directory } = Route.useRouteContext();
  const allApps = publishedApps(directory);
  const app = allApps.find((item) => item.slug === slug) ?? null;
  if (!app) {
    const tombstones = (directory as { tombstones?: { slug: string; name?: string; category?: string }[] })?.tombstones;
    const discontinued = getDiscontinuedAppInfo(slug, tombstones);
    return <AppAlternatives discontinued={discontinued} allApps={allApps} />;
  }

  return <AppDetails app={app} allApps={allApps} slug={slug} directory={directory} />;
}

function AppDetails({
  app,
  allApps,
  slug,
  directory,
}: {
  app: AppItem;
  allApps: AppItem[];
  slug: string;
  directory: ReturnType<typeof Route.useRouteContext>["directory"];
}) {

  const allOtherApps = allApps.filter((item) => item.slug !== app.slug);
  const explicitRelated = app.related
    .map((item) => allOtherApps.find((a) => a.slug === item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const sameCategory = allOtherApps.filter(
    (item) => item.category === app.category && !explicitRelated.some((r) => r.slug === item.slug),
  );
  const others = allOtherApps.filter(
    (item) => !explicitRelated.some((r) => r.slug === item.slug) && !sameCategory.some((c) => c.slug === item.slug),
  );
  const related = [...explicitRelated, ...sameCategory, ...others].slice(0, 4);
  const choice = isEditorChoice(app);

  const initialClicks = getAppTotalClicks(app);
  const [clicks, setClicks] = useState(initialClicks);

  useEffect(() => {
    setClicks(getAppTotalClicks(app));
  }, [app.id, app.slug, app.clickCount, app.tryCount]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      const shellBox = document.querySelector(".site-shell-box");
      if (shellBox) {
        shellBox.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      }
    }
  }, [slug]);

  const [copied, setCopied] = useState(false);

  let authorName = app.developerName || "Indie Developer";
  let authorUrl: string | null = null;
  let avatarUrl: string | null = null;

  if (app.xHandle) {
    const cleanHandle = app.xHandle.replace(/^@/, "").trim();
    authorName = app.developerName || `@${cleanHandle}`;
    authorUrl = `https://x.com/${cleanHandle}`;
    avatarUrl = `https://unavatar.io/x/${cleanHandle}`;
  } else {
    if (app.developerName) {
      authorName = app.developerName;
    }
    if (app.website) {
      try {
        const host = new URL(app.website).hostname.replace(/^www\./, "");
        avatarUrl = `https://unavatar.io/${host}`;
      } catch {
        /* ignore invalid website */
      }
    }
  }

  const isGold = app.featuredTier === "article";
  const isBlue = (choice && app.featuredTier !== "article") || app.featuredTier === "featured";
  const hasBadges = isGold || isBlue || app.featured || choice || app.isHot;

  const handleShare = () => {
    if (typeof window === "undefined") return;
    if (navigator.share) {
      navigator.share({
        title: `${app.name} for Mac`,
        text: app.tagline,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const matchups = appPairs(app.slug, {
    apps: allApps,
    posts: directory?.posts ?? posts,
  });

  return (
    <main className="flex-1 w-full px-4 sm:px-6 md:px-8 xl:px-10 py-6 sm:py-8">
      {/* Breadcrumb Navigation with Circular Back Button */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted">
        <Link
          to="/"
          aria-label="Back to collection"
          onClick={(e) => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              e.preventDefault();
              window.history.back();
            }
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:bg-surface-2 hover:text-ink cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <Link to="/" className="transition hover:text-ink">
          Apps
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to="/category/$slug"
          params={{ slug: app.category }}
          className="transition hover:text-ink capitalize"
        >
          {app.categoryName}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-ink font-medium" aria-current="page">
          {app.name}
        </span>
      </nav>

      {/* Main 2-Column Split matching macapp.supply */}
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-14">
        {/* Right Column: Sticky App Card matching macapp.supply */}
        <aside className="lg:order-2">
          <div className="lg:sticky lg:top-8 space-y-4">
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-xs">
              {/* Header: App Icon on left + Title & Category on right */}
              <div className="flex items-center gap-4">
                <img
                  alt={`${app.name} app icon`}
                  src={appIconUrl(app.icon)}
                  loading="eager"
                  fetchPriority="high"
                  width={68}
                  height={68}
                  onError={(e) => {
                    if (e.currentTarget.src !== app.icon) {
                      e.currentTarget.src = app.icon;
                    } else {
                      e.currentTarget.src = "/site-favicon.svg";
                    }
                  }}
                  className="h-[68px] w-[68px] shrink-0 rounded-[18px] bg-surface object-cover shadow-sm ring-1 ring-line/70"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-[20px] sm:text-[22px] font-bold leading-snug tracking-tight text-ink line-clamp-2">
                      {app.name}
                    </h1>
                    {isGold && (
                      <span title="Editor’s Choice (Golden Badge)" className="shrink-0">
                        <BadgeCheckIcon className="h-5 w-5 shrink-0 fill-amber-500 text-stone-950" />
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] font-medium text-muted">
                    <Link
                      to="/category/$slug"
                      params={{ slug: app.category }}
                      className="hover:text-ink transition-colors capitalize"
                    >
                      {app.categoryName}
                    </Link>
                  </p>
                </div>
              </div>

              {/* Tagline / Intro Description */}
              <p className="mt-3.5 text-[14px] leading-relaxed text-muted line-clamp-3">
                {app.tagline}
              </p>

              {/* Badges: Featured - Gold, Featured - Blue, Hot */}
              {hasBadges ? (
                <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                  {isGold ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
                      <BadgeCheckIcon className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-stone-950" />
                      <span>Featured - Gold</span>
                    </span>
                  ) : isBlue ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3 py-1 text-[11px] font-bold text-white shadow-2xs">
                      <svg className="h-3 w-3 fill-white" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span>Featured - Blue</span>
                    </span>
                  ) : (app.featured || choice) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white shadow-2xs">
                      <svg className="h-3 w-3 fill-white" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span>Featured</span>
                    </span>
                  ) : null}

                  {app.isHot ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-orange-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs">
                      <span className="relative flex h-2 w-2 items-center justify-center">
                        <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-white/50 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white ring-2 ring-white/40"></span>
                      </span>
                      <span>🔥 Hot</span>
                    </span>
                  ) : null}
                </div>
              ) : null}

              {/* Action Buttons: Visit Website (full width) + Share (circular) */}
              <div className="mt-5 flex items-center gap-2.5">
                <a
                  href={app.website}
                  target="_blank"
                  rel={isGold ? "noopener noreferrer" : "nofollow noopener noreferrer"}
                  data-ml-goal="try_app"
                  onClick={() => {
                    trackGoal("try_app", { app: app.name, slug: app.slug, url: app.website });
                    setClicks((c) => c + 1);
                    void trackAppClick(app.id, app.slug, "try").then((res) => {
                      if (res.ok && typeof res.totalClicks === "number") {
                        setClicks(res.totalClicks);
                      }
                    });
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[14px] font-semibold text-canvas transition-all duration-200 hover:opacity-90 shadow-2xs active:scale-[0.99] cursor-pointer"
                >
                  <span>Visit website</span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17L17 7" />
                    <path d="M8 7h9v9" />
                  </svg>
                </a>

                {/* Share Button with Copied Tooltip */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleShare}
                    title="Share this app"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:bg-surface-2 hover:text-ink cursor-pointer active:scale-95"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                  {copied ? (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-ink px-2 py-0.5 text-[11px] font-semibold text-canvas shadow-md">
                      Copied!
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Horizontal Divider */}
              <hr className="my-5 border-line/70" />

              {/* 2-Column Specs Grid matching screenshot */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-left">
                {/* Author */}
                <div>
                  <p className="text-[12px] font-medium text-muted">Author</p>
                  <div className="mt-1 flex items-center gap-2 min-w-0">
                    {avatarUrl ? (
                      <img
                        alt={authorName}
                        src={avatarUrl}
                        loading="lazy"
                        decoding="async"
                        width={24}
                        height={24}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                        className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-line/80 shadow-2xs"
                      />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-bold text-muted ring-1 ring-line/80">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 truncate text-[14px] font-semibold text-ink">
                      {authorUrl ? (
                        <a
                          href={authorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-accent hover:underline transition-colors truncate block"
                        >
                          {authorName}
                        </a>
                      ) : (
                        <span className="truncate block">{authorName}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <p className="text-[12px] font-medium text-muted">Pricing</p>
                  <p className="mt-1 text-[14px] font-semibold text-ink capitalize">
                    {pricingLabel[app.pricing] || app.pricing || "Paid"}
                  </p>
                </div>

                {/* Category */}
                <div>
                  <p className="text-[12px] font-medium text-muted">Category</p>
                  <div className="mt-1">
                    <Link
                      to="/category/$slug"
                      params={{ slug: app.category }}
                      className="text-[14px] font-semibold text-ink hover:text-accent hover:underline transition-colors capitalize"
                    >
                      {app.categoryName}
                    </Link>
                  </div>
                </div>

                {/* Updated */}
                <div>
                  <p className="text-[12px] font-medium text-muted">Updated</p>
                  <p className="mt-1 text-[14px] font-semibold text-ink">
                    {formatTimeAgo(app.updatedAt || app.createdAt)}
                  </p>
                </div>

                {/* Clicks */}
                <div>
                  <p className="text-[12px] font-medium text-muted">Clicks</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                    <svg className="h-4 w-4 text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                      <path d="m13 13 6 6" />
                    </svg>
                    <span className="tabular-nums">{clicks.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Left Column: Media, About, Alternatives */}
        <article className="min-w-0 lg:order-1 space-y-10">
          {/* Cover Screenshot */}
          {app.demo ? (
            <div className="overflow-hidden rounded-2xl border border-line/70 bg-surface-2/40 shadow-xs">
              {app.demo.endsWith(".mp4") ? (
                <video src={app.demo} controls muted loop playsInline className="block h-auto max-h-[580px] w-full object-contain" />
              ) : (
                <img
                  alt={`${app.name} screenshot`}
                  src={appCoverUrl(app.demo)}
                  loading="lazy"
                  decoding="async"
                  width={1200}
                  height={630}
                  onError={(e) => {
                    if (e.currentTarget.src !== app.demo) {
                      e.currentTarget.src = app.demo;
                    } else {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }
                  }}
                  className="block h-auto max-h-[580px] w-full object-cover"
                />
              )}
            </div>
          ) : null}

          {/* Description Body */}
          <section className="max-w-3xl">
            <h2 className="mb-4 font-display text-[22px] font-bold tracking-tight text-ink">
              About {app.name}
            </h2>
            <div className="whitespace-pre-line text-base leading-[1.75] text-body">
              {app.description}
            </div>
          </section>

          {/* App Overview & Specifications (Structured Fields) */}
          <div className="rounded-2xl border border-line/70 bg-surface p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Compatibility & Details</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 text-xs">
              <div>
                <dt className="text-muted">Platform</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {app.macosVersion ? `macOS ${app.macosVersion}` : "macOS Sequoia, Sonoma & Ventura"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Architecture</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {app.appleSilicon !== false && app.intelSupported !== false
                    ? "Universal (Apple Silicon & Intel)"
                    : app.appleSilicon !== false
                    ? "Silicon Only"
                    : "Intel x86_64"}
                </dd>
              </div>
              {app.developerName ? (
                <div>
                  <dt className="text-muted">Developer</dt>
                  <dd className="mt-0.5 font-medium text-ink">{app.developerName}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted">Official Website</dt>
                <dd className="mt-0.5 truncate font-medium text-accent hover:underline">
                  <a href={app.website} target="_blank" rel={isGold ? "noopener noreferrer" : "nofollow noopener noreferrer"}>
                    {app.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} ↗
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          {/* Alternatives & Head-to-Head Comparisons Widget */}
          <section className="border-t border-line/70 pt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-xs text-accent font-bold">
                    ⚔️
                  </span>
                  <h2 className="text-lg font-[550] tracking-[-0.025em] text-ink sm:text-xl">
                    {app.name} Alternatives & Comparisons
                  </h2>
                </div>
                <p className="mt-1 text-xs text-muted sm:text-sm">
                  Direct head-to-head comparisons against other popular {app.categoryName.toLowerCase()} tools for Mac.
                </p>
              </div>
              <Link
                to="/compare"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                All Comparisons <span>→</span>
              </Link>
            </div>

            {matchups.length > 0 ? (
              <div className="mt-5 space-y-3">
                {matchups.map((pair) => {
                  const competitor = pair.left.slug === app.slug ? pair.right : pair.left;
                  return (
                    <Link
                      key={pair.slug}
                      to="/compare/$slug"
                      params={{ slug: pair.slug }}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 transition-all duration-200 hover:border-accent/40 hover:bg-surface-2 hover:shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center -space-x-2 shrink-0">
                          <img
                            alt={app.name}
                            src={appIconUrl(app.icon)}
                            loading="lazy"
                            decoding="async"
                            width={40}
                            height={40}
                            onError={(e) => {
                              if (e.currentTarget.src !== app.icon) {
                                e.currentTarget.src = app.icon;
                              } else {
                                e.currentTarget.src = "/site-favicon.svg";
                              }
                            }}
                            className="h-10 w-10 rounded-xl object-cover ring-2 ring-surface"
                          />
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[10px] font-bold text-muted ring-2 ring-surface z-10">
                            vs
                          </div>
                          <img
                            alt={competitor.name}
                            src={appIconUrl(competitor.icon)}
                            loading="lazy"
                            decoding="async"
                            width={40}
                            height={40}
                            onError={(e) => {
                              if (e.currentTarget.src !== competitor.icon) {
                                e.currentTarget.src = competitor.icon;
                              } else {
                                e.currentTarget.src = "/site-favicon.svg";
                              }
                            }}
                            className="h-10 w-10 rounded-xl object-cover ring-2 ring-surface"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-ink group-hover:text-accent transition-colors">
                              {app.name} vs {competitor.name}
                            </h3>
                            <span
                              className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium capitalize ring-1 ring-inset ${pricingClass[competitor.pricing]}`}
                            >
                              {competitor.name}: {pricingLabel[competitor.pricing]}
                            </span>
                          </div>
                          <p className="line-clamp-1 text-xs text-muted mt-0.5">
                            {competitor.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end shrink-0 sm:self-center">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-white">
                          Compare Side-by-Side <span>→</span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </section>

          {/* More in this category */}
          {related.length > 0 ? (
            <section className="border-t border-line/70 pt-8">
              <h2 className="mb-5 text-lg font-bold tracking-tight text-ink">
                More in {app.categoryName}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {related.map((item) => (
                  <AppCard key={item.id} app={item} />
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </div>
    </main>
  );
}
