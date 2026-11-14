import { randomUUID } from "node:crypto";
import raw from "@/data/catalog.json";
import { shouldSeedCatalogApps } from "@/lib/app-seed";
import { findShelfCategory, shelfCategories, type ShelfCategory } from "@/lib/shelf-categories";
import { getSql, type Sql } from "@/lib/db";
import { checkBadgeOnPage } from "@/lib/badge";
import { createChoiceCheckout, readDodoPrice, updateDodoPrice } from "@/lib/dodo.server";
import { cleanXHandle } from "@/lib/metadata.server";
import { isTelegramConfigured, notifyTelegramSubmission, type TelegramSubmissionInfo } from "@/lib/telegram.server";
import type { AppItem, FeaturedTier, Post, Pricing } from "@/lib/catalog";

type AppRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  icon: string;
  website: string;
  pricing: Pricing;
  category: string;
  category_name: string;
  category_icon: string;
  editor_choice: boolean;
  featured_tier?: string | null;
  featured_until?: string | Date | null;
  is_hot?: boolean;
  hot_marked_at?: string | Date | null;
  is_user_submitted?: boolean;
  views_7d?: number | string;
  created_at: string | Date;
  updated_at?: string | Date | null;
  demo: string;
  related: string[] | string;
  status: string;
  badge_status: string;
  badge_misses: number;
  badge_checked_at: string | Date | null;
  badge_detail: string;
  submitter_email: string | null;
  submitter_x?: string | null;
  click_count?: number | string;
  try_count?: number | string;
  upvote_count?: number | string;
  dashboard_token?: string | null;
};

type GuideRow = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  date_label: string;
  minutes: number;
  tags: string[] | string;
  toc: Post["toc"] | string;
  html: string;
  more: string[] | string;
  status: string;
};

