import knownDeletedAppsRaw from "@/data/known-deleted-apps.json";
import { findShelfCategory } from "@/lib/shelf-categories";

export interface DiscontinuedAppInfo {
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  categoryEmoji: string;
  isKnown: boolean;
}

const knownDeletedApps: Record<string, { name: string; category: string }> = knownDeletedAppsRaw;

function formatSlugToTitle(slug: string): string {
  if (!slug) return "Mac App";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function guessCategoryFromSlug(slug: string): string {
  const s = slug.toLowerCase();
  if (/(shot|screen|capture|photo|image|pic|cam)/.test(s)) return "photography";
  if (/(code|dev|git|terminal|debug|api|build)/.test(s)) return "dev";
  if (/(design|color|font|svg|icon|pixel|canvas)/.test(s)) return "design";
  if (/(write|note|text|type|mark|edit|doc)/.test(s)) return "writing";
  if (/(audio|sound|voice|music|mic|pod|listen|record)/.test(s)) return "audio";
  if (/(video|stream|movie|play|media|clip)/.test(s)) return "video";
  if (/(task|todo|focus|time|habit|cal|plan|work|flow)/.test(s)) return "productivity";
  if (/(ai|bot|prompt|gpt|llm|chat|agent)/.test(s)) return "ai";
  if (/(money|budget|pay|coin|crypto|finance|tax|wallet)/.test(s)) return "finance";
  return "utility";
}

export function getDiscontinuedAppInfo(
  slug: string,
  tombstones?: readonly { slug: string; name?: string; category?: string }[],
): DiscontinuedAppInfo {
  const cleanSlug = slug.trim().toLowerCase();

  // 1. Check database tombstones if passed
  if (tombstones && Array.isArray(tombstones)) {
    const tomb = tombstones.find((t) => t.slug === cleanSlug);
    if (tomb && (tomb.name || tomb.category)) {
      const cat = findShelfCategory(tomb.category || "utility");
      return {
        slug: cleanSlug,
        name: tomb.name || formatSlugToTitle(cleanSlug),
        category: cat?.slug || "utility",
        categoryName: cat?.name || "Utility",
        categoryEmoji: cat?.emoji || "🔧",
        isKnown: true,
      };
    }
  }

  // 2. Check pre-populated historical deleted apps dictionary
  const known = knownDeletedApps[cleanSlug];
  if (known) {
    const cat = findShelfCategory(known.category || "utility");
    return {
      slug: cleanSlug,
      name: known.name || formatSlugToTitle(cleanSlug),
      category: cat?.slug || "utility",
      categoryName: cat?.name || "Utility",
      categoryEmoji: cat?.emoji || "🔧",
      isKnown: true,
    };
  }

  // 3. Fallback: humanize slug and guess category
  const guessedCategory = guessCategoryFromSlug(cleanSlug);
  const cat = findShelfCategory(guessedCategory);
  return {
    slug: cleanSlug,
    name: formatSlugToTitle(cleanSlug),
    category: cat?.slug || "utility",
    categoryName: cat?.name || "Utility",
    categoryEmoji: cat?.emoji || "🔧",
    isKnown: false,
  };
}
