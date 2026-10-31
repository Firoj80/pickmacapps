import { apps, posts, pricingLabel, type AppItem, type Post } from "@/lib/catalog";

/** A guide is a comparison source when it names between 2 and 5 catalog apps. */
export const COMPARE_GROUP_MIN = 2;
export const COMPARE_GROUP_MAX = 5;
/** One app can appear in at most this many comparison pages. */
export const COMPARE_PAIR_CAP = 3;

export type ComparePair = {
  slug: string;
  left: AppItem;
  right: AppItem;
  guides: Post[];
  groupSize: number;
};

export type CompareHit =
  | { status: "ok"; pair: ComparePair }
  | { status: "redirect"; to: string }
  | { status: "hub" }
  | { status: "missing" };

function appsNamedIn(post: Post, list: AppItem[]) {
  const html = post.html.toLowerCase();
  return list.filter((app) => html.includes(app.name.toLowerCase()));
}

function pairSlug(left: string, right: string) {
  const [a, b] = [left, right].sort((x, y) => x.localeCompare(y));
  return `${a}-vs-${b}`;
}

/**
 * The only gate for comparison pages. Routes, the sitemap, the hub, and
 * related links all call this. Guides outside the size range are not a source.
 */
export function comparePairs(source?: { apps: AppItem[]; posts: Post[] }): ComparePair[] {
  const list = source?.apps ?? apps;
  const guideList = source?.posts ?? posts;
  const found = new Map<string, { left: AppItem; right: AppItem; guides: Post[]; groupSize: number }>();
  for (const post of guideList) {
    const named = appsNamedIn(post, list);
    if (named.length < COMPARE_GROUP_MIN || named.length > COMPARE_GROUP_MAX) continue;
    for (let i = 0; i < named.length; i += 1) {
      for (let j = i + 1; j < named.length; j += 1) {
        const [left, right] = [named[i], named[j]].sort((a, b) => a.slug.localeCompare(b.slug));
        const slug = pairSlug(left.slug, right.slug);
        const existing = found.get(slug);
        if (existing) {
          if (!existing.guides.some((guide) => guide.slug === post.slug)) existing.guides.push(post);
          existing.groupSize = Math.min(existing.groupSize, named.length);
        } else {
          found.set(slug, { left, right, guides: [post], groupSize: named.length });
        }
      }
    }
  }

  const used = new Map<string, number>();
  const kept: ComparePair[] = [];
  const ranked = [...found.entries()].sort((a, b) => {
    if (a[1].groupSize !== b[1].groupSize) return a[1].groupSize - b[1].groupSize;
    return a[0].localeCompare(b[0]);
  });
  for (const [slug, item] of ranked) {
    const leftCount = used.get(item.left.slug) ?? 0;
    const rightCount = used.get(item.right.slug) ?? 0;
    if (leftCount >= COMPARE_PAIR_CAP || rightCount >= COMPARE_PAIR_CAP) continue;
    used.set(item.left.slug, leftCount + 1);
    used.set(item.right.slug, rightCount + 1);
    kept.push({ slug, left: item.left, right: item.right, guides: item.guides, groupSize: item.groupSize });
  }
  kept.sort((a, b) => a.slug.localeCompare(b.slug));
  return kept;
}

export function comparePair(slug: string, source?: { apps: AppItem[]; posts: Post[] }) {
  return comparePairs(source).find((pair) => pair.slug === slug);
}

export function parseCompareSlug(slug: string) {
  const parts = slug.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { left: parts[0], right: parts[1] };
}

export function resolveCompareSlug(slug: string, source?: { apps: AppItem[]; posts: Post[] }): CompareHit {
  const parsed = parseCompareSlug(slug);
  if (!parsed) return { status: "missing" };
  const list = source?.apps ?? apps;
  const left = list.find((app) => app.slug === parsed.left);
  const right = list.find((app) => app.slug === parsed.right);
  if (!left || !right || left.slug === right.slug) return { status: "missing" };
  const canonical = pairSlug(left.slug, right.slug);
  if (slug !== canonical) return { status: "redirect", to: `/compare/${canonical}` };
  const pair = comparePair(canonical, source);
  if (!pair) return { status: "hub" };
  return { status: "ok", pair };
}