function asJson<T>(value: T | string, fallback: T): T {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function iso(value: string | Date) {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function asBool(value: unknown) {
  return value === true || value === "t" || value === "true" || value === 1 || value === "1";
}

export function toApp(row: AppRow): AppItem & { editorChoice: boolean; status: string; badgeStatus: string; badgeDetail: string } {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    description: row.description,
    icon: row.icon,
    website: row.website,
    pricing: row.pricing,
    category: row.category,
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    featured: false,
    editorChoice: asBool(row.editor_choice),
    featuredTier: (row.featured_tier as FeaturedTier) || (asBool(row.editor_choice) ? "article" : null),
    featuredUntil: row.featured_until ? iso(row.featured_until) : null,
    isHot: asBool(row.is_hot),
    hotMarkedAt: row.hot_marked_at
      ? iso(row.hot_marked_at)
      : asBool(row.is_hot)
      ? (row.created_at ? iso(row.created_at) : new Date().toISOString())
      : null,
    isUserSubmitted: asBool(row.is_user_submitted),
    views7d: Number(row.views_7d ?? 0),
    createdAt: iso(row.created_at),
    updatedAt: row.updated_at ? iso(row.updated_at) : undefined,
    demo: row.demo,
    related: asJson(row.related, []),
    status: row.status,
    badgeStatus: row.badge_status,
    badgeDetail: row.badge_detail,
    clickCount: Number(row.click_count ?? 0),
    tryCount: Number(row.try_count ?? 0),
    upvoteCount: Number(row.upvote_count ?? 0),
    dashboardToken: row.dashboard_token ?? null,
  };
}

function toPost(row: GuideRow): Post {
  const seed = (raw.posts as Post[]).find((p) => p.slug === row.slug);
  return {
    slug: row.slug,
    title: row.title,
    h1: seed?.h1,
    excerpt: row.excerpt,
    date: row.date,
    dateLabel: row.date_label,
    minutes: row.minutes,
    tags: asJson(row.tags, []),
    toc: asJson(row.toc, []),
    html: row.html,
    more: asJson(row.more, []),
  };
}

let seedPromise: Promise<void> | null = null;

async function ensureTombstones(sql: Sql) {
  await sql.query(
    `create table if not exists app_tombstones (
      slug text primary key,
      name text,
      category text,
      redirect_url text,
      deleted_at timestamptz not null default now()
    )`,
  );
  await sql.query("alter table app_tombstones add column if not exists name text");
  await sql.query("alter table app_tombstones add column if not exists category text");
  await sql.query("alter table app_tombstones add column if not exists redirect_url text");
  await sql.query(
    `insert into app_tombstones (slug, name, category) values
     ('scanmydisk', 'ScanMyDisk', 'utility'),
     ('shedi', 'Shedi', 'dev'),
     ('photsy', 'Photsy', 'photography'),
     ('herdbell', 'Herdbell', 'utility'),
     ('screentoast', 'ScreenToast', 'design'),
     ('drain', 'Drain', 'utility'),
     ('peeka', 'Peeka', 'utility')
     on conflict (slug) do update set
       name = coalesce(excluded.name, app_tombstones.name),
       category = coalesce(excluded.category, app_tombstones.category)`,
  );
  await sql.query(`delete from apps where slug = 'scanmydisk'`);
}

async function seedCatalogApps(sql: Sql) {
  let blocked = new Set<string>();
  try {
    const buried = await sql.query<{ slug: string }>("select slug from app_tombstones");
    blocked = new Set(buried.map((row) => row.slug));
  } catch (err) {
    console.error("app tombstone read failed:", err);
  }
  for (const app of raw.apps) {
    if (blocked.has(app.slug)) continue;
    try {
      const existing = await sql.query<{ id: string }>(
        "select id from apps where slug = $1 or id = $2 limit 1",
        [app.slug, app.id],
      );
      if (existing.length > 0) continue;
      await sql.query(
        `insert into apps (
          id, name, slug, tagline, description, icon, website, pricing, category, category_name,
          category_icon, editor_choice, created_at, demo, related, status
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,'published')
         on conflict (slug) do nothing`,
        [
          app.id,
          app.name,
          app.slug,
          app.tagline,
          app.description,
          app.icon,
          app.website,
          app.pricing,
          app.category,
          app.categoryName,
          app.categoryIcon,
          Boolean((app as { editorChoice?: boolean }).editorChoice),
          app.createdAt,
          app.demo,
          JSON.stringify(app.related ?? []),
        ],
      );
    } catch (err) {
      console.error(`ensureSeed failed for app ${app.slug}:`, err);
    }
  }
}

async function ensureShelfCategories(sql: Sql) {
  await sql.query(
    `create table if not exists categories (
      slug text primary key,
      name text not null,
      emoji text not null default '',
      paragraphs jsonb not null default '[]'::jsonb,
      tips jsonb not null default '[]'::jsonb,
      sort_order integer not null default 0
    )`,
  );
  await sql.query(
    `update apps set category = 'utility', category_name = 'Utility', category_icon = $1 where category = 'utilities'`,
    ["🔧"],
  );
  await sql.query(
    `update apps set category = 'dev', category_name = 'Dev', category_icon = $1 where category = 'developer-tools'`,
    ["🛠️"],
  );
  const flagRows = await sql.query<{ value: string }>("select value from settings where key = 'categories_seeded'");
  const countRows = await sql.query<{ count: string }>("select count(*)::text as count from categories");
  const count = Number(countRows[0]?.count ?? 0);
  if (flagRows[0]?.value === "1" && count > 0) return;
  for (const [index, category] of shelfCategories.entries()) {
    await sql.query(
      `insert into categories (slug, name, emoji, paragraphs, tips, sort_order)
       values ($1,$2,$3,$4::jsonb,$5::jsonb,$6)
       on conflict (slug) do nothing`,
      [
        category.slug,
        category.name,
        category.emoji,
        JSON.stringify(category.paragraphs),
        JSON.stringify(category.tips),
        index,
      ],
    );
  }
  await sql.query(
    `insert into settings (key, value) values ('categories_seeded', '1')
     on conflict (key) do update set value = excluded.value`,
  );
}

function asStringList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function ensureSeed(sql: Sql) {
  try {
    await ensureTombstones(sql);
  } catch (err) {
    console.error("app tombstones table failed:", err);
  }
  try {
    await ensureShelfCategories(sql);
  } catch (err) {
    console.error("ensureSeed categories failed:", err);
  }
  try {
    await sql.query("alter table apps add column if not exists is_hot boolean not null default false");
    await sql.query("alter table apps add column if not exists is_user_submitted boolean not null default false");
  } catch (err) {
    console.error("ensureSeed is_hot & flags failed:", err);
  }
  try {
    const flagRows = await sql.query<{ value: string }>("select value from settings where key = 'apps_seeded'");
    const seeded = flagRows[0]?.value ?? null;
    if (seeded !== "1") {
      const countRows = await sql.query<{ count: string }>("select count(*)::text as count from apps");
      const guideRows = await sql.query<{ count: string }>("select count(*)::text as count from guides");
      const count = Number(countRows[0]?.count ?? 0);
      const guides = Number(guideRows[0]?.count ?? 0);
      if (shouldSeedCatalogApps(seeded, count, guides > 0)) {
        await seedCatalogApps(sql);
      }
      await sql.query(
        `insert into settings (key, value) values ('apps_seeded', '1')
         on conflict (key) do update set value = excluded.value`,
      );
    }
    const validSlugs = raw.apps.map((app) => app.slug);
    if (validSlugs.length > 0) {
      await sql.query(
        "delete from apps where not (slug = any($1::text[])) and (is_user_submitted is not true or is_user_submitted is null)",
        [validSlugs],
      );
    }
  } catch (err) {
    console.error("ensureSeed apps failed:", err);
  }
  for (const post of raw.posts) {
    try {
      await sql.query(
        `insert into guides (slug, title, excerpt, date, date_label, minutes, tags, toc, html, more, status)
         values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10::jsonb,'published')
         on conflict (slug) do update set
           title = excluded.title,
           excerpt = excluded.excerpt,
           html = excluded.html,
           tags = excluded.tags,
           toc = excluded.toc,
           more = excluded.more,
           date = excluded.date,
           date_label = excluded.date_label,
           minutes = excluded.minutes`,
        [
          post.slug,
          post.title,
          post.excerpt,
          post.date,
          post.dateLabel,
          post.minutes,
          JSON.stringify(post.tags ?? []),
          JSON.stringify(post.toc ?? []),
          post.html,
          JSON.stringify(post.more ?? []),
        ],
      );
    } catch (err) {
      console.error(`ensureSeed failed for guide ${post.slug}:`, err);
    }
  }
  try {
    await sql.query(
      `insert into settings (key, value) values ('choice_price_cents', '9900'), ('choice_compare_cents', '19900')
       on conflict (key) do nothing`,
    );
  } catch (err) {
    console.error("ensureSeed settings failed:", err);
  }
  try {
    await sql.query("alter table apps add column if not exists is_hot boolean not null default false");
    await sql.query("alter table apps add column if not exists is_user_submitted boolean not null default false");
  } catch (err) {
    console.error("ensureSeed is_hot & flags failed:", err);
  }
}

export async function directorySql() {
  const sql = await getSql();
  if (!seedPromise) {
    seedPromise = ensureSeed(sql).catch((err) => {
      seedPromise = null;
      console.error("ensureSeed error:", err);
    });
  }
  await seedPromise;
  return sql;
}

export async function publishedDirectory() {
  const sql = await directorySql();
  const appRows = await sql.query<AppRow>(
    `select a.*, 0 as views_7d
     from apps a
     where a.status = 'published'
     order by a.created_at asc, a.name asc`,
  );
  const guideRows = await sql.query<GuideRow>("select * from guides where status = 'published' order by date desc");
  const apps = appRows.map(toApp);
  let categories: ShelfCategory[] = [];
  try {
    const categoryRows = await sql.query<{
      slug: string;
      name: string;
      emoji: string;
      paragraphs: unknown;
      tips: unknown;
    }>("select slug, name, emoji, paragraphs, tips from categories order by sort_order asc, name asc");
    categories = categoryRows.map((row) => ({
      slug: row.slug,
      name: row.name,
      emoji: row.emoji,
      paragraphs: asStringList(row.paragraphs),
      tips: asStringList(row.tips),
      faqs: findShelfCategory(row.slug)?.faqs ?? [],
    }));
  } catch (err) {
    console.error("published categories failed:", err);
  }
  let tombstones: { slug: string; name?: string; category?: string }[] = [];
  try {
    const tombRows = await sql.query<{ slug: string; name: string | null; category: string | null }>(
      "select slug, name, category from app_tombstones",
    );
    tombstones = tombRows.map((r) => ({
      slug: r.slug,
      name: r.name || undefined,
      category: r.category || undefined,
    }));
  } catch (err) {
    console.error("published tombstones failed:", err);
  }
  return {
    apps,
    posts: guideRows.map(toPost),
    editors: apps.filter((app) => app.editorChoice).map((app) => app.slug),
    categories,
    tombstones,
  };
}

export const MAX_EDITOR_CHOICE_SLOTS = 6;
export const MAX_TIER_SLOTS = 3; // 3 Blue (Featured) + 3 Gold (Article)

export function getNextCycleLabel(now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 30);
  const dayNum = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${dayNum} ${months[d.getMonth()]}`;
}

export async function countActiveTierApps(tier: "featured" | "article", excludeId?: string): Promise<number> {
  const sql = await directorySql();
  if (excludeId) {
    const rows = await sql.query<{ count: string }>(
      "select count(*)::text as count from apps where editor_choice = true and status = 'published' and coalesce(featured_tier, 'featured') = $1 and id <> $2",
      [tier, excludeId],
    );
    return Number(rows[0]?.count ?? 0);
  }
  const rows = await sql.query<{ count: string }>(
    "select count(*)::text as count from apps where editor_choice = true and status = 'published' and coalesce(featured_tier, 'featured') = $1",
    [tier],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function countActiveEditorChoiceApps(excludeId?: string): Promise<number> {
  const sql = await directorySql();
  if (excludeId) {
    const rows = await sql.query<{ count: string }>(
      "select count(*)::text as count from apps where editor_choice = true and status = 'published' and id <> $1",
      [excludeId],
    );
    return Number(rows[0]?.count ?? 0);
  }
  const rows = await sql.query<{ count: string }>(
    "select count(*)::text as count from apps where editor_choice = true and status = 'published'",
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getPaidSlotDates(tier: "featured" | "article"): Promise<string[]> {
  const sql = await directorySql();
  const rows = await sql.query<{ featured_until: string | Date | null }>(
    `select featured_until from apps
     where editor_choice = true
       and status = 'published'
       and coalesce(featured_tier, 'featured') = $1
       and featured_until is not null
       and featured_until > now()
     order by featured_until asc`,
    [tier],
  );
  return rows.map((r) => (r.featured_until instanceof Date ? r.featured_until.toISOString() : String(r.featured_until)));
}

export type EditorChoiceSlotsInfo = {
  total: number;
  active: number;
  remaining: number;
  isFull: boolean;
  nextDate: string;
  openDates: string[];
};

export type PublicOffer = {
  featuredPriceCents: number;
  featuredCompareCents: number;
  articlePriceCents: number;
  articleCompareCents: number;
  featuredSlots: EditorChoiceSlotsInfo;
  articleSlots: EditorChoiceSlotsInfo;
  slots: EditorChoiceSlotsInfo;
  priceCents: number;
  compareCents: number;
};

export async function publicOffer(): Promise<PublicOffer> {
  const sql = await directorySql();
  const rows = await sql.query<{ key: string; value: string }>("select key, value from settings");
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  let featuredPriceCents = Number(map.featured_price_cents ?? map.choice_price_cents ?? 9900);
  const featuredCompareCents = Number(map.featured_compare_cents ?? map.choice_compare_cents ?? 19900);
  let articlePriceCents = Number(map.article_price_cents ?? 12000);
  const articleCompareCents = Number(map.article_compare_cents ?? 24900);

  const liveFeatured = await readDodoPrice("featured");
  if (liveFeatured != null && liveFeatured !== featuredPriceCents) {
    featuredPriceCents = liveFeatured;
    await sql.query(
      `insert into settings (key, value) values ('featured_price_cents', $1), ('choice_price_cents', $1)
       on conflict (key) do update set value = excluded.value`,
      [String(liveFeatured)],
    );
  }

  const liveArticle = await readDodoPrice("article");
  if (liveArticle != null && liveArticle !== articlePriceCents) {
    articlePriceCents = liveArticle;
    await sql.query(
      `insert into settings (key, value) values ('article_price_cents', $1)
       on conflict (key) do update set value = excluded.value`,
      [String(liveArticle)],
    );
  }

  const [activeTotal, activeFeatured, activeArticle, featuredOpenDates, articleOpenDates] = await Promise.all([
    countActiveEditorChoiceApps(),
    countActiveTierApps("featured"),
    countActiveTierApps("article"),
    getPaidSlotDates("featured"),
    getPaidSlotDates("article"),
  ]);

  const nextDate = getNextCycleLabel();
  const featuredRemaining = Math.max(0, MAX_TIER_SLOTS - activeFeatured);
  const articleRemaining = Math.max(0, MAX_TIER_SLOTS - activeArticle);
  const totalRemaining = Math.max(0, MAX_EDITOR_CHOICE_SLOTS - activeTotal);

  const featuredSlots: EditorChoiceSlotsInfo = {
    total: MAX_TIER_SLOTS,
    active: activeFeatured,
    remaining: featuredRemaining,
    isFull: featuredRemaining === 0,
    nextDate,
    openDates: featuredOpenDates,
  };

  const articleSlots: EditorChoiceSlotsInfo = {
    total: MAX_TIER_SLOTS,
    active: activeArticle,
    remaining: articleRemaining,
    isFull: articleRemaining === 0,
    nextDate,
    openDates: articleOpenDates,
  };

  return {
    featuredPriceCents,
    featuredCompareCents,
    articlePriceCents,
    articleCompareCents,
    featuredSlots,
    articleSlots,
    priceCents: featuredPriceCents,
    compareCents: featuredCompareCents,
    slots: {
      total: MAX_EDITOR_CHOICE_SLOTS,
      active: activeTotal,
      remaining: totalRemaining,
      isFull: totalRemaining === 0,
      nextDate,
      openDates: [...featuredOpenDates, ...articleOpenDates].sort(),
    },
  };
}

export async function adminStats() {
  const sql = await directorySql();
  const apps = await sql.query<{
    pricing: string;
    status: string;
    editor_choice: boolean;
    featured_tier: string | null;
    is_hot?: boolean;
    click_count?: number | string;
    try_count?: number | string;
  }>(
    "select pricing, status, editor_choice, featured_tier, is_hot, click_count, try_count from apps",
  );
  const guides = await sql.query<{ status: string }>("select status from guides");
  const revenue = await sql.query<{ cents: string }>(
    "select coalesce(sum(amount_cents), 0)::text as cents from payments where status = 'paid'",
  );
  const live = apps.filter((app) => app.status === "published");
  const blueChoice = live.filter(
    (app) => app.editor_choice && (app.featured_tier === "featured" || !app.featured_tier),
  ).length;
  const goldChoice = live.filter((app) => app.editor_choice && app.featured_tier === "article").length;
  const hotCount = live.filter((app) => app.is_hot).length;

  const totalCardClicks = apps.reduce((sum, app) => sum + Number(app.click_count ?? 0), 0);
  const totalTryClicks = apps.reduce((sum, app) => sum + Number(app.try_count ?? 0), 0);

  const views7d = 0;
  const views30d = 0;
  const topApps7d: { id: string; name: string; slug: string; icon: string; views: number }[] = [];
  const trafficSources7d: { source: string; views: number }[] = [];

  let hotApps: { id: string; name: string; slug: string; icon: string; hotMarkedAt: string | null }[] = [];
  let blueOccupants: { id: string; name: string; slug: string; icon: string; featuredUntil: string | null }[] = [];
  let goldOccupants: { id: string; name: string; slug: string; icon: string; featuredUntil: string | null }[] = [];
  try {
    await sql.query("update apps set hot_marked_at = now() where is_hot = true and hot_marked_at is null");
    const hotRows = await sql.query<{ id: string; name: string; slug: string; icon: string; hot_marked_at: string | Date | null }>(
      "select id, name, slug, icon, hot_marked_at from apps where status = 'published' and is_hot = true order by created_at asc limit 12",
    );
    hotApps = hotRows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      icon: r.icon,
      hotMarkedAt: r.hot_marked_at
        ? (r.hot_marked_at instanceof Date ? r.hot_marked_at.toISOString() : String(r.hot_marked_at))
        : new Date().toISOString(),
    }));

    const blueRows = await sql.query<{ id: string; name: string; slug: string; icon: string; featured_until: string | null }>(
      "select id, name, slug, icon, featured_until from apps where status = 'published' and editor_choice = true and (featured_tier = 'featured' or featured_tier is null) order by created_at asc",
    );
    blueOccupants = blueRows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      icon: r.icon,
      featuredUntil: r.featured_until ? String(r.featured_until) : null,
    }));

    const goldRows = await sql.query<{ id: string; name: string; slug: string; icon: string; featured_until: string | null }>(
      "select id, name, slug, icon, featured_until from apps where status = 'published' and editor_choice = true and featured_tier = 'article' order by created_at asc",
    );
    goldOccupants = goldRows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      icon: r.icon,
      featuredUntil: r.featured_until ? String(r.featured_until) : null,
    }));
  } catch (err) {
    console.error("adminStats occupants query error:", err);
  }

  const upvoteSettings = await getUpvoteSettings();

  return {
    free: live.filter((app) => app.pricing === "free").length,
    paid: live.filter((app) => app.pricing === "paid").length,
    freemium: live.filter((app) => app.pricing === "freemium").length,
    editorChoice: live.filter((app) => app.editor_choice).length,
    blueChoice,
    goldChoice,
    hotCount,
    views7d,
    views30d,
    topApps7d,
    hotApps,
    blueOccupants,
    goldOccupants,
    trafficSources7d,
    pendingApps: apps.filter((app) => app.status === "pending").length,
    unpublishedApps: apps.filter((app) => app.status === "unpublished").length,
    guides: guides.filter((guide) => guide.status === "published").length,
    draftGuides: guides.filter((guide) => guide.status !== "published").length,
    revenueCents: Number(revenue[0]?.cents ?? 0),
    telegramConfigured: isTelegramConfigured(),
    upvoteSettings,
    totalCardClicks,
    totalTryClicks,
  };
}

export async function toggleAppHot(id: string) {
  const sql = await directorySql();
  const rows = await sql.query<{ id: string; is_hot: unknown }>(
    "select id, is_hot from apps where id = $1 limit 1",
    [id],
  );
  if (!rows[0]) return null;
  const currentHot = asBool(rows[0].is_hot);
  const nextHot = !currentHot;
  await sql.query(
    "update apps set is_hot = $1, hot_marked_at = case when $1 then now() else null end, updated_at = now() where id = $2",
    [nextHot, id],
  );
  await audit(sql, nextHot ? "mark_hot" : "unmark_hot", id, `Hot set to ${nextHot}`);
  return { id, isHot: nextHot };
}

export async function publishAllUnpublishedApps() {
  const sql = await directorySql();
  const res = await sql.query<{ id: string }>(
    "update apps set status = 'published', updated_at = now() where status = 'unpublished' or status = 'pending' returning id",
  );
  await audit(sql, "publish_all", "apps", `Published ${res.length} unpublished/pending apps`);
  return res.length;
}

export async function createAdminApp(input: {
  name: string;
  slug?: string;
  tagline: string;
  description: string;
  icon?: string;
  demo?: string;
  website: string;
  pricing: string;
  category: string;
  editorChoice?: boolean;
  featuredTier?: FeaturedTier | null;
  isHot?: boolean;
  status?: string;
}) {
  const sql = await directorySql();
  const id = randomUUID();
  let slug = (input.slug?.trim() || input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-+|-+$/g, "");
  if (!slug) slug = `app-${id.slice(0, 8)}`;

  const existing = await sql.query<{ id: string }>("select id from apps where slug = $1 limit 1", [slug]);
  if (existing.length > 0) {
    slug = `${slug}-${id.slice(0, 4)}`;
  }

  const status = cleanStatus(input.status || "published");
  const isChoice = input.editorChoice === true;
  const tier = isChoice ? (input.featuredTier === "article" ? "article" : "featured") : null;

  if (isChoice && status === "published" && tier) {
    const tierActive = await countActiveTierApps(tier);
    if (tierActive >= MAX_TIER_SLOTS) {
      const tierName = tier === "article" ? "Featured + Medium Article (Gold)" : "Featured Placement (Blue)";
      throw new Error(`Cannot enable ${tierName}: All ${MAX_TIER_SLOTS} slots for this tier are already taken (${tierActive}/${MAX_TIER_SLOTS} active).`);
    }
  }

  const foundCategory = findShelfCategory(input.category);
  const category = {
    slug: foundCategory?.slug ?? "utility",
    name: foundCategory?.name ?? "Utility",
    emoji: foundCategory?.emoji ?? "🔧",
  };

  await sql.query(
    `insert into apps (
      id, name, slug, tagline, description, icon, website, pricing, category, category_name, category_icon,
      editor_choice, featured_tier, featured_until, is_hot, status, demo, is_user_submitted, created_at, updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, case when $12 then now() + interval '30 days' else null end, $14, $15, $16, false, now(), now())`,
    [
      id,
      input.name.trim(),
      slug,
      input.tagline.trim(),
      input.description.trim() || input.tagline.trim(),
      input.icon?.trim() || "",
      input.website.trim(),
      cleanPricing(input.pricing),
      category.slug,
      category.name,
      category.emoji,
      isChoice,
      tier,
      input.isHot === true,
      status,
      input.demo?.trim() || "",
    ],
  );
  await sql.query("delete from app_tombstones where slug = $1", [slug]);
  await audit(sql, "create_app", slug, `Admin created app "${input.name}"`);
  return { id, slug };
}

async function audit(sql: Sql, action: string, target: string, detail = "") {
  await sql.query("insert into audit_log (id, actor, action, target, detail) values ($1, 'admin', $2, $3, $4)", [
    randomUUID(),
    action,
    target,
    detail,
  ]);
}

export async function listApps() {
  const sql = await directorySql();
  const rows = await sql.query<AppRow>("select * from apps order by updated_at desc");
  return rows.map(toApp);
}

export async function getAppRow(id: string) {
  const sql = await directorySql();
  const rows = await sql.query<AppRow>("select * from apps where id = $1", [id]);
  if (!rows[0]) return null;
  const [otherTotal, otherFeatured, otherArticle] = await Promise.all([
    countActiveEditorChoiceApps(id),
    countActiveTierApps("featured", id),
    countActiveTierApps("article", id),
  ]);
  return {
    ...toApp(rows[0]),
    otherEditorChoiceCount: otherTotal,
    editorChoiceSlotsFull: otherTotal >= MAX_EDITOR_CHOICE_SLOTS,
    otherFeaturedCount: otherFeatured,
    featuredSlotsFull: otherFeatured >= MAX_TIER_SLOTS,
    otherArticleCount: otherArticle,
    articleSlotsFull: otherArticle >= MAX_TIER_SLOTS,
  };
}

function cleanPricing(value: string): Pricing {
  if (value === "free" || value === "paid" || value === "freemium") return value;
  return "paid";
}

function cleanStatus(value: string) {
  if (value === "pending" || value === "published" || value === "unpublished" || value === "rejected") return value;
  return "pending";
}

export async function saveApp(input: {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  icon: string;
  demo: string;
  website: string;
  pricing: string;
  category: string;
  editorChoice: boolean;
  featuredTier?: FeaturedTier | null;
  isHot?: boolean;
  status: string;
}) {
  const sql = await directorySql();
  const current = await sql.query<AppRow>("select * from apps where id = $1", [input.id]);
  const row = current[0];
  if (!row) throw new Error("App not found");
  const status = cleanStatus(input.status);

  const tier = input.editorChoice ? (input.featuredTier === "article" ? "article" : "featured") : null;

  if (input.editorChoice && status === "published" && tier) {
    const tierActive = await countActiveTierApps(tier, input.id);
    if (tierActive >= MAX_TIER_SLOTS) {
      const tierName = tier === "article" ? "Featured + Medium Article (Gold)" : "Featured Placement (Blue)";
      throw new Error(
        `Cannot enable ${tierName}: All ${MAX_TIER_SLOTS} slots for this tier are already taken by other published apps (${tierActive}/${MAX_TIER_SLOTS} active). Please uncheck this tier on another app first.`
      );
    }
  }

  const foundCategory = findShelfCategory(input.category);
  const category = {
    slug: foundCategory?.slug ?? row.category,
    name: foundCategory?.name ?? row.category_name,
    emoji: foundCategory?.emoji ?? row.category_icon,
  };
  const cleanSlug = input.slug.trim();
  const slugConflict = await sql.query<AppRow>(
    "select id from apps where slug = $1 and id <> $2 limit 1",
    [cleanSlug, input.id],
  );
  if (slugConflict.length > 0) {
    throw new Error(`The slug "${cleanSlug}" is already in use by another app.`);
  }
  await sql.query(
    `update apps set name = $2, slug = $3, tagline = $4, description = $5, website = $6, pricing = $7,
      category = $8, category_name = $9, category_icon = $10, editor_choice = $11,
      featured_tier = $12,
      featured_until = case when $11 then coalesce(featured_until, now() + interval '30 days') else null end,
      status = $13, icon = $14, demo = $15, is_hot = $16, updated_at = now()
     where id = $1`,
    [
      input.id,
      input.name.trim(),
      cleanSlug,
      input.tagline.trim(),
      input.description.trim(),
      input.website.trim(),
      cleanPricing(input.pricing),
      category.slug,
      category.name,
      category.emoji,
      input.editorChoice,
      tier,
      status,
      input.icon.trim(),
      input.demo.trim(),
      input.isHot === true,
    ],
  );
  await audit(sql, "save-app", input.slug, status);
}

export async function deleteApp(id: string) {
  const sql = await directorySql();
  const rows = await sql.query<{ slug: string; name: string; category: string }>(
    "delete from apps where id = $1 returning slug, name, category",
    [id],
  );
  const row = rows[0];
  if (!row?.slug) return;
  try {
    await sql.query(
      `insert into app_tombstones (slug, name, category, deleted_at)
       values ($1, $2, $3, now())
       on conflict (slug) do update set
         name = coalesce(excluded.name, app_tombstones.name),
         category = coalesce(excluded.category, app_tombstones.category),
         deleted_at = now()`,
      [row.slug, row.name || null, row.category || null],
    );
  } catch (err) {
    console.error("app tombstone failed:", err);
  }
  await audit(sql, "delete-app", row.slug);
}

export async function listGuides() {
  const sql = await directorySql();
  return sql.query<{ slug: string; title: string; excerpt?: string; status: string; date: string; minutes?: number }>(
    "select slug, title, excerpt, status, date, minutes from guides order by date desc",
  );
}

export async function getGuide(slug: string) {
  const sql = await directorySql();
  const rows = await sql.query<GuideRow>("select * from guides where slug = $1", [slug]);
  return rows[0] ?? null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function saveGuide(input: {
  slug: string;
  originalSlug: string;
  title: string;
  excerpt: string;
  html: string;
  status: string;
  isNew: boolean;
}) {
  const sql = await directorySql();
  const status = input.status === "published" || input.status === "unpublished" ? input.status : "draft";
  const slug = slugify(input.slug || input.title);
  if (!slug) throw new Error("A guide needs a slug");
  if (input.isNew) {
    const date = new Date().toISOString().slice(0, 10);
    await sql.query(
      `insert into guides (slug, title, excerpt, date, date_label, minutes, html, status)
       values ($1,$2,$3,$4,$5,8,$6,$7)`,
      [slug, input.title.trim(), input.excerpt.trim(), date, date, input.html, status],
    );
  } else {
    const current = slugify(input.originalSlug) || slug;
    const updated = await sql.query(
      `update guides set slug = $2, title = $3, excerpt = $4, html = $5, status = $6, updated_at = now() where slug = $1 returning slug`,
      [current, slug, input.title.trim(), input.excerpt.trim(), input.html, status],
    );
    if (!updated.length) throw new Error("Guide not found");
  }
  await audit(sql, "save-guide", slug, status);
  return slug;
}

export async function deleteGuide(slug: string) {
  const sql = await directorySql();
  await sql.query("delete from guides where slug = $1", [slug]);
  await audit(sql, "delete-guide", slug);
}

export async function setPackagePrice(tier: "featured" | "article", amountCents: number, compareCents: number) {
  if (!Number.isInteger(amountCents) || amountCents < 100 || amountCents > 100_000_00) {
    throw new Error("Price must be a whole number of cents from the server form.");
  }
  if (!Number.isInteger(compareCents) || compareCents < 0 || compareCents > 100_000_00) {
    throw new Error("Compare-at price must be a whole number of cents.");
  }
  try {
    await updateDodoPrice(amountCents, tier);
  } catch (err) {
    console.warn(`Dodo API price update for ${tier} skipped or failed:`, err);
  }
  const sql = await directorySql();
  const priceKey = tier === "article" ? "article_price_cents" : "featured_price_cents";
  const compareKey = tier === "article" ? "article_compare_cents" : "featured_compare_cents";

  await sql.query(
    `insert into settings (key, value) values ($1, $2)
     on conflict (key) do update set value = excluded.value`,
    [priceKey, String(amountCents)],
  );
  await sql.query(
    `insert into settings (key, value) values ($1, $2)
     on conflict (key) do update set value = excluded.value`,
    [compareKey, String(compareCents)],
  );
  if (tier === "featured") {
    await sql.query(
      `insert into settings (key, value) values ('choice_price_cents', $1), ('choice_compare_cents', $2)
       on conflict (key) do update set value = excluded.value`,
      [String(amountCents), String(compareCents)],
    );
  }
  await audit(sql, "price", tier, String(amountCents));
}

export async function setChoicePrice(amountCents: number, compareCents: number) {
  return setPackagePrice("featured", amountCents, compareCents);
}

export async function listSubmissions() {
  const sql = await directorySql();
  return sql.query<{
    id: string;
    app_name: string;
    website: string;
    plan: string;
    tier?: string;
    status: string;
    email: string;
    x_handle?: string;
    badge_ok?: boolean;
    created_at: string | Date;
    updated_at?: string | Date | null;
    app_id?: string | null;
    app_slug?: string | null;
  }>(
    "select s.id, s.app_name, s.website, s.plan, coalesce(s.tier, 'featured') as tier, s.status, s.email, coalesce(s.x_handle, '') as x_handle, coalesce(s.badge_ok, false) as badge_ok, s.created_at, s.app_id, a.slug as app_slug from submissions s left join apps a on a.id = s.app_id order by s.created_at desc limit 100",
  );
}

export async function getSubmissionById(id: string): Promise<TelegramSubmissionInfo | null> {
  const sql = await directorySql();
  const rows = await sql.query<{
    id: string;
    app_name: string;
    website: string;
    tagline: string;
    email: string;
    x_handle?: string;
    plan: string;
    tier?: string;
    pricing?: string;
    category?: string;
    badge_ok: unknown;
    status: string;
    app_id?: string | null;
    app_slug?: string | null;
    dashboard_token?: string | null;
  }>(
    `select s.id, s.app_name, s.website, s.tagline, s.email, coalesce(s.x_handle, '') as x_handle,
            s.plan, coalesce(s.tier, 'featured') as tier, coalesce(s.pricing, '') as pricing,
            coalesce(s.category, '') as category, s.badge_ok, s.status, s.app_id, a.slug as app_slug,
            s.dashboard_token
       from submissions s
       left join apps a on a.id = s.app_id
      where s.id = $1
      limit 1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    appName: row.app_name,
    website: row.website,
    tagline: row.tagline,
    email: row.email,
    xHandle: row.x_handle || undefined,
    plan: row.plan,
    tier: row.tier,
    pricing: row.pricing || undefined,
    category: row.category || undefined,
    badgeOk: asBool(row.badge_ok),
    status: row.status,
    approvedSlug: row.status === "approved" ? row.app_slug || undefined : undefined,
    existingSlug: row.app_slug || undefined,
    isUpdate: Boolean(row.app_slug || row.app_id),
    dashboardToken: row.dashboard_token || undefined,
  };
}

