import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Missing } from "@/components/missing";
import { apps, getApp, pricingClass, pricingLabel, type AppItem } from "@/lib/catalog";

export const Route = createFileRoute("/app/$slug")({
  component: AppPage,
  head: ({ params }) => {
    const app = getApp(params.slug);
    return {
      meta: [
        { title: app ? `${app.name} — ${app.tagline}` : "App not found — PickMacApps" },
        { name: "description", content: app?.description.slice(0, 180) ?? "Mac app" },
      ],
    };
  },
});

function AppPage() {
  const { slug } = Route.useParams();
  const app = getApp(slug);

  useEffect(() => {
    const link = document.getElementById(`side-${slug}`);
    const nav = link?.closest("nav");
    if (!link || !nav) return;
    const linkTop = link.getBoundingClientRect().top;
    const navTop = nav.getBoundingClientRect().top;
    nav.scrollTop += linkTop - navTop - nav.clientHeight / 2 + link.clientHeight / 2;
  }, [slug]);

  if (!app) {
    return <Missing title="App not found" body="That Mac app isn't in the directory." />;
  }

  const related = app.related
    .map((item) => getApp(item))
    .filter((item): item is AppItem => Boolean(item));

  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
        <div className="flex gap-10 lg:gap-14">
          <aside className="hidden w-48 shrink-0 lg:block">
            <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <ul className="space-y-1">
                {apps.map((item) => {
                  const active = item.slug === app.slug;
                  return (
                    <li key={item.id}>
                      <Link
                        id={`side-${item.slug}`}
                        to="/app/$slug"
                        params={{ slug: item.slug }}
                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                          active
                            ? "bg-surface-2 font-semibold text-ink"
                            : "text-muted hover:bg-surface hover:text-ink"
                        }`}
                      >
                        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md">
                          <img alt="" src={item.icon} className="h-full w-full object-cover" />
                        </div>
                        <span className="truncate">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
          <article className="min-w-0 max-w-3xl flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-line sm:h-20 sm:w-20 sm:rounded-[20px]">
                  <img alt={app.name} src={app.icon} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-[550] tracking-[-0.025em] text-ink sm:text-2xl">{app.name}</h1>
                  <p className="mt-1 text-sm text-body sm:text-base">{app.tagline}</p>
                </div>
              </div>
              <a
                href={app.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden shrink-0 items-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:opacity-85 sm:inline-flex"
              >
                Try the app<span>↗</span>
              </a>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${pricingClass[app.pricing]}`}
              >
                {pricingLabel[app.pricing]}
              </span>
              <Link
                to="/category/$slug"
                params={{ slug: app.category }}
                className="rounded-md border border-line-2 bg-surface px-2.5 py-1 text-xs font-medium text-body transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {app.categoryIcon} {app.categoryName}
              </Link>
              <a
                href={app.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-canvas transition-colors hover:opacity-85 sm:hidden"
              >
                Try the app<span>↗</span>
              </a>
            </div>
            {app.demo ? (
              <div className="mt-10 overflow-hidden rounded-xl border border-line">
                {app.demo.endsWith(".mp4") ? (
                  <video src={app.demo} controls autoPlay muted loop playsInline className="w-full" />
                ) : (
                  <img
                    alt={`${app.name} screenshot`}
                    src={app.demo}
                    width="800"
                    height="500"
                    className="w-full object-cover"
                  />
                )}
              </div>
            ) : null}
            <div className="mt-10 text-base leading-[1.7] whitespace-pre-line text-body">{app.description}</div>
            {related.length > 0 ? (
              <section className="mt-16 border-t border-line pt-10">
                <h2 className="mb-5 text-lg font-[550] tracking-[-0.025em] text-ink">You might also like</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      to="/app/$slug"
                      params={{ slug: item.slug }}
                      className="group flex items-start gap-4 rounded-xl border border-line bg-surface p-4 transition-colors duration-200 hover:border-line-2 hover:bg-surface-2"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
                        <img alt="" src={item.icon} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-[550] tracking-[-0.025em] text-ink">{item.name}</h3>
                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium capitalize ring-1 ring-inset ${pricingClass[item.pricing]}`}
                          >
                            {pricingLabel[item.pricing]}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted">{item.tagline}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </article>
        </div>
      </div>
    </main>
  );
}
