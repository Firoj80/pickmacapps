import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import { Missing } from "@/components/missing";
import { ScanMyDiskNote } from "@/components/scanmydisk-note";
import { isEditorChoice, pricingClass, pricingLabel, type AppItem } from "@/lib/catalog";
import { publishedApps } from "@/lib/app-seed";
import { appGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy, site } from "@/lib/site";

export function appShareImage(demo?: string) {
  const clean = demo?.trim() ?? "";
  if (!clean || /\.mp4($|\?)/i.test(clean)) return site.ogImage;
  return clean;
}

export function appMetaDescription(app: AppItem): string {
  const summary = `${app.name} for Mac: ${app.tagline.trim().replace(/\.$/, "")}. ${app.description.replace(/\s+/g, " ").trim()}`;
  if (summary.length >= 120 && summary.length <= 155) return summary;
  if (summary.length > 155) {
    const slice = summary.slice(0, 154);
    const lastPeriod = slice.lastIndexOf(". ");
    if (lastPeriod >= 115) {
      return slice.slice(0, lastPeriod + 1).trim();
    }
    const lastSpace = slice.lastIndexOf(" ");
    const trimmed = (lastSpace >= 110 ? slice.slice(0, lastSpace) : slice).replace(/[\s,;:-]+$/, "").trim();
    return `${trimmed}.`;
  }
  const expanded = `${summary.replace(/\.$/, "")}. Check pricing, key features, and Mac alternatives on PickMacApps.`;
  if (expanded.length > 155) {
    const slice = expanded.slice(0, 154);
    const lastSpace = slice.lastIndexOf(" ");
    return (lastSpace >= 110 ? slice.slice(0, lastSpace) : slice).replace(/[\s,;:-]+$/, "").trim() + ".";
  }
  return expanded;
}

export const Route = createFileRoute("/app/$slug")({
  beforeLoad: ({ params, context }) => {
    const found = publishedApps(context.directory).some((app) => app.slug === params.slug);
    if (!found) throw notFound();
  },
  component: AppPage,
  notFoundComponent: () => <Missing title="App not found" body="That Mac app isn't in the directory." />,
  head: ({ params, matches }) => {
    const app = publishedApps(matches[0]?.context.directory).find((item) => item.slug === params.slug);
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
    const title = `${app.name} for Mac: Review, Pricing and Alternatives | PickMacApps`;
    const description = appMetaDescription(app);
    const seo = buildMetadata({
      title,
      description,
      path: `/app/${params.slug}`,
      origin: originFrom(matches),
      image: appShareImage(app.demo),
      imageAlt: `${app.name} for Mac review and alternatives`,
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
                          src={sidebarApp.icon}
                          onError={(e) => {
                            e.currentTarget.src = "/site-favicon.svg";
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
            {/* Header: Icon, Name, Tagline & CTA button */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-line sm:h-20 sm:w-20 sm:rounded-[20px]">
                  <img
                    alt={app.name}
                    src={app.icon}
                    onError={(e) => {
                      e.currentTarget.src = "/site-favicon.svg";
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
                      <span title="Editor’s Choice" className="flex items-center text-amber-500">
                        <svg className="h-4 w-4 fill-amber-500" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </span>
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
                {app.categoryIcon} {app.categoryName}
              </Link>
              {/* Mobile CTA */}
              <a
                href={app.website}
                target="_blank"
                rel={choice ? "noopener noreferrer" : "nofollow noopener noreferrer"}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-canvas transition-colors hover:opacity-85 sm:hidden"
              >
                Try the app
                <span className="text-xs">↗</span>
              </a>
            </div>

            {/* App Screenshot / Demo */}
            {app.demo ? (
              <div className="mt-8 overflow-hidden rounded-xl border border-line bg-surface">
                {app.demo.endsWith(".mp4") ? (
                  <video src={app.demo} controls muted loop playsInline className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <img
                    alt={`${app.name} screenshot`}
                    src={app.demo}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                    className="aspect-[16/10] w-full object-cover"
                  />
                )}
              </div>
            ) : null}

            {app.slug === "scanmydisk" ? (
              <div className="mt-6">
                <ScanMyDiskNote />
              </div>
            ) : null}

            {/* Description Body */}
            <div className="mt-8 whitespace-pre-line text-base leading-[1.75] text-body">
              {app.description}
            </div>

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
                          src={item.icon}
                          onError={(e) => {
                            e.currentTarget.src = "/site-favicon.svg";
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
