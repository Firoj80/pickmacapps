import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ScanMyDiskNote, featuresScanMyDisk } from "@/components/scanmydisk-note";
import { AppGrid } from "@/components/app-grid";
import { featuredTierWeight, isEditorChoice, shelfApps, type AppItem } from "@/lib/catalog";
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
    next.sort((a, b) => {
      const diff = featuredTierWeight(b) - featuredTierWeight(a);
      if (diff !== 0) return diff;
      return b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name);
    });
    return next;
  }
  if (sort === "trending") {
    next.sort((a, b) => {
      const diff = featuredTierWeight(b) - featuredTierWeight(a);
      if (diff !== 0) return diff;
      return b.createdAt.localeCompare(a.createdAt);
    });
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

function ChoiceIcons({ apps }: { apps: AppItem[] }) {
  if (apps.length === 0) return null;
  // Dynamic curved arc fan-out: middle icons lifted higher, outward icons rotated and spread
  const count = apps.length;
  const mid = (count - 1) / 2;

  return (
    <div className="relative mt-4 flex items-center justify-center pt-2 pb-1">
      <div className="flex items-center justify-center">
        {apps.map((app, index) => {
          const offset = index - mid;
          // Arc calculation: lift center up, curve down on sides
          const translateY = Math.pow(Math.abs(offset), 1.35) * 4;
          const rotate = offset * 4.5;
          const zIndex = Math.round(50 - Math.abs(offset) * 2);

          return (
            <Link
              key={app.slug}
              to="/app/$slug"
              params={{ slug: app.slug }}
              title={app.name}
              style={{
                zIndex,
                marginLeft: index === 0 ? 0 : -14,
                transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
              }}
              className="group relative h-13 w-13 shrink-0 overflow-hidden rounded-[16px] bg-surface shadow-[0_8px_20px_rgba(0,0,0,0.14)] ring-2 ring-line transition-all duration-200 hover:!z-[99] hover:!-translate-y-2 hover:!rotate-0 hover:scale-110 hover:shadow-[0_16px_32px_rgba(0,0,0,0.25)] sm:h-15 sm:w-15 sm:rounded-[18px]"
            >
              <img
                alt={app.name}
                src={app.icon}
                onError={(event) => {
                  event.currentTarget.src = "/site-favicon.svg";
                }}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Home() {
  const { q = "", cat = "all", sort = "hot" } = Route.useSearch();
  const navigate = useNavigate();
  const { directory } = Route.useRouteContext();
  const list = publishedApps(directory);
  const chipCategories = directory?.categories?.length ? directory.categories : shelfCategories;
  const heroCategories = [
    { id: "all", label: "All Categories", emoji: "✨" },
    ...chipCategories.map((item) => ({ id: item.slug, label: item.name, emoji: item.emoji })),
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
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-line px-4 pt-8 pb-7 sm:px-6 md:pt-12 md:pb-10 hero-grid">
        <div className="mx-auto flex w-full max-w-[860px] flex-col items-center text-center">
          <h1 className="text-[30px] leading-[1.12] font-bold tracking-[-0.03em] text-ink sm:text-[40px] md:text-[46px]">
            {homeH1.split("Mac")[0]}
            <MacLogo className="mx-1 inline h-[0.76em] w-[0.76em] -translate-y-[0.06em]" />
            Mac{homeH1.split("Mac")[1]}
          </h1>
          <p className="mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-body sm:text-[16px] md:leading-6">
            A curated shelf of hand-picked Mac apps. Browse the best Mac apps on this shelf by the job they do.
          </p>

          {/* Curved app icons stack - ONLY Editor's Choice apps sorted by tier */}
          <div className="mt-3 w-full">
            <ChoiceIcons apps={[...list.filter((app) => isEditorChoice(app))].sort((a, b) => featuredTierWeight(b) - featuredTierWeight(a))} />
          </div>

          {directory ? null : (
            <p className="mt-2 text-sm text-muted">The app list could not be loaded. Try again in a moment.</p>
          )}
        </div>
      </section>

      {/* Filter and Content section */}
      <div className="mx-auto w-full max-w-[1360px] px-4 py-5 sm:px-6 lg:py-7">
        {/* Controls bar shifted to the RIGHT side */}
        <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
          {/* Category Dropdown with emoji icon */}
          <div className="relative">
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => updateSearch({ cat: e.target.value })}
              className="h-9 cursor-pointer appearance-none rounded-xl border border-line bg-surface pr-8 pl-3 text-[13.5px] font-medium text-ink shadow-sm transition-colors hover:border-line-2 focus-visible:border-accent focus-visible:outline-none"
            >
              {heroCategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.emoji ? `${item.emoji} ` : ""}{item.label}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {/* Sort Tabs */}
          <div className="inline-flex h-9 shrink-0 items-center rounded-xl bg-[#e8e8ed] p-0.5 dark:bg-white/10">
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
                className={`h-7.5 rounded-lg px-3 text-[12.5px] tracking-[-0.01em] transition-all ${
                  sort === id
                    ? "bg-white font-medium text-[#1d1d1f] shadow-sm dark:bg-[#1d1d1f] dark:text-white"
                    : "font-normal text-[#6e6e73] hover:text-[#1d1d1f] dark:text-[#a1a1a6] dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

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