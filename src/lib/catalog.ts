import raw from "@/data/catalog.json";

export type Pricing = "free" | "paid" | "freemium";

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
  createdAt: string;
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
  excerpt: string;
  date: string;
  dateLabel: string;
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
export const editors = new Set<string>(raw.editors);
export const pinned = raw.pinned as string[];

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
  const i = pinned.indexOf(slug);
  return i === -1 ? Number.POSITIVE_INFINITY : i;
}

export function sortApps(list: AppItem[], order: "newest" | "name" | "free") {
  const next = [...list];
  if (order === "name") next.sort((a, b) => a.name.localeCompare(b.name));
  else if (order === "free") {
    next.sort((a, b) => (priceRank[a.pricing] ?? 3) - (priceRank[b.pricing] ?? 3));
  } else {
    next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
