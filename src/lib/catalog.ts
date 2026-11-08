import raw from "@/data/catalog.json";
import { normalizeCategorySlug } from "@/lib/shelf-categories";

export type Pricing = "free" | "paid" | "freemium";

export type FeaturedTier = "article" | "featured";

export type AppItem = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  icon: string;
  website: string;
  pricing: Pricing;
  category: string;
  categoryName: string;
  categoryIcon: string;
  featured: boolean;
  editorChoice?: boolean;
  featuredTier?: FeaturedTier | null;
  featuredUntil?: string | null;
  isHot?: boolean;
  isUserSubmitted?: boolean;
  views7d?: number;
  createdAt: string;
  updatedAt?: string;
  demo: string;
  related: string[];
};

export type HeroIcon = {
  title: string;
  slug: string;
  src: string;
  style: string;
  mobile: boolean;
};

export type CategoryInfo = {
  slug: string;
  name: string;
  emoji: string;
  paragraphs: string[];
  tips: string[];
};

export type TocItem = { id: string; label: string };

export type Post = {
  slug: string;
  title: string;
  h1?: string;
  excerpt: string;
  date: string;
  dateLabel: string;
  updatedAt?: string;
  minutes: number;
  tags: string[];
  toc: TocItem[];
  html: string;
  more: string[];
};

export type AltIcon = { name: string; src: string };

export type Alternative = {
  slug: string;
  name: string;
  icon: string;
  blurb: string;
  namesLine: string;
  extra: number;
  icons: AltIcon[];
  paragraphs: string[];
  appSlugs: string[];
};

export const apps = raw.apps as AppItem[];
export const hero = raw.hero as HeroIcon[];
export const categories = raw.categories as CategoryInfo[];
export const posts = raw.posts as Post[];
export const alternatives = raw.alternatives as Alternative[];
const shelfRank = new Map(apps.map((app, index) => [app.slug, index]));

const priceRank: Record<string, number> = { free: 0, freemium: 1, paid: 2 };

export const pricingLabel: Record<Pricing, string> = {
  free: "Free",
  paid: "Paid",
  freemium: "Freemium",
};

export const pricingClass: Record<Pricing, string> = {
  free: "bg-accent/10 text-accent ring-accent/25",
  paid: "bg-amber-800/10 text-amber-900 ring-amber-800/20 dark:text-amber-200",
  freemium: "bg-stone-500/10 text-stone-700 ring-stone-500/20 dark:text-stone-300",
};

export function addedLabel(iso: string, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const days = Math.floor((now - t) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function pinRank(slug: string) {
  return shelfRank.get(slug) ?? Number.POSITIVE_INFINITY;
}

export function sortApps(list: AppItem[], order: "newest" | "name" | "free") {
  const next = [...list];
  if (order === "name") next.sort((a, b) => a.name.localeCompare(b.name));
  else if (order === "free") {
    next.sort((a, b) => (priceRank[a.pricing] ?? 3) - (priceRank[b.pricing] ?? 3));
  } else {
    next.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name));
  }
  next.sort((a, b) => {
    const ap = pinRank(a.slug);
    const bp = pinRank(b.slug);
    const aPinned = Number.isFinite(ap);
    const bPinned = Number.isFinite(bp);
    if (aPinned && bPinned) return ap - bp;
    if (aPinned) return -1;
    if (bPinned) return 1;
    return 0;
  });
  return next;
}

export function isEditorChoice(app: AppItem) {
  return app.editorChoice === true;
}

export function featuredTierWeight(app: AppItem): number {
  if (!isEditorChoice(app)) return 0;
  if (app.featuredTier === "article") return 2; // Priority 1: Gold badge (Featured + Medium Article)
  return 1; // Priority 2: Blue badge (Featured Placement)
}

/**
 * Priority ranking on default / Hot shelf:
 * 1. Gold badge (weight 3)
 * 2. Blue badge (weight 2)
 * 3. Hot apps with fire icon (weight 1)
 * 4. Standard catalog apps (weight 0)
 */
export function appPriorityWeight(app: AppItem): number {
  if (isEditorChoice(app)) {
    return app.featuredTier === "article" ? 3 : 2;
  }
  if (app.isHot) return 1;
  return 0;
}

/**
 * Hero app icons logic for homepage hero section (capped at 6 apps):
 * Priority 1: Paid apps (Editor's Choice, sorted by featuredTier weight: Gold article first, then Blue featured).
 * If 6 paid apps are NOT available, then toggle/include the top Hot apps (isHot: true) to fill the remaining slots up to 6.
 * If 6 paid apps ARE available, only the paid apps are shown (no hot apps toggled).
 */
