import { createFileRoute, Link } from "@tanstack/react-router";
import { Missing } from "@/components/missing";
import { getPost, posts } from "@/lib/catalog";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPost,
  head: ({ params }) => {
    const post = getPost(params.slug);
    return {
      meta: [
        { title: post ? `${post.title} — PickMacApps` : "Guide not found — PickMacApps" },
        { name: "description", content: post?.excerpt ?? "Mac app guide" },
      ],
    };
  },
});

function BlogPost() {
  const { slug } = Route.useParams();
  const post = getPost(slug);
  if (!post) {
    return <Missing title="Guide not found" body="That article isn't on the blog." />;
  }
  const more = post.more
    .map((item) => posts.find((entry) => entry.slug === item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <main>
      <article className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
          <Link to="/" className="transition-colors hover:text-ink">
            Home
          </Link>
          <span>/</span>
          <Link to="/blog" className="transition-colors hover:text-ink">
            Blog
          </Link>
        </nav>
        <header>
          <div className="flex items-center gap-2 text-sm text-muted">
            <time dateTime={post.date}>{post.dateLabel}</time>
            <span>·</span>
            <span>{post.minutes} min read</span>
          </div>
          <h1 className="mt-3 text-3xl leading-tight font-[550] tracking-[-0.025em] text-ink sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-line-2 bg-surface px-2.5 py-1 text-xs font-medium text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>
        {post.toc.length > 0 ? (
          <nav className="mt-8 rounded-xl border border-line bg-surface p-5">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">In this guide</p>
            <ul className="space-y-2">
              {post.toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-sm text-body transition-colors hover:text-ink">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <div className="blog-body" dangerouslySetInnerHTML={{ __html: post.html }} />
        {more.length > 0 ? (
          <section className="mt-16 border-t border-line pt-10">
            <h2 className="mb-5 text-lg font-[550] tracking-[-0.025em] text-ink">Keep reading</h2>
            <div className="space-y-3">
              {more.map((item) => (
                <Link
                  key={item.slug}
                  to="/blog/$slug"
                  params={{ slug: item.slug }}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 transition-colors duration-200 hover:border-line-2 hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-[550] tracking-[-0.025em] text-ink">{item.title}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted">{item.excerpt}</p>
                  </div>
                  <span className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
