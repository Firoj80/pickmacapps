import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import {
  pairFaqs,
  pairHeading,
  pairIntro,
  pairTitle,
  relatedPairs,
  resolveCompareSlug,
} from "@/lib/compare";
import { compareGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";

const ARCHIVE = "public, s-maxage=86400, stale-while-revalidate=604800";

export const Route = createFileRoute("/compare/$slug")({
  headers: () => ({ "Cache-Control": ARCHIVE }),
  beforeLoad: ({ params, context }) => {
    const source = context.directory
      ? { apps: context.directory.apps, posts: context.directory.posts }
      : undefined;
    const hit = resolveCompareSlug(params.slug, source);
    if (hit.status === "redirect") throw redirect({ href: hit.to, statusCode: 308 });
    if (hit.status === "hub") throw redirect({ href: "/compare", statusCode: 308 });
    if (hit.status === "missing") throw notFound();
  },
  component: ComparePage,
  head: ({ params, matches }) => {
    const directory = matches[0]?.context.directory;
    const source = directory ? { apps: directory.apps, posts: directory.posts } : undefined;
    const hit = resolveCompareSlug(params.slug, source);
    if (hit.status !== "ok") {
      const missing = buildMetadata({
        title: pageCopy.notFound.title,
        description: pageCopy.notFound.description,
        path: `/compare/${params.slug}`,
        origin: originFrom(matches),
        noindex: true,
      });
      return { meta: missing.meta, links: missing.links };
    }
    const origin = originFrom(matches);
    const description = pairIntro(hit.pair);
    const seo = buildMetadata({
      title: pairTitle(hit.pair),
      description,
      path: `/compare/${hit.pair.slug}`,
      origin,
    });
    const script = jsonLdScript(compareGraph(origin, hit.pair, pairFaqs(hit.pair)));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, `/compare/${hit.pair.slug}`)],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function ComparePage() {
  const { slug } = Route.useParams();
  const { directory } = Route.useRouteContext();
  const source = directory ? { apps: directory.apps, posts: directory.posts } : undefined;
  const hit = resolveCompareSlug(slug, source);
  if (hit.status !== "ok") return null;
  const { pair } = hit;
  const faqs = pairFaqs(pair);
  const related = relatedPairs(pair, source);
  return (
    <main>
      <article className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link to="/" className="hover:text-ink">
            Home
          </Link>
          <span>/</span>
          <Link to="/compare" className="hover:text-ink">
            Comparisons
          </Link>
          <span>/</span>
          <span>{pairHeading(pair)}</span>
        </nav>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">{pairHeading(pair)}</h1>
        <p className="mt-5 text-[16px] leading-relaxed text-body">{pairIntro(pair)}</p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <AppCard app={pair.left} />
          <AppCard app={pair.right} />
        </div>
        <p className="mt-6 text-sm text-muted">
          Named in{" "}
          {pair.guides.map((guide, index) => (
            <span key={guide.slug}>
              {index > 0 ? " and " : null}
              <Link to="/blog/$slug" params={{ slug: guide.slug }} className="text-ink underline underline-offset-2">
                {guide.title}
              </Link>
            </span>
          ))}
          .
        </p>
        {related.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-ink">Related comparisons</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    to="/compare/$slug"
                    params={{ slug: item.slug }}
                    className="inline-block rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:bg-surface"
                  >
                    {pairHeading(item)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className="mt-14 border-t border-line pt-8">
          <h2 className="font-display text-2xl font-semibold text-ink">FAQ</h2>
          <div className="mt-4 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="text-[16px] font-semibold text-ink">{faq.q}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-body">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
