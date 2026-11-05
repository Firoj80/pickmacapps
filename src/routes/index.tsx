import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ScanMyDiskNote, featuresScanMyDisk } from "@/components/scanmydisk-note";
import { AppGrid } from "@/components/app-grid";
import { isEditorChoice, shelfApps, type AppItem } from "@/lib/catalog";
import { publishedApps } from "@/lib/app-seed";
import { normalizeCategorySlug, shelfCategories } from "@/lib/shelf-categories";
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

type HeroSort = "hot" | "new" | "trending";

function inHeroCategory(app: AppItem, category: string) {
  if (category === "all") return true;
  if (category === "pick") return isEditorChoice(app);
  return normalizeCategorySlug(app.category) === category;
}

function arrangeHero(list: readonly AppItem[], sort: HeroSort) {
  const next = [...list];
  if (sort === "new") {
    next.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name));
    return next;
  }
  if (sort === "trending") {
    next.sort(
      (a, b) => Number(isEditorChoice(b)) - Number(isEditorChoice(a)) || b.createdAt.localeCompare(a.createdAt),
    );
    return next;
  }
  return shelfApps(next);
}

function MacLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.05 12.536c-.03-3.02 2.463-4.47 2.575-4.54-1.404-2.052-3.59-2.333-4.365-2.365-1.858-.188-3.626 1.093-4.57 1.093-.944 0-2.4-1.067-3.945-1.037-2.03.03-3.9 1.18-4.945 3-2.108 3.653-.54 9.058 1.51 12.02 1.005 1.45 2.203 3.08 3.773 3.02 1.515-.06 2.09-.98 3.923-.98 1.83 0 2.352.98 3.955.95 1.635-.03 2.67-1.475 3.67-2.93 1.155-1.68 1.632-3.31 1.66-3.395-.036-.014-3.185-1.223-3.216-4.836zM14.02 3.61c.834-1.012 1.397-2.415 1.243-3.813-1.203.05-2.66.8-3.522 1.808-.775.895-1.454 2.325-1.27 3.696 1.34.104 2.71-.68 3.55-1.692z" />
    </svg>
  );
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { q?: string; cat?: string; sort?: HeroSort } => {
    const next: { q?: string; cat?: string; sort?: HeroSort } = {};
    if (typeof search.q === "string" && search.q) next.q = search.q;
    if (typeof search.cat === "string" && search.cat && search.cat !== "all") next.cat = search.cat;
    if (search.sort === "new" || search.sort === "trending") next.sort = search.sort;
    return next;
  },
  component: Home,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const search = matches.at(-1)?.search as { q?: string; cat?: string; sort?: HeroSort } | undefined;
    const filtered = Boolean(search?.q || (search?.cat && search.cat !== "all") || search?.sort);
    const seo = buildMetadata({
      title: homeTitle,
      description: homeDescription,
      path: "/",
      origin,
      imageAlt: homeImageAlt,
    });
    const directory = matches[0]?.context.directory;
    const list = publishedApps(directory);
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
  const { q = "", cat = "all", sort = "hot" } = Route.useSearch();
  const navigate = useNavigate();
  const { directory } = Route.useRouteContext();
  const list = publishedApps(directory);
  const chipCategories = directory?.categories?.length ? directory.categories : shelfCategories;
  const heroCategories = [
    { id: "all", label: "All" },
    { id: "pick", label: "Supply Pick" },
    ...chipCategories.map((item) => ({ id: item.slug, label: item.name })),
  ];
  const category = heroCategories.some((item) => item.id === cat) ? cat : "all";
  const shown = arrangeHero(
    list.filter((app) => inHeroCategory(app, category)),
    sort,
  );

  function updateSearch(next: { q?: string; cat?: string; sort?: HeroSort }) {
    navigate({
      to: "/",
      search: {
        q: next.q ?? q,
        cat: next.cat ?? cat,
        sort: next.sort ?? sort,
      },
    });
  }

  return (
    <main className="flex-1">
      <section className="px-4 pt-12 pb-8 sm:px-6 md:pt-20">
        <div className="mx-auto w-full max-w-[1200px]">
          <h1 className="max-w-5xl text-[42px] leading-[1.05] font-bold tracking-[-0.035em] text-ink md:text-[68px]">
            {homeH1.split("Mac")[0]}
            <MacLogo className="mx-0.5 inline h-[0.78em] w-[0.78em] -translate-y-[0.04em]" />
            Mac{homeH1.split("Mac")[1]}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-6 text-body md:text-lg md:leading-7">
            A curated shelf of hand-picked Mac apps.
          </p>
          <p className="mt-3 max-w-xl text-base leading-6 text-body md:text-lg md:leading-7">
            Browse the best Mac apps on this shelf by the job they do.
          </p>
          {directory ? null : (
            <p className="mt-4 max-w-xl text-sm text-muted">The app list could not be loaded. Try again in a moment.</p>
          )}
          {featuresScanMyDisk(list.map((app) => app.name)) ? (
            <div className="mt-6 max-w-xl">
              <ScanMyDiskNote />
            </div>
          ) : null}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="/#apps"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-canvas transition hover:opacity-90"
            >
              <MacLogo className="h-[15px] w-[15px]" />
              Browse the collection
            </a>
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-5 py-3 text-sm font-medium text-ink transition hover:bg-surface-2"
            >
              Submit an app
            </Link>
          </div>
          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="-mx-4 min-w-0 md:mx-0 md:flex-1">
              <div className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:px-0 [&::-webkit-scrollbar]:hidden">
                {heroCategories.map((item) => {
                  const active = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateSearch({ cat: item.id })}
                      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-normal tracking-[-0.016em] transition-colors ${
                        active
                          ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f]"
                          : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] dark:bg-white/10 dark:text-[#f5f5f7] dark:hover:bg-white/[0.16]"
                      }`}
                    >
                      {item.id === "pick" ? (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                          <path d="M12 2.2 14.7 8l6.3.6-4.8 4.1 1.5 6.1L12 15.8 6.3 18.8l1.5-6.1L3 8.6 9.3 8 12 2.2z" />
                        </svg>
                      ) : null}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="inline-flex h-9 shrink-0 items-center self-start rounded-full bg-[#e8e8ed] p-0.5 dark:bg-white/10 md:self-auto">
              {(
                [
                  ["hot", "Hot"],
                  ["new", "Latest"],
                  ["trending", "Trending"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => updateSearch({ sort: id })}
                  className={`h-8 rounded-full px-3.5 text-[13px] tracking-[-0.01em] transition-colors ${
                    sort === id
                      ? "bg-white font-medium text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.04)] dark:bg-[#1d1d1f] dark:text-white"
                      : "font-normal text-[#6e6e73] hover:text-[#1d1d1f] dark:text-[#a1a1a6] dark:hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:py-12">
        <AppGrid
          apps={shown}
          query={q}
          category="all"
          arranged
          filters="search"
          onQuery={(value) => updateSearch({ q: value })}
          onCategory={() => {}}
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