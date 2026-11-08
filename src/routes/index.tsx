import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ScanMyDiskNote, featuresScanMyDisk } from "@/components/scanmydisk-note";
import { AppGrid } from "@/components/app-grid";
import { GuideStrip } from "@/components/guide-strip";
import { appPriorityWeight, featuredTierWeight, isEditorChoice, posts, shelfApps, type AppItem } from "@/lib/catalog";
import { publishedApps } from "@/lib/app-seed";
import { appIconUrl } from "@/lib/image-opt";
import { normalizeCategorySlug, shelfCategories } from "@/lib/shelf-categories";
import { homeGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";

const homeTitle = "PickMacApps — Beautifully designed macOS apps, curated";
const homeDescription =
  "A hand-picked shelf of beautifully designed macOS apps. Discover thoughtfully crafted tools, utilities, and indie software for your Mac.";
const homeImageAlt = "PickMacApps — Beautifully designed macOS apps, curated";
const homeH1 = "Beautifully designed Mac apps, curated";

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

type HeroSort = "hot" | "new" | "trending" | "free";

function inHeroCategory(app: AppItem, category: string) {
  if (category === "all") return true;
  if (category === "pick") return isEditorChoice(app);
  return normalizeCategorySlug(app.category) === category;
}

function arrangeHero(list: readonly AppItem[], sort: HeroSort) {
  const next = [...list];
  if (sort === "new") {
    // Latest/Newest: Featured apps on top, then Hot apps, then all latest added apps by createdAt desc
    next.sort((a, b) => {
      const pDiff = appPriorityWeight(b) - appPriorityWeight(a);
      if (pDiff !== 0) return pDiff;
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA || a.name.localeCompare(b.name);
    });
    return next;
  }
  if (sort === "trending") {
    // Trending: Featured apps on top, then Hot apps, then all most viewed apps in the last 7 days
    next.sort((a, b) => {
      const pDiff = appPriorityWeight(b) - appPriorityWeight(a);
      if (pDiff !== 0) return pDiff;
      const vA = a.views7d ?? 0;
      const vB = b.views7d ?? 0;
      if (vB !== vA) return vB - vA;
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA || a.name.localeCompare(b.name);
    });
    return next;
  }
  if (sort === "free") {
    // Free: Featured apps (if free) on top, then Hot apps, then latest free apps
    next.sort((a, b) => {
      const pDiff = appPriorityWeight(b) - appPriorityWeight(a);
      if (pDiff !== 0) return pDiff;
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA || a.name.localeCompare(b.name);
    });
    return next;
  }
  // Hot tab: Gold apps (1st), Blue apps (2nd), Hot 🔥 apps (3rd), then standard apps
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
    if (search.sort === "new" || search.sort === "trending" || search.sort === "hot" || search.sort === "free") next.sort = search.sort;
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
                src={appIconUrl(app.icon)}
                loading="eager"
                decoding="async"
                width={60}
                height={60}
                onError={(event) => {
                  if (event.currentTarget.src !== app.icon) {
                    event.currentTarget.src = app.icon;
                  } else {
                    event.currentTarget.src = "/site-favicon.svg";
                  }
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
    { id: "all", label: "All categories" },
    ...chipCategories.map((item) => ({ id: item.slug, label: item.name })),
  ];
  const category = heroCategories.some((item) => item.id === cat) ? cat : "all";
  const shown = arrangeHero(
    list.filter((app) => {
      if (!inHeroCategory(app, category)) return false;
      if (sort === "free" && app.pricing !== "free") return false;
      return true;
    }),
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
            A hand-picked shelf of beautifully designed macOS apps. Discover thoughtfully crafted tools, utilities, and indie software for your Mac.
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
      <div className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 lg:py-8">
        <AppGrid
          apps={shown}
          query={q}
          category={category}
          sort={sort}
          categories={heroCategories}
          arranged
          onQuery={(value) => updateSearch({ q: value })}
          onCategory={(value) => updateSearch({ cat: value })}
          onSort={(value) => updateSearch({ sort: value })}
        />

        <GuideStrip posts={directory?.posts ?? posts} />

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