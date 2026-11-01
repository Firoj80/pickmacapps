import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import { Missing } from "@/components/missing";
import { apps, getApp, isEditorChoice, pricingClass, pricingLabel, type AppItem } from "@/lib/catalog";
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
    const directory = context.directory;
    const found = directory ? directory.apps.some((app) => app.slug === params.slug) : Boolean(getApp(params.slug));
    if (!found) throw notFound();
  },
  component: AppPage,
  notFoundComponent: () => <Missing title="App not found" body="That Mac app isn't in the directory." />,
  head: ({ params, matches }) => {
    const directory = matches[0]?.context.directory;
    const app = directory ? directory.apps.find((item) => item.slug === params.slug) : getApp(params.slug);
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
  const app = directory ? directory.apps.find((item) => item.slug === slug) ?? null : getApp(slug);
  if (!app) return null;

  const allOtherApps = (directory?.apps ?? apps).filter((item) => item.slug !== app.slug);
  const explicitRelated = app.related
    .map((item) => allOtherApps.find((a) => a.slug === item))
    .filter((item): item is AppItem => Boolean(item));
  const sameCategory = allOtherApps.filter(
    (item) => item.category === app.category && !explicitRelated.some((r) => r.slug === item.slug),
  );
  const others = allOtherApps.filter(
    (item) => !explicitRelated.some((r) => r.slug === item.slug) && !sameCategory.some((c) => c.slug === item.slug),
  );
  const related = [...explicitRelated, ...sameCategory, ...others].slice(0, 3);
  const choice = isEditorChoice(app);

  return (
    <main>
      <div className="mx-auto w-full max-w-[1200px] px-4 pt-10 sm:px-6">
        {app.demo ? (
          <div className="mb-8 overflow-hidden rounded-2xl border border-line/80">
            {app.demo.endsWith(".mp4") ? (
              <video src={app.demo} controls muted loop playsInline className="aspect-[1200/630] w-full object-cover" />
            ) : (
              <img
                alt={`${app.name} for Mac screenshot`}
                src={app.demo}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
                className="aspect-[1200/630] w-full object-cover"
              />
            )}
          </div>
        ) : null}
        <div className="flex flex-col gap-6 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-5">
            <img
              alt={`${app.name} for Mac icon`}
              src={app.icon}
              onError={(e) => {
                e.currentTarget.src = "/site-favicon.svg";
              }}
              className="h-20 w-20 rounded-2xl object-cover ring-1 ring-line sm:h-24 sm:w-24"
            />
            <div>
              {choice ? (
                <p className="text-[12px] font-semibold tracking-[0.14em] text-accent uppercase">
                  Editor’s Choice
                </p>
              ) : (
                <p className="text-[12px] font-semibold tracking-[0.14em] text-muted uppercase">{app.categoryName}</p>
              )}
              <h1 className="font-display mt-1 text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">{app.name} for Mac</h1>
              <p className="mt-2 max-w-xl text-[16px] text-body">{app.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${pricingClass[app.pricing]}`}>
                  {pricingLabel[app.pricing]}
                </span>
                <Link
                  to="/category/$slug"
                  params={{ slug: app.category }}
                  className="rounded-full border border-line px-2.5 py-1 text-xs text-body hover:text-ink"
                >
                  {app.categoryIcon} {app.categoryName}
                </Link>
              </div>
            </div>
          </div>
          <a
            href={app.website}
            target="_blank"
            rel={choice ? "noopener noreferrer" : "nofollow noopener noreferrer"}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-line-2 bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Try the app ↗
          </a>
        </div>
      </div>
      <article className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
        <div className="text-[16.5px] leading-[1.75] whitespace-pre-line text-body">{app.description}</div>
        {related.length > 0 ? (
          <section className="mt-14 border-t border-line pt-8">
            <h2 className="font-display text-2xl font-semibold text-ink">Alternatives</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <AppCard key={item.id} app={item} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