export async function updateSubmissionBadgeStatus(id: string, badgeOk: boolean) {
  const sql = await directorySql();
  await sql.query("update submissions set badge_ok = $2 where id = $1", [id, badgeOk]);
}

export async function verifySubmissionBadge(id: string) {
  const submission = await getSubmissionById(id);
  if (!submission) throw new Error("Submission not found");
  const check = await checkBadgeOnPage(submission.website);
  await updateSubmissionBadgeStatus(id, check.ok);
  return check;
}

export async function listPendingSubmissionsForTelegram(limit = 5): Promise<TelegramSubmissionInfo[]> {
  const sql = await directorySql();
  const rows = await sql.query<{
    id: string;
    app_name: string;
    website: string;
    tagline: string;
    email: string;
    x_handle?: string;
    plan: string;
    tier?: string;
    pricing?: string;
    category?: string;
    badge_ok: unknown;
    status: string;
    dashboard_token?: string | null;
  }>(
    `select id, app_name, website, tagline, email, coalesce(x_handle, '') as x_handle,
            plan, coalesce(tier, 'featured') as tier, coalesce(pricing, '') as pricing,
            coalesce(category, '') as category, badge_ok, status, dashboard_token
       from submissions
      where status in ('pending', 'paid')
      order by created_at desc
      limit $1`,
    [Math.min(Math.max(1, limit), 10)],
  );
  return rows.map((row) => ({
    id: row.id,
    appName: row.app_name,
    website: row.website,
    tagline: row.tagline,
    email: row.email,
    xHandle: row.x_handle || undefined,
    plan: row.plan,
    tier: row.tier,
    pricing: row.pricing || undefined,
    category: row.category || undefined,
    badgeOk: asBool(row.badge_ok),
    status: row.status,
    dashboardToken: row.dashboard_token || undefined,
  }));
}