export function getHeroAppIcons(list: readonly AppItem[], max = 6): AppItem[] {
  const paidApps = [...list.filter((app) => isEditorChoice(app))].sort(
    (a, b) => featuredTierWeight(b) - featuredTierWeight(a),
  );

  // If 6 or more paid apps are available, use strictly the paid apps
  if (paidApps.length >= max) {
    return paidApps.slice(0, max);
  }

  // If 6 paid apps are not available, toggle on the top hot apps to fill the remaining slots
  const remainingSlots = max - paidApps.length;
  const paidSlugs = new Set(paidApps.map((a) => a.slug));

  const hotApps = list
    .filter((app) => app.isHot && !paidSlugs.has(app.slug))
    .sort((a, b) => {
      const vA = a.views7d ?? 0;
      const vB = b.views7d ?? 0;
      if (vB !== vA) return vB - vA;
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA || a.name.localeCompare(b.name);
    })
    .slice(0, remainingSlots);

  return [...paidApps, ...hotApps];
}

export function shelfApps(
  list: AppItem[] = apps,
  query = "",
  category = "all",
  order: "newest" | "name" | "free" = "newest",
) {
  const needle = query.trim().toLowerCase();
  const filtered = list.filter((app) => {
    const inCategory = category === "all" || normalizeCategorySlug(app.category) === normalizeCategorySlug(category);
    const matches =
      !needle || app.name.toLowerCase().includes(needle) || app.tagline.toLowerCase().includes(needle);
    return inCategory && matches;
  });
  return [...sortApps(filtered, order)].sort((a, b) => {
    const diff = appPriorityWeight(b) - appPriorityWeight(a);
    if (diff !== 0) return diff;
    return 0;
  });
}

const homeJobs: { id: string; title: string; line: string; slugs: string[]; guideHref?: string }[] = [
  {
    id: "screenshots",
    title: "Screenshots",
    line: "Capture, annotate, or record the screen.",
    slugs: ["shottr", "better-shot", "dejashot", "screen-charm", "screentoast", "boom"],
  },
  {
    id: "menu-bar",
    title: "Menu bar",
    line: "Menu bar icons and the notch.",
    slugs: ["clearbar", "lounge", "alcove", "notchdodo", "droppy"],
    guideHref: "/blog/best-bartender-alternative-mac",
  },
  {
    id: "clipboard",
    title: "Clipboard",
    line: "Clipboard history.",
    slugs: ["tucket", "clippio", "maclip"],
    guideHref: "/blog/best-clipboard-manager-mac",
  },
  {
    id: "voice",
    title: "Voice",
    line: "Dictation and transcription.",
    slugs: ["holdspeak", "precis", "voicera"],
  },
  {
    id: "writing",
    title: "Writing",
    line: "Notes and a focused draft.",
    slugs: ["anytype", "ia-writer"],
    guideHref: "/blog/best-notes-app-mac",
  },
  {
    id: "disk",
    title: "Disk",
    line: "Uninstall an app, or see what fills the disk.",
    slugs: ["scanmydisk", "mole", "plumby", "bytesweep"],
    guideHref: "/blog/best-mac-disk-space-analyzer",
  },
];

/** Editor’s Choice stays its own row. Every other app is grouped by job. */
export function homeGroups(list: AppItem[], order: "newest" | "name" | "free" = "newest") {
  const choice = [...list.filter(isEditorChoice)].sort((a, b) => featuredTierWeight(b) - featuredTierWeight(a));
  const rest = new Map(list.filter((app) => !isEditorChoice(app)).map((app) => [app.slug, app]));
  const groups = homeJobs.flatMap((job) => {
    const apps = sortApps(
      job.slugs.flatMap((slug) => {
        const app = rest.get(slug);
        if (!app) return [];
        rest.delete(slug);
        return [app];
      }),
      order,
    );
    return apps.length ? [{ id: job.id, title: job.title, line: job.line, guideHref: job.guideHref, apps }] : [];
  });
  if (rest.size) {
    groups.push({
      id: "more",
      title: "More",
      line: "Other apps on the shelf.",
      guideHref: undefined,
      apps: sortApps([...rest.values()], order),
    });
  }
  return { choice, groups };
}

export function getApp(slug: string) {
  return apps.find((app) => app.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function appsInCategory(slug: string) {
  return apps.filter((app) => app.category === slug);
}

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function getAlternative(slug: string) {
  return alternatives.find((item) => item.slug === slug);
}

export function alternativesForApp(slug: string) {
  return alternatives.filter((item) => item.slug === slug || item.appSlugs.includes(slug));
}

export function alternativesInCategory(categorySlug: string) {
  const slugs = new Set(apps.filter((app) => app.category === categorySlug).map((app) => app.slug));
  return alternatives.filter((item) => item.appSlugs.some((slug) => slugs.has(slug)));
}
