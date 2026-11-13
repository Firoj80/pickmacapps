import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import { Missing } from "@/components/missing";
import { isEditorChoice, posts, pricingClass, pricingLabel, type AppItem } from "@/lib/catalog";
import { appPairs } from "@/lib/compare";
import { directoryFromMatches, resolveRouteDirectoryMatch } from "@/lib/directory-cache";
import { publishedApps } from "@/lib/app-seed";
import { appGraph, jsonLdScript } from "@/lib/jsonld";
import { appCoverUrl, appIconUrl } from "@/lib/image-opt";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy, site } from "@/lib/site";
import { trackGoal } from "@/lib/analytics";

function appShareImage(demo?: string) {
  const clean = demo?.trim() ?? "";
  if (!clean || /\.mp4($|\?)/i.test(clean)) return site.ogImage;
  return clean;
}

function appMetaDescription(app: AppItem): string {
  return `Discover ${app.name} for Mac. Explore its features, pricing, compatibility and alternatives.`;
}

function trackTryApp(appId?: string) {
  if (typeof window === "undefined" || !appId) return;
  fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ appId, type: "try" }),
  }).catch(() => {});
}

export const Route = createFileRoute("/app/$slug")({
  beforeLoad: async ({ params, context }) => {
    const resolved = await resolveRouteDirectoryMatch(
      context.directory,
      (dir) => publishedApps(dir).some((app) => app.slug === params.slug),
    );
    if (!resolved.found) throw notFound();
    return { directory: resolved.directory };
  },
  component: AppPage,
  notFoundComponent: () => <Missing title="App not found" body="That Mac app isn't in the directory." />,
  head: ({ params, matches }) => {
    const app = publishedApps(directoryFromMatches(matches)).find((item) => item.slug === params.slug);
    if (!app) {
      const missing = buildMetadata({
        title: pageCopy.notFound.title,
        description: pageCopy.notFound.description,
        path: `/app/${params.slug}`,
        origin: originFrom(matches),
        noindex: true,
      });
      return { meta: missing.meta, links: missing.links };
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
  if (!app) return null;

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

  const matchups = appPairs(app.slug, {
    apps: allApps,
    posts: directory?.posts ?? posts,
  });

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="flex gap-10 lg:gap-14">
          {/* Left sticky sidebar: curated app list */}
          <aside className="hidden w-48 shrink-0 lg:block">
            <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Explore Apps
              </p>
              <ul className="space-y-1">
                {allApps.slice(0, 25).map((sidebarApp) => {
                  const isActive = sidebarApp.slug === app.slug;
                  return (
                    <li key={sidebarApp.slug}>
                      <Link
                        to="/app/$slug"
                        params={{ slug: sidebarApp.slug }}
                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                          isActive
                            ? "bg-surface-2 font-medium text-ink shadow-xs"
                            : "text-muted hover:bg-surface hover:text-ink"
                        }`}
                      >
                        <img
                          alt=""
                          src={appIconUrl(sidebarApp.icon)}
                          loading="lazy"
                          decoding="async"
                          width={24}
                          height={24}
                          onError={(e) => {
                            if (e.currentTarget.src !== sidebarApp.icon) {
                              e.currentTarget.src = sidebarApp.icon;
                            } else {
                              e.currentTarget.src = "/site-favicon.svg";
                            }
                          }}
                          className="h-6 w-6 shrink-0 rounded-md object-cover ring-1 ring-line/70"
                        />
                        <span className="truncate">{sidebarApp.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main article content */}
          <article className="min-w-0 flex-1 max-w-3xl">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs font-medium text-muted">
              <Link to="/" className="transition-colors hover:text-ink">
                Home
              </Link>
              <span aria-hidden="true" className="text-muted/60">/</span>
              <Link
                to="/category/$slug"
                params={{ slug: app.category }}
                className="transition-colors hover:text-ink capitalize"
              >
                {app.categoryName}
              </Link>
              <span aria-hidden="true" className="text-muted/60">/</span>
              <span className="truncate text-ink font-semibold" aria-current="page">
                {app.name}
              </span>
            </nav>

            {/* Header: Icon, Name, Tagline & CTA button */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-line sm:h-20 sm:w-20 sm:rounded-[20px]">
                  <img
                    alt={app.name}
                    src={appIconUrl(app.icon)}
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    width={80}
                    height={80}
                    onError={(e) => {
                      if (e.currentTarget.src !== app.icon) {
                        e.currentTarget.src = app.icon;
                      } else {
                        e.currentTarget.src = "/site-favicon.svg";
                      }
                    }}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-[550] tracking-[-0.025em] text-ink sm:text-2xl">
                      {app.name}
                    </h1>
                    {choice ? (
                      app.featuredTier === "article" ? (
                        <span title="Editor’s Choice (Featured + Article)" className="flex items-center text-amber-500">
                          <svg className="h-4 w-4 fill-amber-500" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </span>
                      ) : (
                        <span title="Featured App" className="flex items-center text-sky-500">
                          <svg className="h-4 w-4 fill-sky-500" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </span>
                      )
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-body sm:text-base leading-snug">{app.tagline}</p>
                </div>
              </div>

              {/* Desktop CTA */}
              <a
                href={app.website}
                target="_blank"
                rel={choice ? "noopener noreferrer" : "nofollow noopener noreferrer"}
                data-ml-goal="try_app"
                onClick={() => {
                  trackGoal("try_app", { app: app.name, slug: app.slug, url: app.website });
                  trackTryApp(app.id);
                }}
                className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:opacity-85 sm:inline-flex"
              >
                Try the app
                <span className="text-xs">↗</span>
              </a>
            </div>

            {/* Badges row & Mobile CTA */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${pricingClass[app.pricing]}`}>
                {pricingLabel[app.pricing]}
              </span>
              <Link
                to="/category/$slug"
                params={{ slug: app.category }}
                className="rounded-md border border-line-2 bg-surface px-2.5 py-1 text-xs font-medium text-body transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {app.categoryName}
              </Link>
              {/* Mobile CTA */}
              <a
                href={app.website}
                target="_blank"
                rel={choice ? "noopener noreferrer" : "nofollow noopener noreferrer"}
                data-ml-goal="try_app"
                onClick={() => {
                  trackGoal("try_app", { app: app.name, slug: app.slug, url: app.website });
                  trackTryApp(app.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-canvas transition-colors hover:opacity-85 sm:hidden"
              >
                Try the app
                <span className="text-xs">↗</span>
              </a>
            </div>

            {/* App Screenshot / Demo */}
            {app.demo ? (
              <div className="mt-8 overflow-hidden rounded-xl border border-line bg-surface-2/40 dark:bg-[#101114]">
                {app.demo.endsWith(".mp4") ? (
                  <video src={app.demo} controls muted loop playsInline className="block h-auto max-h-[580px] w-full object-contain" />
                ) : (
                  <img
                    alt={`${app.name} screenshot`}
                    src={appCoverUrl(app.demo)}
                    loading="lazy"
                    decoding="async"
                    width={800}
                    height={450}
                    onError={(e) => {
                      if (e.currentTarget.src !== app.demo) {
                        e.currentTarget.src = app.demo;
                      } else {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }
                    }}
                    className="block h-auto max-h-[580px] w-full object-contain"
                  />
                )}
              </div>
            ) : null}

            {/* Description Body */}
            <div className="mt-8 whitespace-pre-line text-base leading-[1.75] text-body">
              {app.description}
            </div>

            {/* App Overview & Specifications (Optional Structured Fields) */}
            <div className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <h2 className="text-base font-semibold text-ink">App Overview & Compatibility</h2>
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
                      ? "Apple Silicon Native"
                      : "Intel x86_64"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Category</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    <Link to="/category/$slug" params={{ slug: app.category }} className="text-accent hover:underline">
                      {app.categoryName}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Pricing Model</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {pricingLabel[app.pricing] || "Free"}
                    {app.price ? ` (${typeof app.price === "number" ? `$${app.price}` : app.price})` : ""}
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
                    <a href={app.website} target="_blank" rel={choice ? "noopener noreferrer" : "nofollow noopener noreferrer"}>
                      {app.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} ↗
                    </a>
                  </dd>
                </div>
                {app.privacyPolicyUrl ? (
                  <div>
                    <dt className="text-muted">Privacy Policy</dt>
                    <dd className="mt-0.5 truncate font-medium text-accent hover:underline">
                      <a href={app.privacyPolicyUrl} target="_blank" rel="nofollow noopener noreferrer">
                        Developer Privacy Policy ↗
                      </a>
                    </dd>
                  </div>
                ) : null}
                {app.updatedAt && app.updatedAt !== app.createdAt ? (
                  <div>
                    <dt className="text-muted">Last Updated</dt>
                    <dd className="mt-0.5 font-medium text-ink">{app.updatedAt}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {/* Alternatives & Head-to-Head Comparisons Widget */}
            <section className="mt-14 border-t border-line pt-8">
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
                          {/* App icons comparison pill */}
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
                            {pair.guides[0] ? (
                              <p className="text-[11px] text-muted/80 mt-1">
                                Featured in: <span className="text-body font-medium">{pair.guides[0].title}</span>
                              </p>
                            ) : null}
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
              ) : (
                <div className="mt-4 rounded-xl border border-line bg-surface/50 p-4 text-xs text-muted">
                  <p>
                    No head-to-head battle published yet for {app.name}. Browse related {app.categoryName.toLowerCase()} alternatives below or check the{" "}
                    <Link to="/compare" className="text-accent underline font-medium">
                      Comparison Hub
                    </Link>
                    .
                  </p>
                </div>
              )}
            </section>

            {/* You might also like / Alternatives section */}
            {related.length > 0 ? (
              <section className="mt-14 border-t border-line pt-8">
                <h2 className="mb-5 text-lg font-[550] tracking-[-0.025em] text-ink">You might also like</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      to="/app/$slug"
                      params={{ slug: item.slug }}
                      className="group flex items-start gap-4 rounded-xl border border-line bg-surface p-4 transition-colors duration-200 hover:border-line-2 hover:bg-surface-2"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
                        <img
                          alt={item.name}
                          src={appIconUrl(item.icon)}
                          loading="lazy"
                          decoding="async"
                          width={48}
                          height={48}
                          onError={(e) => {
                            if (e.currentTarget.src !== item.icon) {
                              e.currentTarget.src = item.icon;
                            } else {
                              e.currentTarget.src = "/site-favicon.svg";
                            }
                          }}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-[550] tracking-[-0.025em] text-ink group-hover:text-accent">
                            {item.name}
                          </h3>
                          <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium capitalize ring-1 ring-inset ${pricingClass[item.pricing]}`}>
                            {pricingLabel[item.pricing]}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-xs text-muted">{item.tagline}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </article>
        </div>
      </div>
    </main>
  );
}
