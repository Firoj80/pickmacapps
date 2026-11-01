import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppGrid } from "@/components/app-grid";
import { GuideStrip } from "@/components/guide-strip";
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
    const script = jsonLdScript(homeGraph(origin, filtered ? null : shelfApps(list), homeFaqs));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

const homeFaqs = [
  {
    q: "What makes PickMacApps different from other Mac app directories?",
    a: "PickMacApps is personally curated by indie developer Firoj Alam. Every listed app is tested on physical Apple Silicon hardware for native speed, memory efficiency, transparent pricing, and privacy without forced subscriptions or bloated tracking.",
  },
  {
    q: "Are the Mac apps listed here free or paid?",
    a: "We feature free utilities, open-source software, freemium tools, and one-time paid apps. Each listing clearly marks pricing models (Free, Freemium, Paid Once, Subscription) so you never encounter hidden paywalls.",
  },
  {
    q: "How are Editor's Choice apps selected and vetted?",
    a: "Editor's Choice spots are limited to a maximum of 3 verified utilities at any time. Apps must pass our strict performance and utility review. Sponsored slots are explicitly disclosed in accordance with our editorial integrity guidelines.",
  },
  {
    q: "How can developers submit their Mac app for review?",
    a: "Developers can submit utilities via our submit page. Free listings require adding the PickMacApps badge to verify reciprocity. All submissions are manually evaluated before approval.",
  },
  {
    q: "Does PickMacApps use affiliate links or third-party ad trackers?",
    a: "No. We do not use third-party tracking cookies or affiliate links. Links take you directly to developer websites and official download sources.",
  },
];

function Home() {
  const { q = "", cat = "all" } = Route.useSearch();
  const navigate = useNavigate();
  const { directory } = Route.useRouteContext();
  const list = directory?.apps ?? apps;
  const guides = directory?.posts ?? posts;
  const fan = list.slice(0, 9);

  return (
    <main className="flex-1">
      <section className="hero-grid relative overflow-hidden border-b border-line px-4 py-12 text-center sm:px-6 lg:py-16">
        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-3xl leading-9 font-bold tracking-[-0.04em] text-ink md:text-5xl md:leading-none">
            The best Mac apps
            <br />
            worth installing.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-6 text-body md:text-lg md:leading-7">
            Skip the endless lists. A short shelf of useful Mac apps, picked by hand.
          </p>
          <div className="mt-10 hidden justify-center sm:flex" aria-label="Featured Mac apps">
            {fan.map((app, index) => {
              const mid = (fan.length - 1) / 2;
              const tilt = (index - mid) * 3;
              const lift = Math.abs(index - mid) * 4;
              return (
                <Link
                  key={app.id}
                  to="/app/$slug"
                  params={{ slug: app.slug }}
                  title={app.name}
                  style={{ transform: `translateY(${lift}px) rotate(${tilt}deg)` }}
                  className="group -mx-1.5 shrink-0 transition-transform duration-200 hover:z-10 sm:-mx-2"
                >
                  <span className="block transition-transform duration-200 group-hover:-translate-y-2 group-hover:scale-110">
                    <img alt="" src={app.icon} className="h-12 w-12 rounded-[22%] bg-surface object-cover shadow-lg shadow-black/15 ring-2 ring-canvas sm:h-14 sm:w-14" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16">
        <AppGrid
          apps={list}
          query={q}
          category={cat}
          onQuery={(value) => navigate({ to: "/", search: { q: value, cat } })}
          onCategory={(value) => navigate({ to: "/", search: { q, cat: value }, hash: "apps" })}
        />
        <GuideStrip posts={guides} />

        <section className="mt-20">
          <div className="flex items-center gap-5">
            <h2 className="shrink-0 text-[19px] font-[550] tracking-[-0.025em] text-ink">Questions</h2>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
            <Link to="/how-we-pick" className="text-[13px] font-medium text-body hover:text-ink">
              How we pick
            </Link>
          </div>
          <div className="mt-6 space-y-3">
            {homeFaqs.map((faq) => (
              <details key={faq.q} className="rounded-xl border border-line bg-surface px-5 py-4">
                <summary className="cursor-pointer text-[15px] font-medium text-ink">{faq.q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-body">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
