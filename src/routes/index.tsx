import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppGrid } from "@/components/app-grid";
import { AppleMark } from "@/components/site-header";
import { apps, posts } from "@/lib/catalog";
import { canonical, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { q?: string; cat?: string } => {
    const next: { q?: string; cat?: string } = {};
    if (typeof search.q === "string" && search.q) next.q = search.q;
    if (typeof search.cat === "string" && search.cat && search.cat !== "all") next.cat = search.cat;
    return next;
  },
  component: Home,
  head: ({ matches }) => ({
    meta: [
      { title: "PickMacApps — Mac apps worth installing" },
      {
        name: "description",
        content: "A curated shelf of Mac apps. Browse by category, compare alternatives, and read short guides.",
      },
    ],
    links: [canonical(originFrom(matches), "/")],
  }),
});

function Home() {
  const { q = "", cat = "all" } = Route.useSearch();
  const navigate = useNavigate();
  const [lead, side] = posts;

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-[1400px] px-5 pt-12 pb-20 md:px-10 md:pt-20 md:pb-28">
        <h1 className="rise max-w-5xl text-[42px] leading-[1.05] font-bold tracking-[-0.035em] text-ink md:text-[76px]">
          A curated shelf of <span className="text-muted">hand-picked</span>{" "}
          <AppleMark className="mx-1 inline h-[0.78em] w-[0.78em] translate-y-[-0.04em]" />
          Mac apps.
        </h1>
        <div className="rise mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: "90ms" }}>
          <a
            href="#apps"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-canvas transition hover:opacity-90"
          >
            <AppleMark className="h-[15px] w-[15px]" />
            Browse the collection
          </a>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-5 py-3 text-sm font-medium text-ink transition hover:bg-surface-2"
          >
            Submit an app
          </Link>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1400px] px-5 py-10 md:px-10">
        <AppGrid
          apps={apps}
          query={q}
          category={cat}
          onQuery={(value) => navigate({ to: "/", search: { q: value, cat } })}
          onCategory={(value) => navigate({ to: "/", search: { q, cat: value }, hash: "apps" })}
        />

        {lead ? (
          <section className="rise mt-24 grid gap-10 border-t border-line pt-12 lg:grid-cols-2" style={{ animationDelay: "40ms" }}>
            <Link to="/blog/$slug" params={{ slug: lead.slug }} className="group block">
              <p className="text-sm text-muted">Guide</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink group-hover:opacity-70 sm:text-3xl">
                {lead.title}
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-body">{lead.excerpt}</p>
            </Link>
            {side ? (
              <Link to="/blog/$slug" params={{ slug: side.slug }} className="group block">
                <p className="text-sm text-muted">Guide</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink group-hover:opacity-70">
                  {side.title}
                </h2>
                <p className="mt-3 text-sm text-muted">{side.minutes} min read</p>
              </Link>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
