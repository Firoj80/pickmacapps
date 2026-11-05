import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import { ScanMyDiskNote, featuresScanMyDisk } from "@/components/scanmydisk-note";
import { publishedApps } from "@/lib/app-seed";
import { categoryGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { normalizeCategorySlug } from "@/lib/shelf-categories";
import { pageCopy } from "@/lib/site";

function categoryFrom(directory: { categories?: { slug: string; name: string; emoji: string; paragraphs: string[]; tips: string[] }[] } | null | undefined, slug: string) {
  return directory?.categories?.find((item) => item.slug === slug) ?? null;
}

export const Route = createFileRoute("/category/$slug")({
  beforeLoad: ({ params, context }) => {
    const slug = normalizeCategorySlug(params.slug);
    if (slug !== params.slug) {
      throw redirect({ to: "/category/$slug", params: { slug } });
    }
    if (!categoryFrom(context.directory, slug)) throw notFound();
  },
  component: CategoryPage,
  head: ({ params, matches }) => {
    const slug = normalizeCategorySlug(params.slug);
    const directory = matches[0]?.context.directory;
    const category = categoryFrom(directory, slug);
    const listed = publishedApps(directory).filter((app) => normalizeCategorySlug(app.category) === slug);
    if (!category) {
      const missing = buildMetadata({
        title: pageCopy.notFound.title,
        description: pageCopy.notFound.description,
        path: `/category/${params.slug}`,
        origin: originFrom(matches),
        noindex: true,
      });
      return { meta: missing.meta, links: missing.links };
    }
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: `${category.name} Mac Apps`,
      description: category.paragraphs[0] ?? "Mac apps in this category.",
      path: `/category/${slug}`,
      origin,
    });
    const script = jsonLdScript(categoryGraph(origin, category, listed));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, `/category/${slug}`)],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function CategoryPage() {
  const { slug: rawSlug } = Route.useParams();
  const slug = normalizeCategorySlug(rawSlug);
  const { directory } = Route.useRouteContext();
  const category = categoryFrom(directory, slug);
  if (!category) return null;
  const listed = publishedApps(directory).filter((app) => normalizeCategorySlug(app.category) === slug);
  const label = category.name.toLowerCase();

  return (
    <main>
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="text-4xl">
            {category.emoji}
          </span>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">
            {category.name} Mac Apps
          </h1>
        </div>
        <div className="mt-5 max-w-3xl space-y-4 text-[15px] leading-relaxed text-body">
          {category.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-ink">What to look for</h2>
          <ul className="mt-4 space-y-3">
            {category.tips.map((tip) => (
              <li key={tip} className="flex gap-3 text-[15px] leading-relaxed text-body">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-faint" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
        {featuresScanMyDisk(listed.map((app) => app.name)) ? (
          <div className="mt-6">
            <ScanMyDiskNote />
          </div>
        ) : null}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-ink">
            {listed.length} {label} {listed.length === 1 ? "app" : "apps"}
          </h2>
          {listed.length === 0 ? (
            <p className="mt-6 text-[15px] text-body">No apps in this category yet.</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listed.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
