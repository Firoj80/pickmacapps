import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Missing } from "@/components/missing";
import { getPost, posts } from "@/lib/catalog";
import { publishedApps } from "@/lib/app-seed";
import { ScanMyDiskNote, featuresScanMyDisk } from "@/components/scanmydisk-note";
import { getGuideEnhancement } from "@/lib/guide-enhancements";
import { guideGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";

export const Route = createFileRoute("/blog/$slug")({
  beforeLoad: ({ params, context }) => {
    const directory = context.directory;
    const found = directory ? directory.posts.some((post) => post.slug === params.slug) : Boolean(getPost(params.slug));
    if (!found) throw notFound();
  },
  component: BlogPost,
  notFoundComponent: () => <Missing title="Guide not found" body="That article isn't on the blog." />,
  head: ({ params, matches }) => {
    const directory = matches[0]?.context.directory;
    const post = directory ? directory.posts.find((item) => item.slug === params.slug) : getPost(params.slug);
    if (!post) {
      const missing = buildMetadata({
        title: pageCopy.notFound.title,
        description: pageCopy.notFound.description,
        path: `/blog/${params.slug}`,
        origin: originFrom(matches),
        noindex: true,
      });
      return { meta: missing.meta, links: missing.links };
    }
    const seo = buildMetadata({
      title: post.title,
      description: post.excerpt,
      path: `/blog/${params.slug}`,
      origin: originFrom(matches),
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.date,
    });
    const enhancement = getGuideEnhancement(post.slug, post.excerpt);
    const script = jsonLdScript(guideGraph(originFrom(matches), post, enhancement.faqs));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(originFrom(matches), `/blog/${params.slug}`)],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function BlogPost() {
  const { slug } = Route.useParams();
  const { directory } = Route.useRouteContext();
  const guideList = directory?.posts ?? posts;
  const appList = publishedApps(directory);
  const post = guideList.find((item) => item.slug === slug) ?? null;
  if (!post) return null;

  const enhancement = getGuideEnhancement(post.slug, post.excerpt);

  const primaryMore = (post.more || [])
    .map((item) => guideList.find((entry) => entry.slug === item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const backfill = guideList.filter((entry) => entry.slug !== post.slug && !primaryMore.some((m) => m.slug === entry.slug));
  const relatedGuides = [...primaryMore, ...backfill].slice(0, 3);

  const haystack = `${post.title} ${post.excerpt} ${post.html}`.toLowerCase();
  const mentioned = appList.filter((app) => haystack.includes(app.name.toLowerCase())).slice(0, 8);

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
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-xs font-bold text-canvas shadow-sm">
                FA
              </div>
              <div>
                <p className="text-xs text-muted">Written by</p>
                <Link to="/about" className="font-semibold text-ink hover:underline">
                  Firoj Alam
                </Link>
              </div>
            </div>
            <div className="text-right text-xs text-muted">
              <div>
                Published: <time dateTime={post.date}>{post.dateLabel}</time>
              </div>
              <div>
                Last updated: <time dateTime={post.date}>{post.dateLabel}</time>
              </div>
              <div>{post.minutes} min read</div>
            </div>
          </div>

          <h1 className="font-display mt-5 text-2xl sm:text-4xl lg:text-5xl leading-tight font-semibold tracking-[-0.03em] text-ink">
            {post.h1 ?? post.title}
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

        {/* Quick Answer / Key Takeaway box */}
        <section className="mt-8 rounded-2xl border border-accent/20 bg-accent/5 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent uppercase">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            Quick Answer & Key Recommendation
          </div>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-ink">
            {enhancement.quickAnswer}
          </p>
        </section>

        {/* Side-by-side compare callout */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 text-sm">
          <div>
            <p className="font-semibold text-ink">Want to compare specific Mac apps side by side?</p>
            <p className="text-xs text-muted">Explore feature matrices, pricing tiers, and performance on our comparison shelf.</p>
          </div>
          <Link
            to="/compare"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-ink px-4 py-2 text-xs font-medium text-canvas transition hover:opacity-90"
          >
            Compare shelf →
          </Link>
        </div>

        {post.toc.length > 0 ? (
          <nav className="mt-8 rounded-xl border border-line bg-surface p-5">
            <p className="mb-4 text-xs font-semibold tracking-wide text-muted uppercase">In this guide</p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
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

        {featuresScanMyDisk(mentioned.map((app) => app.name).concat(post.html.includes("ScanMyDisk") ? ["ScanMyDisk"] : [])) ? (
          <div className="mt-8">
            <ScanMyDiskNote />
          </div>
        ) : null}

        {/* Visible FAQ Section */}
        {enhancement.faqs.length > 0 ? (
          <section className="mt-14 border-t border-line pt-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Answers & Insights</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">Frequently Asked Questions</h2>
            <div className="mt-6 space-y-3">
              {enhancement.faqs.map((faq, index) => (
                <details
                  key={index}
                  className="group rounded-xl border border-line bg-surface p-5 transition-colors open:bg-surface-2"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-medium text-ink list-none">
                    <span className="text-[15px]">{faq.q}</span>
                    <span className="ml-4 shrink-0 text-muted transition group-open:rotate-180">
                      ↓
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-body">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

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

        {relatedGuides.length > 0 ? (
          <section className="mt-16 border-t border-line pt-10">
            <h2 className="mb-5 text-xl font-semibold tracking-[-0.025em] text-ink">Related Guides & Deep Dives</h2>
            <div className="space-y-3">
              {relatedGuides.map((item) => (
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
