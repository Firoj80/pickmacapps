import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppGrid } from "@/components/app-grid";
import { OgPreviewModal } from "@/components/og-preview-modal";
import { AppleMark } from "@/components/site-header";
import { apps, posts, shelfApps } from "@/lib/catalog";
import { homeGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { site } from "@/lib/site";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { q?: string; cat?: string } => {
    const next: { q?: string; cat?: string } = {};
    if (typeof search.q === "string" && search.q) next.q = search.q;
    if (typeof search.cat === "string" && search.cat && search.cat !== "all") next.cat = search.cat;
    return next;
  },
  component: Home,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const search = matches.at(-1)?.search as { q?: string; cat?: string } | undefined;
    const filtered = Boolean(search?.q || (search?.cat && search.cat !== "all"));
    const seo = buildMetadata({
      title: site.title,
      description: site.description,
      path: "/",
      origin,
    });
    const directory = matches[0]?.context.directory;
    const list = directory?.apps ?? apps;
    const script = jsonLdScript(homeGraph(origin, filtered ? null : shelfApps(list)));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function Home() {
  const { q = "", cat = "all" } = Route.useSearch();
  const navigate = useNavigate();
  const { directory } = Route.useRouteContext();
  const list = directory?.apps ?? apps;
  const guideList = directory?.posts ?? posts;
  const [lead, side] = guideList;
  const [ogOpen, setOgOpen] = useState(false);

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
          <button
            type="button"
            onClick={() => setOgOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2/80 px-5 py-3 text-sm font-medium text-ink transition hover:bg-surface-2"
          >
            Preview social cards
          </button>
        </div>
      </section>

      <OgPreviewModal open={ogOpen} onClose={() => setOgOpen(false)} appList={list} />

      <div className="mx-auto w-full max-w-[1400px] px-5 py-10 md:px-10">
        <AppGrid
          apps={list}
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
