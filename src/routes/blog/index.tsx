import { createFileRoute, Link } from "@tanstack/react-router";
import { posts } from "@/lib/catalog";
import { canonical, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
  head: ({ matches }) => ({
    meta: [
      { title: "Guides — PickMacApps" },
      {
        name: "description",
        content: "Hand-researched guides to the best Mac apps.",
      },
    ],
    links: [canonical(originFrom(matches), "/blog")],
  }),
});

function BlogIndex() {
  return (
    <main>
      <div className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
        <header className="mb-10">
          <p className="text-[12px] font-semibold tracking-[0.16em] text-accent uppercase">Guides</p>
          <h1 className="font-display mt-3 text-5xl font-semibold tracking-[-0.04em] text-ink">Guides</h1>
        </header>
        <div className="space-y-8">
          {posts.map((post, index) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className={index === 0 ? "block border-b border-line pb-8" : "block"}
            >
              <p className="text-[12.5px] text-muted">
                <time dateTime={post.date}>{post.dateLabel}</time>
                <span> · {post.minutes} min</span>
              </p>
              <h2 className={`font-display mt-2 font-semibold tracking-[-0.03em] text-ink ${index === 0 ? "text-4xl" : "text-2xl"}`}>
                {post.title}
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-body">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