export async function rejectSubmission(id: string) {
  const sql = await directorySql();
  const rows = await sql.query<{ id: string }>(
    "update submissions set status = 'rejected' where id = $1 and status <> 'approved' returning id",
    [id],
  );
  if (!rows.length) throw new Error("That submission cannot be rejected.");
  await audit(sql, "reject", id);
}

export function normalizeWebsiteDomain(rawUrl: string): string {
  try {
    let clean = rawUrl.trim();
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
    }
    const u = new URL(clean);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return rawUrl.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? "";
  }
}

export async function findExistingPublishedApp(website: string, name?: string) {
  const sql = await directorySql();
  const domain = normalizeWebsiteDomain(website);
  const rows = await sql.query<{
    id: string;
    name: string;
    slug: string;
    website: string;
    editor_choice: boolean;
    featured_tier: string | null;
    is_hot: boolean;
  }>("select id, name, slug, website, editor_choice, featured_tier, is_hot from apps where status in ('published', 'unpublished')");

  if (domain) {
    const match = rows.find((r) => normalizeWebsiteDomain(r.website) === domain);
    if (match) return match;
  }
  if (name && name.trim()) {
    const targetSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    const match = rows.find((r) => r.slug === targetSlug || r.name.toLowerCase() === name.trim().toLowerCase());
    if (match) return match;
  }
  return null;
}

