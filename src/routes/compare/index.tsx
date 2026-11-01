import { createFileRoute, Link } from "@tanstack/react-router";
import { comparePairs, hubFaqs, hubIntro, hubTitle, pairHeading } from "@/lib/compare";
import { pricingLabel } from "@/lib/catalog";
import { compareHubGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";

const ARCHIVE = "public, s-maxage=86400, stale-while-revalidate=604800";

export const Route = createFileRoute("/compare/")({
  headers: () => ({ "Cache-Control": ARCHIVE }),
  component: CompareHub,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const directory = matches[0]?.context.directory;
    const pairs = directory ? comparePairs({ apps: directory.apps, posts: directory.posts }) : comparePairs();
    const description = hubIntro(pairs);
    const seo = buildMetadata({
      title: hubTitle(pairs.length),
      description,
      path: "/compare",
      origin,
    });
    const script = jsonLdScript(
      compareHubGraph(
        origin,
        pairs.map((pair) => ({ name: pairHeading(pair), slug: pair.slug })),
        hubFaqs(pairs),
      ),
    );
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/compare")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function CompareHub() {
  const { directory } = Route.useRouteContext();
  const pairs = directory ? comparePairs({ apps: directory.apps, posts: directory.posts }) : comparePairs();
  const faqs = hubFaqs(pairs);
  return (
    <main>
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16">
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
          <Link to="/" className="hover:text-ink">
            Home
          </Link>
          <span>/</span>
          <span>Comparisons</span>
        </nav>
        <h1 className="font-display text-5xl font-semibold tracking-[-0.04em] text-ink">Comparisons</h1>
        <p className="mt-5 text-[16px] leading-relaxed text-body">{hubIntro(pairs)}</p>
        <ol className="mt-10 space-y-4">
          {pairs.map((pair) => (
            <li key={pair.slug}>
              <Link to="/compare/$slug" params={{ slug: pair.slug }} className="text-[17px] font-medium text-ink underline underline-offset-2">
                {pairHeading(pair)}
              </Link>
              <p className="mt-1 text-sm text-muted">
                {pair.left.pricing === pair.right.pricing
                  ? `Both are ${pricingLabel[pair.left.pricing]}.`
                  : `${pair.left.name} is ${pricingLabel[pair.left.pricing]}. ${pair.right.name} is ${pricingLabel[pair.right.pricing]}.`}
              </p>
            </li>
          ))}
        </ol>
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
      </section>
    </main>
  );
}
