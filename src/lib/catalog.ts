import raw from "@/data/catalog.json";
import { normalizeCategorySlug } from "@/lib/shelf-categories";

export type Pricing = "free" | "paid" | "freemium";

export type AppArchitecture = "universal" | "silicon";

export const MACOS_VERSION_OPTIONS = [
  { value: "", label: "All / Default (Sequoia, Sonoma & Ventura)" },
  { value: "25+", label: "macOS 25+" },
  { value: "26+", label: "macOS 26+" },
  { value: "27", label: "macOS 27" },
  { value: "15+", label: "macOS 15+ (Sequoia)" },
  { value: "14+", label: "macOS 14+ (Sonoma)" },
  { value: "13+", label: "macOS 13+ (Ventura)" },
] as const;

export const ARCHITECTURE_OPTIONS: { value: AppArchitecture; label: string }[] = [
  { value: "universal", label: "Universal (Apple Silicon & Intel)" },
  { value: "silicon", label: "Silicon Only" },
];

export function getAppArchitecture(app: { appleSilicon?: boolean; intelSupported?: boolean }): AppArchitecture {
  return app.appleSilicon !== false && app.intelSupported === false ? "silicon" : "universal";
}

export const MAX_GALLERY_IMAGES = 6;

/**
 * Extracts an 11-character YouTube video ID from watch, youtu.be, shorts, or embed URLs.
 */
export function parseYouTubeVideoId(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    let id = "";
    if (host === "youtu.be") {
      id = u.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") {
        id = u.searchParams.get("v") ?? "";
      } else {
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v") {
          id = parts[1] ?? "";
        }
      }
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function normalizeYouTubeUrl(rawUrl?: string | null): string {
  const id = parseYouTubeVideoId(rawUrl);
  return id ? `https://www.youtube.com/watch?v=${id}` : "";
}

export function sanitizeGalleryImages(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of input) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (!url) continue;
    if (!url.startsWith("/") && !/^https?:\/\//i.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= MAX_GALLERY_IMAGES) break;
  }
  return out;
}

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
  featuredAt?: string | null;
  featuredUntil?: string | null;
  isHot?: boolean;
  hotMarkedAt?: string | null;
  hotScheduledFor?: string | null;
  featuredScheduledFor?: string | null;
  isUserSubmitted?: boolean;
  views7d?: number;
  clickCount?: number;
  tryCount?: number;
  upvoteCount?: number;
  dashboardToken?: string | null;
  checkBadge?: boolean;
  xHandle?: string | null;
  isSeed?: boolean;
  createdAt: string;
  updatedAt?: string;
  demo: string;
  galleryImages?: string[];
  youtubeUrl?: string | null;
  related: string[];
  developerName?: string;
  price?: string | number;
  currency?: string;
  macosVersion?: string;
  appleSilicon?: boolean;
  intelSupported?: boolean;
  features?: string[];
  pros?: string[];
  cons?: string[];
  privacyPolicyUrl?: string;
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
export const seedSlugs = new Set(apps.map((a) => a.slug));

export function isSeedApp(app: AppItem): boolean {
  return Boolean(app.isSeed ?? seedSlugs.has(app.slug));
}

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

export function sortApps(list: AppItem[], order: "oldest" | "newest" | "name" | "free" = "oldest") {
  const next = [...list];
  if (order === "name") next.sort((a, b) => a.name.localeCompare(b.name));
  else if (order === "free") {
    next.sort((a, b) => (priceRank[a.pricing] ?? 3) - (priceRank[b.pricing] ?? 3));
  } else if (order === "newest") {
    next.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name));
  } else {
    next.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name));
  }
  // Active non-seeded apps (user-submitted + admin-added) MUST rank above starter seed apps
  next.sort((a, b) => {
    const aSeed = isSeedApp(a);
    const bSeed = isSeedApp(b);
    if (aSeed !== bSeed) {
      return aSeed ? 1 : -1;
    }
    if (aSeed && bSeed) {
      const ap = pinRank(a.slug);
      const bp = pinRank(b.slug);
      return ap - bp;
    }
    return 0;
  });
  return next;
}

export const FEATURED_APP_DURATION_DAYS = 7;

export function isEditorChoice(app: AppItem): boolean {
  if (app.editorChoice !== true) return false;
  if (app.featuredUntil) {
    const until = new Date(app.featuredUntil).getTime();
    if (!isNaN(until) && until <= Date.now()) {
      return false;
    }
  }
  return true;
}

export function isHotApp(app: AppItem): boolean {
  if (!app.isHot) return false;
  if (app.hotMarkedAt) {
    const markedAt = new Date(app.hotMarkedAt).getTime();
    if (!isNaN(markedAt) && markedAt + (HOT_APP_DURATION_DAYS * 24 * 60 * 60 * 1000) <= Date.now()) {
      return false;
    }
  }
  return true;
}

export function featuredTierWeight(app: AppItem): number {
  if (!isEditorChoice(app)) return 0;
  if (app.featuredTier === "article") return 2; // Priority 1: Gold badge (Featured + Medium Article)
  return 1; // Priority 2: Blue badge (Featured Placement)
}

/**
 * Returns the timestamp when the app was granted priority (featured or marked hot).
 * For featured apps: uses featuredAt if provided, or calculates start time from featuredUntil - 7 days, fallback to createdAt.
 * For hot apps: uses hotMarkedAt, fallback to createdAt.
 * Sorting priority apps by this timestamp ascending guarantees FIFO seniority:
 * First featured app stays #1; second featured app stays #2; when #1 expires, #2 takes #1 place!
 */
