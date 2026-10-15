import { createFileRoute, Link } from "@tanstack/react-router";
import { posts } from "@/lib/catalog";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
  head: () => ({
    meta: [
      { title: "The PickMacApps Blog" },
      {
        name: "description",
        content: "Hand-researched guides to the best Mac apps.",
      },
    ],
  }),
});

function BlogIndex() {
  return (
    <main>
      <div className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
        <header className="mb-12">
          <h1 className="text-3xl font-[550] tracking-[-0.025em] text-ink sm:text-4xl">The PickMacApps Blog</h1>
          <p className="mt-4 text-lg leading-relaxed text-body">
            Hand-researched guides to the best Mac apps — comparing the tools everyone recommends, the
            ones worth paying for, and the hidden gems most lists miss.
          </p>
        </header>
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group block rounded-xl border border-line bg-surface p-6 transition-colors duration-200 hover:border-line-2 hover:bg-surface-2"
            >
              <div className="flex items-center gap-2 text-xs text-muted">
                <time dateTime={post.date}>{post.dateLabel}</time>
                <span>·</span>
                <span>{post.minutes} min read</span>
              </div>
              <h2 className="mt-2 text-xl font-[550] tracking-[-0.025em] text-ink">{post.title}</h2>
              <p className="mt-2 text-[0.975rem] leading-relaxed text-body">{post.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-line-2 bg-canvas px-2.5 py-1 text-xs font-medium text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
