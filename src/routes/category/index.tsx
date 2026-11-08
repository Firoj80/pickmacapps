import { createFileRoute, Link } from "@tanstack/react-router";
import { publishedApps } from "@/lib/app-seed";
import { categoriesHubGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { normalizeCategorySlug, shelfCategories } from "@/lib/shelf-categories";
import { pageCopy } from "@/lib/site";

export const Route = createFileRoute("/category/")({
  component: CategoriesHubPage,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: pageCopy.categories.title,
      description: pageCopy.categories.description,
      ogTitle: "Browse macOS Apps by Category — PickMacApps",
      ogDescription: pageCopy.categories.description,
      twitterTitle: "Browse macOS Apps by Category — PickMacApps",
      twitterDescription: pageCopy.categories.description,
      path: "/category",
      origin,
    });
    const script = jsonLdScript(categoriesHubGraph(origin, shelfCategories));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/category")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function CategoriesHubPage() {
  const { directory } = Route.useRouteContext();
  const allApps = publishedApps(directory);
  const categories = directory?.categories ?? shelfCategories;

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted">
          <Link to="/" className="transition-colors hover:text-ink">
            Home
          </Link>
          <span>/</span>
          <span className="text-body font-medium">Browse by category</span>
        </nav>

        {/* Hero Header matching Macapp Supply sitelink standard */}
        <header className="border-b border-line pb-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
              <span>🗂️</span>
              <span>Catalog Index</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{allApps.length} Verified Mac Apps</span>
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl lg:text-5xl">
            Browse by category.
          </h1>

          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-body sm:text-base">
            Every macOS app on the shelf, sorted into categories. Discover thoughtfully crafted tools, lightweight utilities, and indie software for your Mac.
          </p>
        </header>

        {/* Categories Grid */}
        <section className="mt-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const categorySlug = normalizeCategorySlug(category.slug);
              const appsInCategory = allApps.filter(
                (app) => normalizeCategorySlug(app.category) === categorySlug,
              );
              const previewApps = appsInCategory.slice(0, 3);

              return (
                <Link
                  key={category.slug}
                  to="/category/$slug"
                  params={{ slug: categorySlug }}
                  className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 transition-all duration-200 hover:border-accent/40 hover:bg-surface-2 hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl" aria-hidden="true">
                          {category.emoji}
                        </span>
                        <h2 className="font-semibold text-ink group-hover:text-accent transition-colors">
                          {category.name}
                        </h2>
                      </div>
                      <span className="rounded-full border border-line bg-canvas px-2.5 py-0.5 text-xs font-medium text-muted">
                        {appsInCategory.length} {appsInCategory.length === 1 ? "app" : "apps"}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-muted line-clamp-2">
                      {category.paragraphs?.[0] || `${category.name} apps for Mac.`}
                    </p>
                  </div>

                  {previewApps.length > 0 ? (
                    <div className="mt-5 border-t border-line/60 pt-3">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                        Featured on shelf:
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {previewApps.map((app) => (
                          <div
                            key={app.id}
                            title={app.name}
                            className="relative h-7 w-7 overflow-hidden rounded-lg ring-1 ring-line/80 bg-surface"
                          >
                            <img
                              alt={app.name}
                              src={app.icon}
                              onError={(e) => {
                                e.currentTarget.src = "/site-favicon.svg";
                              }}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                        {appsInCategory.length > 3 ? (
                          <span className="text-[11px] text-muted font-medium">
                            +{appsInCategory.length - 3} more
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 border-t border-line/60 pt-3 text-[11px] text-muted">
                      No apps listed yet
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs font-semibold text-accent pt-1">
                    <span>Explore {category.name} apps</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Bottom Banner */}
        <section className="mt-16 rounded-2xl border border-line bg-surface p-8 text-center sm:p-10">
          <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
            Looking to compare specific apps?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-body">
            Check out our side-by-side comparison matrix covering pricing, native Apple Silicon support, and offline privacy features.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/compare"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold text-canvas transition-colors hover:opacity-85"
            >
              Open Comparison Hub <span>→</span>
            </Link>
            <Link
              to="/submit"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-5 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-surface-2"
            >
              Submit an app for review
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