export function getPriorityTimestamp(app: AppItem): number {
  if (isEditorChoice(app)) {
    if (app.featuredAt) {
      const t = new Date(app.featuredAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (app.featuredUntil) {
      const t = new Date(app.featuredUntil).getTime();
      if (!isNaN(t) && t > 0) return t - (FEATURED_APP_DURATION_DAYS * 24 * 60 * 60 * 1000);
    }
    const t = new Date(app.createdAt).getTime();
    return isNaN(t) ? 0 : t;
  }
  if (isHotApp(app)) {
    if (app.hotMarkedAt) {
      const t = new Date(app.hotMarkedAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    const t = new Date(app.createdAt).getTime();
    return isNaN(t) ? 0 : t;
  }
  const t = new Date(app.createdAt).getTime();
  return isNaN(t) ? 0 : t;
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
  if (isHotApp(app)) return 1;
  return 0;
}

/**
 * Hero app icons logic for homepage hero section (capped at max 12 apps):
 * Priority 1: Paid apps (Editor's Choice, sorted by featuredTier weight: Gold article first, then Blue featured).
 * Within the same tier, strictly maintains FIFO order (oldest featured first).
 * If 12 paid apps are NOT available, then toggle/include the top Hot apps (isHot: true) to fill the remaining slots up to max, also in FIFO order.
 * If 12 paid apps ARE available, only the paid apps are shown (no hot apps toggled).
 */
export function getHeroAppIcons(list: readonly AppItem[], max = 12): AppItem[] {
  const paidApps = [...list.filter((app) => isEditorChoice(app))].sort((a, b) => {
    const wDiff = featuredTierWeight(b) - featuredTierWeight(a);
    if (wDiff !== 0) return wDiff;
    return getPriorityTimestamp(a) - getPriorityTimestamp(b) || a.name.localeCompare(b.name);
  });

  // If max or more paid apps are available, use strictly the paid apps
  if (paidApps.length >= max) {
    return paidApps.slice(0, max);
  }

  // If max paid apps are not available, toggle on the top hot apps to fill the remaining slots
  const remainingSlots = max - paidApps.length;
  const paidSlugs = new Set(paidApps.map((a) => a.slug));

  const hotApps = list
    .filter((app) => isHotApp(app) && !paidSlugs.has(app.slug))
    .sort((a, b) => {
      return getPriorityTimestamp(a) - getPriorityTimestamp(b) || a.name.localeCompare(b.name);
    })
    .slice(0, remainingSlots);

  return [...paidApps, ...hotApps];
}

export function shelfApps(
  list: AppItem[] = apps,
  query = "",
  category = "all",
  order: "oldest" | "newest" | "name" | "free" = "oldest",
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
    // For featured and hot apps: strict FIFO order (earliest featured/hot first)
    if (appPriorityWeight(a) > 0) {
      return getPriorityTimestamp(a) - getPriorityTimestamp(b) || a.name.localeCompare(b.name);
    }
    // For standard apps: active non-seeded apps always rank above starter seed apps
    const aSeed = isSeedApp(a);
    const bSeed = isSeedApp(b);
    if (aSeed !== bSeed) {
      return aSeed ? 1 : -1;
    }
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
    slugs: ["mole", "plumby", "bytesweep"],
    guideHref: "/blog/best-mac-disk-space-analyzer",
  },
];

/** Editor’s Choice stays its own row. Every other app is grouped by job. */
export function homeGroups(list: AppItem[], order: "oldest" | "newest" | "name" | "free" = "oldest") {
  const choice = [...list.filter(isEditorChoice)].sort((a, b) => {
    const diff = featuredTierWeight(b) - featuredTierWeight(a);
    if (diff !== 0) return diff;
    return getPriorityTimestamp(a) - getPriorityTimestamp(b) || a.name.localeCompare(b.name);
  });
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

/** Maximum active slots for Hot apps */
export const MAX_HOT_SLOTS = 6;

/** Hot tag active duration in days before automated expiry */
export const HOT_APP_DURATION_DAYS = 7;

export function getHotDaysRemaining(
  hotMarkedAt?: string | null,
  createdAt?: string | null,
): { daysLeft: number; expiry: Date; formatted: string } {
  const marked = new Date(hotMarkedAt || createdAt || Date.now());
  const expiry = new Date(marked.getTime() + HOT_APP_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const msLeft = expiry.getTime() - Date.now();
  const daysLeft = msLeft <= 0 ? 0 : Math.min(HOT_APP_DURATION_DAYS, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  const formatted = expiry.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { daysLeft, expiry, formatted };
}

export type SidebarRecentDuration = "24h" | "7d" | "15d" | "30d" | "all";

export type SidebarSettings = {
  enabled: boolean;
  duration: SidebarRecentDuration;
};

export function getSidebarCutoff(duration: SidebarRecentDuration, now = Date.now()): number {
  switch (duration) {
    case "24h":
      return now - 24 * 60 * 60 * 1000;
    case "7d":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "15d":
      return now - 15 * 24 * 60 * 60 * 1000;
    case "30d":
      return now - 30 * 24 * 60 * 60 * 1000;
    case "all":
      return 0;
    default:
      return now - 24 * 60 * 60 * 1000;
  }
}

export function formatSidebarRelativeTime(dateStr?: string | Date | null, now = Date.now()): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const ms = d.getTime();
    if (isNaN(ms)) return "";
    const diffSec = Math.floor((now - ms) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