export async function submitListing(
  input: {
    name: string;
    website: string;
    tagline: string;
    description: string;
    icon: string;
    demo: string;
    pricing: string;
    category: string;
    email: string;
    xHandle?: string;
    plan: string;
    tier?: string;
  },
  origin: string,
  attribution?: { mlVisitorId?: string; mlSessionId?: string },
) {
  const plan = input.plan === "choice" ? "choice" : "free";
  const tier = input.tier === "article" ? "article" : "featured";
  const name = input.name.trim();
  const website = input.website.trim();
  const tagline = input.tagline.trim();
  const description = input.description.trim();
  const icon = input.icon.trim();
  const demo = input.demo.trim();
  const email = input.email.trim();
  const xHandle = cleanXHandle(input.xHandle ?? "");
  const category = findShelfCategory(input.category);
  if (!name || !website || !tagline || !description || !icon || !email.includes("@") || !xHandle || !category) {
    return { ok: false as const, message: "Name, website, tagline, description, icon, category, email, and X handle are required." };
  }
  if (plan === "choice") {
    const activeTierSlots = await countActiveTierApps(tier);
    if (activeTierSlots >= MAX_TIER_SLOTS) {
      const tierLabel = tier === "article" ? "Featured + Medium Article (Gold)" : "Featured Placement (Blue)";
      return {
        ok: false as const,
        message: `All ${MAX_TIER_SLOTS} spots for ${tierLabel} are currently full for this 30-day cycle. Please choose the other tier or submit using the Free plan.`,
      };
    }
  }
  if (plan === "free") {
    const badge = await checkBadgeOnPage(website);
    if (!badge.ok) return { ok: false as const, message: badge.message };
  }
  const existingApp = await findExistingPublishedApp(website, name);
  const sql = await directorySql();
  const id = randomUUID();
  const submissionToken = randomUUID();
  const cleanedPricing = cleanPricing(input.pricing);
  const initialStatus = plan === "choice" ? "awaiting_payment" : "pending";
  await sql.query(
    `insert into submissions (id, app_name, website, tagline, email, x_handle, plan, tier, badge_ok, status, description, icon, demo, pricing, category, app_id, dashboard_token)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      id,
      name,
      website,
      tagline,
      email,
      xHandle,
      plan,
      tier,
      plan === "free",
      initialStatus,
      description,
      icon,
      demo,
      cleanedPricing,
      category.slug,
      existingApp ? existingApp.id : null,
      submissionToken,
    ],
  );
  const telegramInfo: TelegramSubmissionInfo = {
    id,
    appName: name,
    website,
    tagline,
    email,
    xHandle,
    plan,
    tier,
    pricing: cleanedPricing,
    category: category.name,
    badgeOk: plan === "free",
    status: initialStatus,
    existingSlug: existingApp?.slug,
    isUpdate: Boolean(existingApp),
    dashboardToken: submissionToken,
  };
  if (plan === "free") {
    await notifyTelegramSubmission(telegramInfo, "submitted").catch((err) => {
      console.error("[telegram] notify free submission failed:", err);
    });
    return {
      ok: true as const,
      message: existingApp
        ? `Update submitted for ${existingApp.name}! We'll review your update and apply it to your live listing.`
        : "Submitted. It stays pending until an admin approves it.",
      existingSlug: existingApp?.slug,
      isUpdate: Boolean(existingApp),
      dashboardToken: submissionToken,
    };
  }
  try {
    const checkout = await createChoiceCheckout({
      submissionId: id,
      email,
      name,
      returnUrl: `${origin}/dashboard/${submissionToken}?paid=1`,
      tier: tier === "article" ? "article" : "featured",
      mlVisitorId: attribution?.mlVisitorId,
      mlSessionId: attribution?.mlSessionId,
    });
    if (checkout.paymentId) {
      const offer = await publicOffer();
      const amountCents = tier === "article" ? offer.articlePriceCents : offer.featuredPriceCents;
      await sql.query(
        `insert into payments (id, submission_id, provider_payment_id, amount_cents, currency, status)
         values ($1,$2,$3,$4,'USD','pending')`,
        [randomUUID(), id, checkout.paymentId, amountCents],
      );
    }
    await notifyTelegramSubmission(telegramInfo, "submitted").catch((err) => {
      console.error("[telegram] notify paid checkout failed:", err);
    });
    return {
      ok: true as const,
      checkoutUrl: checkout.checkoutUrl,
      message: "Continue to checkout.",
      dashboardToken: submissionToken,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout could not be started.";
    return { ok: false as const, message };
  }
}

