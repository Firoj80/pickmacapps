import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import { appsInCategory, getCategory } from "@/lib/catalog";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";

export const Route = createFileRoute("/category/$slug")({
  beforeLoad: ({ params }) => {
    if (!getCategory(params.slug) || appsInCategory(params.slug).length === 0) throw notFound();
  },
  component: CategoryPage,
  head: ({ params, matches }) => {
    const category = getCategory(params.slug);
    if (!category || appsInCategory(params.slug).length === 0) {
      const missing = buildMetadata({
        title: pageCopy.notFound.title,
        description: pageCopy.notFound.description,
        path: `/category/${params.slug}`,
        origin: originFrom(matches),
        noindex: true,
      });
      return { meta: missing.meta, links: missing.links };
    }
    const seo = buildMetadata({
      title: `${category.name} Mac Apps`,
      description: category.paragraphs[0] ?? "Mac apps in this category.",
      path: `/category/${params.slug}`,
      origin: originFrom(matches),
    });
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(originFrom(matches), `/category/${params.slug}`)],
    };
  },
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const category = getCategory(slug);
  if (!category) return null;
  const listed = appsInCategory(slug);
  const label = category.name.toLowerCase();

  return (
    <main>
      <section className="mx-auto max-w-[1400px] px-5 py-14 md:px-10">
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
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-ink">
            {listed.length} {label} apps
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {listed.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
