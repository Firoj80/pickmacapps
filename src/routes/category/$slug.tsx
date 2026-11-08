import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import { ScanMyDiskNote, featuresScanMyDisk } from "@/components/scanmydisk-note";
import { appPriorityWeight, posts } from "@/lib/catalog";
import { publishedApps } from "@/lib/app-seed";
import { categoryGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { findShelfCategory, normalizeCategorySlug } from "@/lib/shelf-categories";
import { pageCopy } from "@/lib/site";

function categoryFrom(
  directory: { categories?: { slug: string; name: string; emoji: string; paragraphs: string[]; tips: string[] }[] } | null | undefined,
  slug: string,
) {
  const staticCat = findShelfCategory(slug);
  const dbCat = directory?.categories?.find((item) => item.slug === slug);
  if (!staticCat && !dbCat) return null;

  // Prefer rich editorial paragraphs from static catalog if db has fallback boilerplate
  const isGeneric =
    !dbCat?.paragraphs ||
    dbCat.paragraphs.length <= 1 ||
    dbCat.paragraphs[0]?.includes("apps for Mac that are listed on PickMacApps");

  const paragraphs =
    !isGeneric && dbCat?.paragraphs && dbCat.paragraphs.length > 0
      ? dbCat.paragraphs
      : (staticCat?.paragraphs ?? dbCat?.paragraphs ?? []);

  const tips =
    staticCat?.tips && staticCat.tips.length > 1
      ? staticCat.tips
      : (dbCat?.tips ?? staticCat?.tips ?? []);

  const faqs = staticCat?.faqs ?? [];

  return {
    slug,
    name: dbCat?.name ?? staticCat?.name ?? slug,
    emoji: dbCat?.emoji || staticCat?.emoji || "📁",
    paragraphs,
    tips,
    faqs,
  };
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
    const rawListed = publishedApps(directory).filter((app) => normalizeCategorySlug(app.category) === slug);
    const listed = [...rawListed].sort((a, b) => {
      const diff = appPriorityWeight(b) - appPriorityWeight(a);
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || a.name.localeCompare(b.name);
    });

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
      title: `Best ${category.name} Mac Apps (2026) | PickMacApps`,
      description: category.paragraphs[0] ?? `${category.name} apps for Mac.`,
      ogTitle: `Best ${category.name} Mac Apps (2026) — Curated Shelf`,
      ogDescription: category.paragraphs[0] ?? `${category.name} apps for Mac.`,
      twitterTitle: `Best ${category.name} Mac Apps (2026) — Curated Shelf`,
      twitterDescription: category.paragraphs[0] ?? `${category.name} apps for Mac.`,
      path: `/category/${slug}`,
      origin,
    });
    const script = jsonLdScript(categoryGraph(origin, category, listed, category.faqs));
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

  const rawListed = publishedApps(directory).filter((app) => normalizeCategorySlug(app.category) === slug);
  const listed = [...rawListed].sort((a, b) => {
    const diff = appPriorityWeight(b) - appPriorityWeight(a);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || a.name.localeCompare(b.name);
  });
  const label = category.name.toLowerCase();

  // Find related guides mentioning this category or apps in it
  const allGuides = directory?.posts ?? posts;
  const categoryGuides = allGuides
    .filter((post) => {
      const hay = `${post.title} ${post.excerpt} ${post.html}`.toLowerCase();
      return hay.includes(label) || listed.some((app) => hay.includes(app.name.toLowerCase()));
    })
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:py-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted">
          <Link to="/" className="hover:text-ink transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-body font-medium">{category.name} Mac Apps</span>
        </nav>

        {/* Hero Header */}
        <header className="border-b border-line pb-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
              <span>Curated Shelf</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Updated for macOS Sequoia & Apple Silicon</span>
            </span>
          </div>

          <h1 className="mt-4 font-display text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-ink">
            Best {category.name} Mac Apps (2026)
          </h1>

          <div className="mt-5 max-w-3xl space-y-3 text-[15px] leading-relaxed text-body sm:text-base">
            {category.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-muted">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink text-sm">{listed.length}</span>
              <span>Curated Apps</span>
            </div>
            <span className="hidden sm:inline text-line">•</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">100%</span>
              <span>Apple Gatekeeper Notarized</span>
            </div>
            <span className="hidden sm:inline text-line">•</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">Hand-Verified</span>
              <span>by Indie Devs</span>
            </div>
          </div>
        </header>

        {/* Apps Grid Section */}
        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
              {listed.length} {category.name} {listed.length === 1 ? "App" : "Apps"} on this Shelf
            </h2>
            <Link
              to="/compare"
              className="hidden text-xs font-medium text-muted hover:text-ink sm:inline-flex items-center gap-1"
            >
              Compare Apps Side-by-Side <span>→</span>
            </Link>
          </div>

          {listed.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-line p-12 text-center">
              <p className="text-base text-body">No {label} apps listed yet.</p>
              <p className="mt-1 text-xs text-muted">Are you developing an app in this category?</p>
              <Link
                to="/submit"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-canvas transition-colors hover:opacity-85"
              >
                Submit Your Mac App
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listed.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </section>

        {featuresScanMyDisk(listed.map((app) => app.name)) ? (
          <div className="mt-8">
            <ScanMyDiskNote />
          </div>
        ) : null}

        {/* Editorial Guide: What to look for */}
        {category.tips.length > 0 ? (
          <section className="mt-16 rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <span>📋 Buyer’s Checklist</span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              What to look for in Mac {category.name} apps in 2026
            </h2>
            <p className="mt-2 text-sm text-muted">
              Key evaluation standards we consider before approving {label} software to the PickMacApps directory:
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {category.tips.map((tip, index) => {
                const parts = tip.split(":");
                const title = parts.length > 1 ? parts[0] : `Criterion ${index + 1}`;
                const body = parts.length > 1 ? parts.slice(1).join(":") : tip;

                return (
                  <div
                    key={index}
                    className="flex flex-col gap-1.5 rounded-xl border border-line-2 bg-canvas p-4 text-sm"
                  >
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs text-accent">
                        ✓
                      </span>
                      <span>{title}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-body pl-7">{body.trim()}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Frequently Asked Questions (FAQ Section) */}
        {category.faqs.length > 0 ? (
          <section className="mt-16">
            <div className="text-center sm:text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Frequently Asked Questions
              </span>
              <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink sm:text-3xl">
                Mac {category.name} Apps: FAQs
              </h2>
              <p className="mt-1 text-sm text-body">
                Common questions regarding pricing, compatibility, and safety when choosing {label} utilities.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {category.faqs.map((faq, index) => (
                <details
                  key={index}
                  className="group rounded-xl border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-2 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-ink">
                    <span className="text-[15px] font-semibold">{faq.q}</span>
                    <span className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180">
                      ↓
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-body pt-2 border-t border-line/60">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        {/* Related Buying Guides */}
        {categoryGuides.length > 0 ? (
          <section className="mt-16 border-t border-line pt-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
                  Related Buying Guides & Deep Dives
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Editorial roundups featuring {label} apps tested on this shelf.
                </p>
              </div>
              <Link
                to="/blog"
                className="hidden text-xs font-medium text-muted hover:text-ink sm:inline-flex items-center gap-1"
              >
                All Guides <span>→</span>
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {categoryGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  to="/blog/$slug"
                  params={{ slug: guide.slug }}
                  className="group flex flex-col justify-between rounded-xl border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-2 hover:bg-surface-2"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-ink group-hover:text-accent line-clamp-2">
                      {guide.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-body line-clamp-3">
                      {guide.excerpt}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-muted">
                    <span>{guide.date}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform text-xs font-semibold">
                      Read guide →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Submit App CTA Banner */}
        <section className="mt-16 rounded-2xl border border-line bg-gradient-to-br from-surface to-surface-2 p-8 text-center sm:p-10">
          <span className="text-3xl">{category.emoji}</span>
          <h2 className="mt-3 font-display text-xl font-semibold text-ink sm:text-2xl">
            Built an indie Mac {category.name.toLowerCase()} app?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-body">
            PickMacApps is hand-curated and reviewed. Submit your Mac application for our editorial review and get discovered by thousands of Mac power users.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition-colors hover:opacity-85"
            >
              Submit an app for review
              <span className="text-xs">↗</span>
            </Link>
            <Link
              to="/compare"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
            >
              View Comparison Hub
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