export async function markPaymentPaid(input: { eventId: string; submissionId: string; paymentId: string; amountCents: number; currency: string }) {
  const sql = await directorySql();
  const seen = await sql.query("select id from webhook_events where id = $1", [input.eventId]);
  if (seen.length) return;
  await sql.query("update submissions set status = 'paid' where id = $1 and status <> 'approved'", [input.submissionId]);
  const existing = await sql.query<{ id: string }>(
    "select id from payments where submission_id = $1 order by created_at desc limit 1",
    [input.submissionId],
  );
  if (existing[0]) {
    await sql.query(
      `update payments set status = 'paid', amount_cents = $2, currency = $3, provider_payment_id = $4 where id = $1`,
      [existing[0].id, input.amountCents, input.currency || "USD", input.paymentId],
    );
  } else {
    await sql.query(
      `insert into payments (id, submission_id, provider_payment_id, amount_cents, currency, status)
       values ($1,$2,$3,$4,$5,'paid')`,
      [randomUUID(), input.submissionId, input.paymentId, input.amountCents, input.currency || "USD"],
    );
  }
  await sql.query("insert into webhook_events (id) values ($1)", [input.eventId]);
  const paidSubmission = await getSubmissionById(input.submissionId);
  if (paidSubmission) {
    await notifyTelegramSubmission(paidSubmission, "payment_succeeded").catch((err) => {
      console.error("[telegram] notify paid confirmation failed:", err);
    });
  }
}

export async function approveSubmission(id: string, options?: { makeHot?: boolean }) {
  const sql = await directorySql();
  const rows = await sql.query<{
    id: string;
    app_name: string;
    website: string;
    tagline: string;
    description: string;
    icon: string;
    demo: string;
    pricing: string;
    category: string;
    email: string;
    x_handle?: string;
    plan: string;
    tier?: string;
    status: string;
    app_id?: string | null;
    dashboard_token?: string | null;
  }>("select * from submissions where id = $1", [id]);
  const submission = rows[0];
  if (!submission) throw new Error("Submission not found");
  if (submission.status === "approved") throw new Error("That submission is already approved.");
  if (submission.plan === "choice") {
    if (submission.status !== "paid") {
      throw new Error("Editor’s Choice can be approved only after Dodo confirms payment.");
    }
    const targetTier = submission.tier === "article" ? "article" : "featured";
    const activeTier = await countActiveTierApps(targetTier);
    if (activeTier >= MAX_TIER_SLOTS) {
      const tierLabel = targetTier === "article" ? "Featured + Medium Article (Gold)" : "Featured Placement (Blue)";
      throw new Error(
        `Cannot approve as ${tierLabel}: All ${MAX_TIER_SLOTS} slots for this tier are currently full (${activeTier}/${MAX_TIER_SLOTS} active). Please unpublish or remove another app from this tier before approving.`
      );
    }
  } else {
    // Free listing: Must verify PickMacApps badge live on website before approving
    const badgeCheck = await checkBadgeOnPage(submission.website);
    if (!badgeCheck.ok) {
      await updateSubmissionBadgeStatus(submission.id, false);
      throw new Error(
        `Cannot approve free listing: PickMacApps badge was not found on ${submission.website} (${badgeCheck.message}). Please verify the badge is installed before approving.`
      );
    }
    await updateSubmissionBadgeStatus(submission.id, true);
  }

  const category = findShelfCategory(submission.category) ?? {
    slug: "utility",
    name: "Utility",
    emoji: "🔧",
    paragraphs: [],
    tips: [],
  };
  const isChoice = submission.plan === "choice";
  const tier = isChoice ? (submission.tier === "article" ? "article" : "featured") : null;
  const makeHot = Boolean(options?.makeHot);

  // Check if an existing published app matches this submission (Option B & C)
  let existingApp: {
    id: string;
    name: string;
    slug: string;
    website: string;
    editor_choice: boolean;
    featured_tier: string | null;
    is_hot: boolean;
  } | null = null;

  if (submission.app_id) {
    const existingRows = await sql.query<{
      id: string;
      name: string;
      slug: string;
      website: string;
      editor_choice: boolean;
      featured_tier: string | null;
      is_hot: boolean;
    }>(
      "select id, name, slug, website, editor_choice, featured_tier, is_hot from apps where id = $1 limit 1",
      [submission.app_id],
    );
    if (existingRows[0]) existingApp = existingRows[0];
  }
  if (!existingApp) {
    existingApp = await findExistingPublishedApp(submission.website, submission.app_name);
  }

  if (existingApp) {
    // Option B: Update existing listing details without creating a duplicate
    // Option C: If choice plan was paid/selected, upgrade app to Editor's Choice Gold or Blue
    const updatedEditorChoice = isChoice ? true : existingApp.editor_choice;
    const updatedTier = isChoice ? tier : existingApp.featured_tier;

    // Use submission's dashboard token, or existing app's token, or generate new
    const dashTokenRows = await sql.query<{ dashboard_token: string | null }>(
      "select dashboard_token from apps where id = $1 limit 1",
      [existingApp.id],
    );
    const dashboardToken = dashTokenRows[0]?.dashboard_token || submission.dashboard_token || randomUUID();

    await sql.query(
      `update apps set
        name = $1,
        tagline = $2,
        description = $3,
        icon = coalesce(nullif($4, ''), icon),
        website = $5,
        pricing = $6,
        category = $7,
        category_name = $8,
        category_icon = $9,
        demo = coalesce(nullif($10, ''), demo),
        editor_choice = $11,
        featured_tier = $12,
        featured_until = case
          when $11 and not editor_choice then now() + interval '30 days'
          when $11 and editor_choice and (featured_until is null or featured_until < now()) then now() + interval '30 days'
          else featured_until
        end,
        is_hot = case when $13 then true else is_hot end,
        hot_marked_at = case when $13 and not is_hot then now() else hot_marked_at end,
        submitter_email = coalesce(nullif($14, ''), submitter_email),
        submitter_x = coalesce(nullif($15, ''), submitter_x),
        dashboard_token = coalesce(dashboard_token, $16),
        status = 'published',
        badge_misses = 0,
        updated_at = now()
      where id = $17`,
      [
        submission.app_name,
        submission.tagline,
        submission.description || submission.tagline,
        submission.icon || "",
        submission.website,
        cleanPricing(submission.pricing || (isChoice ? "paid" : "free")),
        category.slug,
        category.name,
        category.emoji,
        submission.demo || "",
        updatedEditorChoice,
        updatedTier,
        makeHot,
        submission.email,
        submission.x_handle || "",
        dashboardToken,
        existingApp.id,
      ],
    );

    await sql.query("delete from app_tombstones where slug = $1", [existingApp.slug]);
    await sql.query("update submissions set status = 'approved', app_id = $2 where id = $1", [id, existingApp.id]);
    await audit(sql, isChoice ? "upgrade_sponsor" : "update_app", existingApp.slug, submission.plan);
    return {
      id: existingApp.id,
      slug: existingApp.slug,
      name: submission.app_name,
      categorySlug: category.slug,
      isUpdate: true,
      isChoice,
      tier: updatedTier,
      dashboardToken,
    };
  }

  const appId = randomUUID();
  const dashboardToken = submission.dashboard_token || randomUUID();
  let slug =
    submission.app_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || appId.slice(0, 8);
  const taken = await sql.query("select id from apps where slug = $1", [slug]);
  if (taken.length) slug = `${slug}-${appId.slice(0, 4)}`;
  await sql.query(
    `insert into apps (
      id, name, slug, tagline, description, icon, website, pricing, category, category_name, category_icon,
      editor_choice, featured_tier, featured_until, is_hot, hot_marked_at, demo, status, submitter_email, submitter_x, is_user_submitted, dashboard_token
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,case when $12 then now() + interval '30 days' else null end,$14,case when $14 then now() else null end,$15,'published',$16,$17,true,$18)`,
    [
      appId,
      submission.app_name,
      slug || appId.slice(0, 8),
      submission.tagline,
      submission.description || submission.tagline,
      submission.icon || "",
      submission.website,
      cleanPricing(submission.pricing || (isChoice ? "paid" : "free")),
      category.slug,
      category.name,
      category.emoji,
      isChoice,
      tier,
      makeHot,
      submission.demo || "",
      submission.email,
      submission.x_handle || "",
      dashboardToken,
    ],
  );
  await sql.query("delete from app_tombstones where slug = $1", [slug]);
  await sql.query("update submissions set status = 'approved', app_id = $2 where id = $1", [id, appId]);
  await audit(sql, "approve", slug, submission.plan);
  return { id: appId, slug, name: submission.app_name, categorySlug: category.slug, isUpdate: false, isChoice, tier, dashboardToken };
}