export function relatedPairs(pair: ComparePair, source?: { apps: AppItem[]; posts: Post[] }) {
  return comparePairs(source).filter(
    (other) =>
      other.slug !== pair.slug &&
      (other.left.slug === pair.left.slug ||
        other.right.slug === pair.right.slug ||
        other.left.slug === pair.right.slug ||
        other.right.slug === pair.left.slug),
  );
}

export function pairLastmod(pair: ComparePair) {
  return [pair.left.createdAt, pair.right.createdAt, ...pair.guides.map((guide) => guide.date)].sort().at(-1);
}

export function hubLastmod() {
  return comparePairs()
    .map((pair) => pairLastmod(pair) ?? "")
    .filter(Boolean)
    .sort()
    .at(-1);
}

export function pairHeading(pair: ComparePair) {
  return `${pair.left.name} vs ${pair.right.name}`;
}

export function pairTitle(pair: ComparePair) {
  return `${pairHeading(pair)} (2026)`;
}

export function pairIntro(pair: ComparePair) {
  const guideNames = pair.guides.map((guide) => guide.title).join(" and ");
  const newer = (pairLastmod(pair) ?? "").slice(0, 10);
  return `${pair.left.name} and ${pair.right.name} are the 2 Mac apps on this page. They are not ranked. ${guideNames} names both, and that guide names ${pair.groupSize} apps in total. ${pair.left.name} is ${pricingLabel[pair.left.pricing]}: ${pair.left.tagline} ${pair.right.name} is ${pricingLabel[pair.right.pricing]}: ${pair.right.tagline} The newer listing date is ${newer}.`;
}

export function pairFaqs(pair: ComparePair) {
  const guideNames = pair.guides.map((guide) => guide.title).join(" and ");
  return [
    {
      q: `Which apps are on this page?`,
      a: `${pair.left.name} and ${pair.right.name}. The page lists those 2 and no others.`,
    },
    {
      q: `Why are ${pair.left.name} and ${pair.right.name} compared?`,
      a: `${guideNames} names both. A comparison is published only when a guide names ${COMPARE_GROUP_MIN} to ${COMPARE_GROUP_MAX} apps, and each app is in at most ${COMPARE_PAIR_CAP} comparisons.`,
    },
    {
      q: "Are they ranked?",
      a: `No. ${pair.left.name} is ${pricingLabel[pair.left.pricing]} and ${pair.right.name} is ${pricingLabel[pair.right.pricing]}. The page does not score them.`,
    },
  ];
}

export function hubTitle(count = comparePairs().length) {
  return `${count} Mac App Comparisons (2026)`;
}

export function hubIntro(pairs = comparePairs()) {
  const names = pairs
    .slice(0, 3)
    .map((pair) => pairHeading(pair))
    .join(", ");
  const newer = (hubLastmod() ?? "").slice(0, 10);
  return `This hub lists ${pairs.length} Mac app comparisons. Each one is a pair from a guide that names ${COMPARE_GROUP_MIN} to ${COMPARE_GROUP_MAX} apps, and no app is in more than ${COMPARE_PAIR_CAP} pairs. They are not rankings. The first pairs are ${names}. The newest listing date among them is ${newer}.`;
}

export function hubFaqs(pairs = comparePairs()) {
  return [
    {
      q: "How many comparisons are listed?",
      a: `${pairs.length}. The heading uses the same count as the list on this page.`,
    },
    {
      q: "Which pairs are left out?",
      a: `A guide that names fewer than ${COMPARE_GROUP_MIN} apps, or more than ${COMPARE_GROUP_MAX}, does not create comparison pages. A pair is also left out once either app is already in ${COMPARE_PAIR_CAP} comparisons.`,
    },
    {
      q: "Are the apps ranked?",
      a: "No. Each page quotes the two listings and the guide that names them. It does not score them.",
    },
  ];
}
