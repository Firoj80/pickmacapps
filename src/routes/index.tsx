import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ScanMyDiskNote, featuresScanMyDisk } from "@/components/scanmydisk-note";
import { AppGrid } from "@/components/app-grid";
import { apps, shelfApps } from "@/lib/catalog";
import { homeGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";

const homeTitle = "Best Mac Apps (2026): Hand-Picked Utilities | PickMacApps";
const homeDescription =
  "Hand-picked best Mac apps for 2026. Browse utilities by job, compare alternatives side by side, and read short buying guides.";
const homeImageAlt = "PickMacApps: Best Mac Apps, Hand-Picked";
const homeH1 = "The Best Mac Apps, Hand-Picked";

const homeGuides = [
  { slug: "must-have-mac-apps-2026", label: "must-have Mac apps" },
  { slug: "best-free-mac-apps", label: "best free Mac apps" },
  { slug: "best-clipboard-manager-mac", label: "best clipboard manager" },
  { slug: "best-notes-app-mac", label: "best notes app" },
  { slug: "best-mac-disk-space-analyzer", label: "Mac disk space analyzer" },
  { slug: "best-appcleaner-alternative-mac", label: "AppCleaner alternative" },
  { slug: "best-notchnook-alternative-mac", label: "NotchNook alternative" },
  { slug: "best-bartender-alternative-mac", label: "Bartender alternative" },
  { slug: "best-notch-apps-mac", label: "notch apps" },
] as const;

const homeFaqs = [
  {
    q: "What is PickMacApps?",
    a: "PickMacApps is a directory of Mac apps kept by Firoj Alam. A listing is a name, a short description, a pricing label, and a link to the developer.",
  },
  {
    q: "How are apps chosen?",
    a: "Apps are added by hand. Editor’s Choice is a paid placement, capped at 3 published apps. It is not a test score. The price is the one on the submit page.",
  },
  {
    q: "Are the apps free?",
    a: "The directory includes free, freemium, and paid apps. The label on each card is the pricing model. A dollar price is shown only when that listing records one.",
  },
  {
    q: "How do I submit an app?",
    a: "Use the submit page. A free listing needs the PickMacApps badge on the app’s site before it is reviewed. Editor’s Choice does not need the badge. A listing is published only after it is reviewed.",
  },
];

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
      title: homeTitle,
      description: homeDescription,
      path: "/",
      origin,
      imageAlt: homeImageAlt,
    });
    const directory = matches[0]?.context.directory;
    const list = directory?.apps ?? apps;
    const script = jsonLdScript(
      homeGraph(origin, filtered ? null : shelfApps(list), homeFaqs, { name: homeH1, description: homeDescription }),
    );
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
  const fan = list.slice(0, 9);

  return (
    <main className="flex-1">
      <section className="hero-grid relative overflow-hidden border-b border-line px-4 py-12 text-center sm:px-6 lg:py-16">
        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-3xl leading-9 font-bold tracking-[-0.04em] text-ink md:text-5xl md:leading-none">
            {homeH1}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-6 text-body md:text-lg md:leading-7">
            A curated shelf of hand-picked Mac apps.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-base leading-6 text-body md:text-lg md:leading-7">
            Browse the best Mac apps on this shelf by the job they do.
          </p>
          {featuresScanMyDisk(list.map((app) => app.name)) ? (
            <div className="mx-auto mt-6 max-w-xl">
              <ScanMyDiskNote />
            </div>
          ) : null}
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

        <section className="mt-20">
          <div className="flex items-center gap-5">
            <h2 className="shrink-0 text-[19px] font-[550] tracking-[-0.025em] text-ink">Guides</h2>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
            <Link
              to="/blog"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-medium text-body transition-colors hover:border-line-2 hover:text-ink"
            >
              Read the blog
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {homeGuides.map((guide) => (
              <li key={guide.slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: guide.slug }}
                  className="text-[15px] font-medium text-ink underline underline-offset-2"
                >
                  {guide.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

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