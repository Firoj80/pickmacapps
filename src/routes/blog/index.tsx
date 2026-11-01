import { createFileRoute } from '@tanstack/react-router'
import { GuideCard } from "@/components/guide-strip";
import { posts } from "@/lib/catalog";
import { guidesGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: pageCopy.guides.title,
      description: pageCopy.guides.description,
      path: "/blog",
      origin,
    });
    const directory = matches[0]?.context.directory;
    const script = jsonLdScript(guidesGraph(origin, directory?.posts ?? posts));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/blog")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function BlogIndex() {
  const { directory } = Route.useRouteContext();
  const list = directory?.posts ?? posts;
  return (
    <main>
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-6 flex items-center gap-5">
          <h1 className="shrink-0 text-[19px] font-[550] tracking-[-0.025em] text-ink">Guides to the best Mac apps</h1>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((post) => (
            <GuideCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </main>
  );
}
