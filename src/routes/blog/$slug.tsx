import { createFileRoute, Link, notFound, useRouterState } from "@tanstack/react-router";
import { Missing } from "@/components/missing";
import { apps, getPost, posts } from "@/lib/catalog";
import { canonical, metaDescription, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  beforeLoad: ({ params }) => {
    if (!getPost(params.slug)) throw notFound();
  },
  component: BlogPost,
  notFoundComponent: () => <Missing title="Guide not found" body="That article isn't on the blog." />,
  head: ({ params, matches }) => {
    const post = getPost(params.slug);
    if (!post) {
      return { meta: [{ title: "Guide not found — PickMacApps" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: articleTitle(post.title) },
        { name: "description", content: metaDescription(post?.excerpt ?? "Mac app guide") },
      ],
      links: [canonical(originFrom(matches), `/blog/${params.slug}`)],
    };
  },
});

function BlogPost() {
  const { slug } = Route.useParams();
  const post = getPost(slug);
  if (!post) return null;
  const more = post.more
    .map((item) => posts.find((entry) => entry.slug === item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const haystack = `${post.title} ${post.excerpt} ${post.html}`.toLowerCase();
  const mentioned = apps.filter((app) => haystack.includes(app.name.toLowerCase())).slice(0, 8);

  const origin = originFrom(useRouterState({ select: (state) => state.matches }));
  const pageUrl = origin ? `${origin}/blog/${post.slug}` : "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: metaDescription(post.excerpt),
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "en",
    ...(pageUrl ? { url: pageUrl, mainEntityOfPage: pageUrl } : {}),
    author: { "@type": "Organization", name: "PickMacApps", ...(origin ? { url: origin } : {}) },
    publisher: { "@type": "Organization", name: "PickMacApps", ...(origin ? { url: origin } : {}) },
  };

  return (
    <main>
      <article className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
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
          <h1 className="font-display mt-3 text-4xl leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-5xl">
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
            <p className="mb-4 text-xs font-semibold tracking-wide text-muted uppercase">In this guide</p>
            <ol className="grid grid-cols-2 gap-x-4 gap-y-3">
              {post.toc.map((item, index) => (
                <li key={item.id} className={index === 0 || index === 3 || index >= 6 ? "col-span-2" : undefined}>
                  <a href={`#${item.id}`} className="flex items-baseline gap-2.5 text-sm leading-snug text-body transition-colors hover:text-ink">
                    <span className="w-5 shrink-0 text-xs text-faint tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div className="blog-body" dangerouslySetInnerHTML={{ __html: post.html }} />
        <section className="mt-12 border-t border-line pt-8">
          <h2 className="font-display text-2xl font-semibold text-ink">From the directory</h2>
          {mentioned.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {mentioned.map((app) => (
                <li key={app.slug}>
                  <Link to="/app/$slug" params={{ slug: app.slug }} className="text-[15px] text-ink underline underline-offset-2">
                    {app.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
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

function articleTitle(title: string) {
  const branded = `${title} — PickMacApps`;
  return branded.length <= 60 ? branded : title;
}