export async function runBadgeChecks() {
  const sql = await directorySql();
  const rows = await sql.query<AppRow>(
    "select * from apps where status in ('published', 'unpublished') and editor_choice = false and is_user_submitted = true",
  );
  const results: { slug: string; result: string; detail: string; action: "published" | "unpublished" | "unchanged" }[] = [];
  for (const row of rows) {
    const check = await checkBadgeOnPage(row.website);
    let result = "ok";
    let misses = 0;
    let newStatus = row.status;
    let action: "published" | "unpublished" | "unchanged" = "unchanged";

    if (!check.ok) {
      result = check.message.includes("couldn't find") ? "missing" : "error";
      misses = Number(row.badge_misses) + 1;
      // Auto-unpublish if badge is not found
      if (row.status === "published") {
        newStatus = "unpublished";
        action = "unpublished";
        await audit(sql, "unpublish_badge", row.slug, `Auto-unpublished: PickMacApps badge not found (${check.message})`);
      }
    } else {
      result = "ok";
      misses = 0;
      // Auto-republish if badge was restored on website
      if (row.status === "unpublished") {
        newStatus = "published";
        action = "published";
        await audit(sql, "republish_badge", row.slug, "Auto-republished: PickMacApps badge found on website");
      }
    }

    await sql.query(
      `update apps
          set badge_status = $2,
              badge_misses = $3,
              badge_checked_at = now(),
              badge_detail = $4,
              status = $5,
              updated_at = now()
        where id = $1`,
      [row.id, result, misses, check.message, newStatus],
    );

    await sql.query(
      "insert into badge_checks (id, app_id, result, detail) values ($1,$2,$3,$4)",
      [randomUUID(), row.id, newStatus === "published" ? result : "unpublished", check.message],
    );

    if (action !== "unchanged") {
      try {
        const { submitToIndexNow, urlsForAppChange } = await import("@/lib/indexnow");
        const { PRIMARY_ORIGIN } = await import("@/lib/seo");
        submitToIndexNow(PRIMARY_ORIGIN, urlsForAppChange(PRIMARY_ORIGIN, row.slug));
      } catch (err) {
        console.error("[badge-check] IndexNow submit failed:", err);
      }
    }

    results.push({ slug: row.slug, result, detail: check.message, action });
  }
  return results;
}

// -------------------------------------------------------------
// Hot Auto-Expiry
// -------------------------------------------------------------
export async function expireOldHotApps(): Promise<number> {
  const sql = await directorySql();
  const rows = await sql.query<{ id: string }>(
    `update apps
     set is_hot = false, hot_marked_at = null, updated_at = now()
     where is_hot = true
       and hot_marked_at is not null
       and hot_marked_at < now() - interval '30 days'
     returning id`,
  );
  if (rows.length > 0) {
    await audit(sql, "expire_hot", `${rows.length} apps`, `Expired hot tags older than 30 days`);
  }
  return rows.length;
}

// -------------------------------------------------------------
// Click & Try-App Tracking
// -------------------------------------------------------------
export async function recordAppClick(appId: string, type: "click" | "try"): Promise<boolean> {
  const sql = await directorySql();
  const column = type === "try" ? "try_count" : "click_count";
  const rows = await sql.query<{ id: string }>(
    `update apps set ${column} = coalesce(${column}, 0) + 1 where id = $1 returning id`,
    [appId],
  );
  return rows.length > 0;
}

// -------------------------------------------------------------
// Submitter Mini-Dashboard
// -------------------------------------------------------------
export type DashboardViewData = (AppItem & {
  editorChoice: boolean;
  status: string;
  badgeStatus: string;
  badgeDetail: string;
  submitterEmail: string | null;
  submitterX: string | null;
  isSubmissionPending?: boolean;
  submissionPlan?: string;
  submissionTier?: string;
  submissionCreatedAt?: string;
});

export async function getDashboardByToken(token: string): Promise<DashboardViewData | null> {
  if (!token || typeof token !== "string") return null;
  const sql = await directorySql();
  const cleanToken = token.trim();

  // 1. Check if token belongs to an existing published app
  const appRows = await sql.query<AppRow>(
    "select * from apps where dashboard_token = $1 limit 1",
    [cleanToken],
  );
  if (appRows[0]) {
    const row = appRows[0];
    const base = toApp(row);
    return {
      ...base,
      submitterEmail: row.submitter_email ?? null,
      submitterX: row.submitter_x ?? null,
      isSubmissionPending: false,
    };
  }

  // 2. Otherwise, check if token belongs to a pending / awaiting_payment submission
  const subRows = await sql.query<{
    id: string;
    app_name: string;
    website: string;
    tagline: string;
    description: string;
    icon: string;
    demo: string;
    pricing: string;
    category: string;
    email: string;
    x_handle: string;
    plan: string;
    tier: string;
    badge_ok: boolean;
    status: string;
    app_id: string | null;
    created_at: string | Date;
    dashboard_token: string | null;
  }>(
    "select * from submissions where dashboard_token = $1 limit 1",
    [cleanToken],
  );

  const sub = subRows[0];
  if (!sub) return null;

  // If this submission was approved and attached to an app, return that app
  if (sub.app_id) {
    const attachedApps = await sql.query<AppRow>("select * from apps where id = $1 limit 1", [sub.app_id]);
    if (attachedApps[0]) {
      const base = toApp(attachedApps[0]);
      return {
        ...base,
        submitterEmail: attachedApps[0].submitter_email ?? null,
        submitterX: attachedApps[0].submitter_x ?? null,
        isSubmissionPending: false,
      };
    }
  }

  const category = findShelfCategory(sub.category) ?? {
    slug: "utility",
    name: "Utility",
    emoji: "🔧",
    paragraphs: [],
    tips: [],
  };

  // Return a pending app preview structure for the dashboard
  return {
    id: sub.id,
    name: sub.app_name,
    slug: sub.app_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    tagline: sub.tagline,
    description: sub.description,
    icon: sub.icon,
    website: sub.website,
    pricing: (sub.pricing as Pricing) || "free",
    category: category.slug,
    categoryName: category.name,
    categoryIcon: category.emoji,
    featured: false,
    editorChoice: sub.plan === "choice",
    featuredTier: sub.tier === "article" ? "article" : sub.plan === "choice" ? "featured" : null,
    featuredUntil: null,
    isHot: false,
    isUserSubmitted: true,
    views7d: 0,
    clickCount: 0,
    tryCount: 0,
    upvoteCount: 0,
    createdAt: iso(sub.created_at),
    demo: sub.demo,
    related: [],
    status: sub.status,
    badgeStatus: sub.badge_ok ? "ok" : "unchecked",
    badgeDetail: "",
    dashboardToken: sub.dashboard_token ?? cleanToken,
    submitterEmail: sub.email,
    submitterX: sub.x_handle,
    isSubmissionPending: true,
    submissionPlan: sub.plan,
    submissionTier: sub.tier,
    submissionCreatedAt: iso(sub.created_at),
  };
}

