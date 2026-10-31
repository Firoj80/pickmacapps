import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import { Missing } from "@/components/missing";
import { editors, getApp, pricingClass, pricingLabel, type AppItem } from "@/lib/catalog";
import { appGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";

export const Route = createFileRoute("/app/$slug")({
  beforeLoad: ({ params }) => {
    if (!getApp(params.slug)) throw notFound();
  },
  component: AppPage,
  notFoundComponent: () => <Missing title="App not found" body="That Mac app isn't in the directory." />,
  head: ({ params, matches }) => {
    const app = getApp(params.slug);
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
    const tagline = app.tagline.trim();
    const joiner = /[.!?]$/.test(tagline) ? " " : ". ";
    const seo = buildMetadata({
      title: `${app.name} — ${tagline}`,
      description: `${app.name}: ${tagline}${joiner}${app.description}`,
      path: `/app/${params.slug}`,
      origin: originFrom(matches),
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
  const app = getApp(slug);
  if (!app) return null;

  const related = app.related
    .map((item) => getApp(item))
    .filter((item): item is AppItem => Boolean(item));
  const choice = editors.has(app.slug);

  return (
    <main>
      <div className="mx-auto w-full max-w-[980px] px-5 pt-8 md:px-10">
        {app.demo ? (
          <div className="mb-8 overflow-hidden rounded-2xl border border-line/80">
            {app.demo.endsWith(".mp4") ? (
              <video src={app.demo} controls muted loop playsInline className="aspect-[1200/630] w-full object-cover" />
            ) : (
              <img alt={`${app.name} screenshot`} src={app.demo} className="aspect-[1200/630] w-full object-cover" />
            )}
          </div>
        ) : null}
        <div className="flex flex-col gap-6 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-5">
            <img alt="" src={app.icon} className="h-20 w-20 rounded-2xl object-cover ring-1 ring-line sm:h-24 sm:w-24" />
            <div>
              {choice ? (
                <p className="text-[12px] font-semibold tracking-[0.14em] text-accent uppercase">
                  Editor’s Choice · paid placement
                </p>
              ) : (
                <p className="text-[12px] font-semibold tracking-[0.14em] text-muted uppercase">{app.categoryName}</p>
              )}
              <h1 className="font-display mt-1 text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">{app.name}</h1>
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
            rel={choice ? "sponsored noopener noreferrer" : "noopener noreferrer"}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas hover:opacity-85"
          >
            Visit website
          </a>
        </div>
      </div>
      <article className="mx-auto max-w-[720px] px-5 py-10 sm:px-6">
        <div className="text-[16.5px] leading-[1.75] whitespace-pre-line text-body">{app.description}</div>
        {related.length > 0 ? (
          <section className="mt-14 border-t border-line pt-8">
            <h2 className="font-display text-2xl font-semibold text-ink">Also on the shelf</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