export async function updateAppByToken(
  token: string,
  changes: {
    tagline?: string;
    description?: string;
    demo?: string;
    pricing?: Pricing;
    category?: string;
    icon?: string;
    name?: string;
  },
): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const sql = await directorySql();
  const cleanToken = token.trim();
  const rows = await sql.query<{ id: string; category: string; category_name: string; category_icon: string }>(
    "select id, category, category_name, category_icon from apps where dashboard_token = $1 limit 1",
    [cleanToken],
  );
  let current = rows[0];
  if (!current) {
    // If not found in apps table, check if it's a pending submission
    const subRows = await sql.query<{ id: string; category: string }>(
      "select id, category from submissions where dashboard_token = $1 limit 1",
      [cleanToken],
    );
    const sub = subRows[0];
    if (!sub) return false;

    let catSlug = sub.category;
    if (changes.category) {
      const found = findShelfCategory(changes.category);
      if (found) catSlug = found.slug;
    }

    await sql.query(
      `update submissions set
        app_name = coalesce(nullif($1, ''), app_name),
        tagline = coalesce(nullif($2, ''), tagline),
        description = coalesce(nullif($3, ''), description),
        demo = coalesce($4, demo),
        pricing = coalesce(nullif($5, ''), pricing),
        category = $6,
        icon = coalesce(nullif($7, ''), icon)
      where id = $8`,
      [
        changes.name?.trim() || "",
        changes.tagline?.trim() || "",
        changes.description?.trim() || "",
        changes.demo !== undefined ? changes.demo.trim() : null,
        changes.pricing ? cleanPricing(changes.pricing) : "",
        catSlug,
        changes.icon?.trim() || "",
        sub.id,
      ],
    );
    return true;
  }

  let catSlug = current.category;
  let catName = current.category_name;
  let catEmoji = current.category_icon;
  if (changes.category) {
    const found = findShelfCategory(changes.category);
    if (found) {
      catSlug = found.slug;
      catName = found.name;
      catEmoji = found.emoji;
    }
  }

  await sql.query(
    `update apps set
      name = coalesce(nullif($1, ''), name),
      tagline = coalesce(nullif($2, ''), tagline),
      description = coalesce(nullif($3, ''), description),
      demo = coalesce($4, demo),
      pricing = coalesce(nullif($5, '')::pricing, pricing),
      category = $6,
      category_name = $7,
      category_icon = $8,
      icon = coalesce(nullif($9, ''), icon),
      updated_at = now()
    where id = $10`,
    [
      changes.name?.trim() || "",
      changes.tagline?.trim() || "",
      changes.description?.trim() || "",
      changes.demo !== undefined ? changes.demo.trim() : null,
      changes.pricing ? cleanPricing(changes.pricing) : "",
      catSlug,
      catName,
      catEmoji,
      changes.icon?.trim() || "",
      current.id,
    ],
  );
  await audit(sql, "dashboard_edit", current.id, `Submitter edited listing via dashboard`);
  return true;
}

// -------------------------------------------------------------
// Upvote Settings & System
// -------------------------------------------------------------
export type UpvoteSettings = {
  upvotesEnabled: boolean;
  autoHotEnabled: boolean;
  hotThreshold: number;
};

export async function getUpvoteSettings(): Promise<UpvoteSettings> {
  const sql = await directorySql();
  const rows = await sql.query<{ key: string; value: string }>(
    "select key, value from settings where key in ('upvotes_enabled', 'upvote_auto_hot_enabled', 'upvote_hot_threshold')",
  );
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    upvotesEnabled: map.upvotes_enabled === undefined ? true : asBool(map.upvotes_enabled),
    autoHotEnabled: map.upvote_auto_hot_enabled === undefined ? true : asBool(map.upvote_auto_hot_enabled),
    hotThreshold: Number(map.upvote_hot_threshold ?? 15) || 15,
  };
}

export async function updateUpvoteSettings(settings: Partial<UpvoteSettings>): Promise<void> {
  const sql = await directorySql();
  if (settings.upvotesEnabled !== undefined) {
    await sql.query(
      `insert into settings (key, value) values ('upvotes_enabled', $1)
       on conflict (key) do update set value = excluded.value`,
      [String(settings.upvotesEnabled)],
    );
  }
  if (settings.autoHotEnabled !== undefined) {
    await sql.query(
      `insert into settings (key, value) values ('upvote_auto_hot_enabled', $1)
       on conflict (key) do update set value = excluded.value`,
      [String(settings.autoHotEnabled)],
    );
  }
  if (settings.hotThreshold !== undefined) {
    await sql.query(
      `insert into settings (key, value) values ('upvote_hot_threshold', $1)
       on conflict (key) do update set value = excluded.value`,
      [String(Math.max(1, Math.round(settings.hotThreshold)))],
    );
  }
}

export async function submitAppUpvote(appId: string, fingerprint: string): Promise<{
  ok: boolean;
  alreadyVoted: boolean;
  upvoteCount: number;
  promotedToHot: boolean;
  message?: string;
}> {
  const sql = await directorySql();
  const settings = await getUpvoteSettings();
  if (!settings.upvotesEnabled) {
    return { ok: false, alreadyVoted: false, upvoteCount: 0, promotedToHot: false, message: "Upvoting is currently disabled" };
  }

  // Check if fingerprint already voted for this app
  const existing = await sql.query<{ id: string }>(
    "select id from app_upvotes where app_id = $1 and fingerprint = $2 limit 1",
    [appId, fingerprint],
  );
  if (existing.length > 0) {
    const cur = await sql.query<{ upvote_count: number }>("select upvote_count from apps where id = $1 limit 1", [appId]);
    return {
      ok: true,
      alreadyVoted: true,
      upvoteCount: Number(cur[0]?.upvote_count ?? 0),
      promotedToHot: false,
    };
  }

  // Insert vote
  await sql.query(
    "insert into app_upvotes (app_id, fingerprint) values ($1, $2) on conflict do nothing",
    [appId, fingerprint],
  );

  // Increment upvote_count atomically
  const updatedRows = await sql.query<{ id: string; upvote_count: number; is_hot: boolean }>(
    `update apps set upvote_count = coalesce(upvote_count, 0) + 1 where id = $1 returning id, upvote_count, is_hot`,
    [appId],
  );
  const row = updatedRows[0];
  const newCount = Number(row?.upvote_count ?? 0);
  const currentlyHot = asBool(row?.is_hot);

  let promotedToHot = false;
  if (settings.autoHotEnabled && !currentlyHot && newCount >= settings.hotThreshold) {
    await sql.query(
      "update apps set is_hot = true, hot_marked_at = now(), updated_at = now() where id = $1",
      [appId],
    );
    await audit(sql, "auto_promote_hot", appId, `Auto-promoted to Hot via ${newCount} upvotes (threshold: ${settings.hotThreshold})`);
    promotedToHot = true;
  }

  return {
    ok: true,
    alreadyVoted: false,
    upvoteCount: newCount,
    promotedToHot,
  };
}

export async function promoteEligibleUpvotedApps(): Promise<number> {
  const sql = await directorySql();
  const settings = await getUpvoteSettings();
  if (!settings.autoHotEnabled) return 0;

  const rows = await sql.query<{ id: string }>(
    `update apps
     set is_hot = true, hot_marked_at = now(), updated_at = now()
     where status = 'published'
       and is_hot = false
       and coalesce(upvote_count, 0) >= $1
     returning id`,
    [settings.hotThreshold],
  );
  if (rows.length > 0) {
    await audit(sql, "cron_promote_hot", `${rows.length} apps`, `Promoted to hot via upvotes cron (threshold: ${settings.hotThreshold})`);
  }
  return rows.length;
}
