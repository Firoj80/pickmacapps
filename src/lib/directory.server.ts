import { randomBytes, randomUUID } from "node:crypto";
import raw from "@/data/catalog.json";
import { shouldSeedCatalogApps } from "@/lib/app-seed";
import { findShelfCategory, shelfCategories, type ShelfCategory } from "@/lib/shelf-categories";
import { getSql, type Sql } from "@/lib/db";
import { checkBadgeOnPage } from "@/lib/badge";
import { createChoiceCheckout, invalidateDodoPriceCache, readDodoPrice, updateDodoPrice } from "@/lib/dodo.server";
import { cleanXHandle } from "@/lib/metadata.server";
import {
  isTelegramConfigured,
  notifyTelegramAdminAppCreated,
  notifyTelegramSubmission,
  type TelegramSubmissionInfo,
} from "@/lib/telegram.server";
import {
  HOT_APP_DURATION_DAYS,
  type AppItem,
  type FeaturedTier,
  type Post,
  type Pricing,
} from "@/lib/catalog";

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
  hot_scheduled_for?: string | Date | null;
  featured_scheduled_for?: string | Date | null;
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
  check_badge?: boolean;
  x_handle?: string | null;
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
    hotScheduledFor: row.hot_scheduled_for ? iso(row.hot_scheduled_for) : null,
    featuredScheduledFor: row.featured_scheduled_for ? iso(row.featured_scheduled_for) : null,
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
    checkBadge: asBool(row.check_badge),
    xHandle: row.x_handle || row.submitter_x || null,
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
    await sql.query("alter table apps add column if not exists check_badge boolean not null default false");
    await sql.query("alter table apps add column if not exists x_handle text not null default ''");
    await sql.query("alter table apps add column if not exists dashboard_token text unique");
    await sql.query("alter table apps add column if not exists hot_scheduled_for timestamptz");
    await sql.query("alter table apps add column if not exists featured_scheduled_for timestamptz");
    await sql.query("alter table submissions add column if not exists scheduled_for timestamptz");
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
    await sql.query("alter table apps add column if not exists check_badge boolean not null default false");
    await sql.query("alter table apps add column if not exists x_handle text not null default ''");
    await sql.query("alter table apps add column if not exists dashboard_token text unique");
    await sql.query("alter table apps add column if not exists hot_scheduled_for timestamptz");
    await sql.query("alter table apps add column if not exists featured_scheduled_for timestamptz");
    await sql.query("alter table submissions add column if not exists scheduled_for timestamptz");
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

export type PublishedDirectory = {
  apps: AppItem[];
  posts: Post[];
  editors: string[];
  categories: ShelfCategory[];
  tombstones: { slug: string; name?: string; category?: string }[];
};

let cachedDirectory: { data: PublishedDirectory; timestamp: number } | null = null;
const DIRECTORY_SERVER_CACHE_TTL_MS = 60 * 1000; // 60 seconds server-side in-memory cache

export function invalidatePublishedDirectoryCache() {
  cachedDirectory = null;
}

export async function publishedDirectory(): Promise<PublishedDirectory> {
  if (cachedDirectory && Date.now() - cachedDirectory.timestamp < DIRECTORY_SERVER_CACHE_TTL_MS) {
    return cachedDirectory.data;
  }

  try {
    const sql = await directorySql();
    // Run all 4 queries concurrently on Postgres
    const [appRows, guideRows, categoryRowsResult, tombRowsResult] = await Promise.all([
      sql.query<AppRow>(
        `select a.*, 0 as views_7d
         from apps a
         where a.status = 'published'
         order by a.created_at asc, a.name asc`,
      ),
      sql.query<GuideRow>("select * from guides where status = 'published' order by date desc"),
      sql
        .query<{
          slug: string;
          name: string;
          emoji: string;
          paragraphs: unknown;
          tips: unknown;
        }>("select slug, name, emoji, paragraphs, tips from categories order by sort_order asc, name asc")
        .catch((err) => {
          console.error("published categories failed:", err);
          return [];
        }),
      sql
        .query<{ slug: string; name: string | null; category: string | null }>(
          "select slug, name, category from app_tombstones",
        )
        .catch((err) => {
          console.error("published tombstones failed:", err);
          return [];
        }),
    ]);

    const apps = appRows.map(toApp);
    const categories: ShelfCategory[] = categoryRowsResult.length
      ? categoryRowsResult.map((row) => ({
          slug: row.slug,
          name: row.name,
          emoji: row.emoji,
          paragraphs: asStringList(row.paragraphs),
          tips: asStringList(row.tips),
          faqs: findShelfCategory(row.slug)?.faqs ?? [],
        }))
      : shelfCategories;

    const tombstones: { slug: string; name?: string; category?: string }[] = tombRowsResult.map((r) => ({
      slug: r.slug,
      name: r.name || undefined,
      category: r.category || undefined,
    }));

    const result: PublishedDirectory = {
      apps,
      posts: guideRows.map(toPost),
      editors: apps.filter((app) => app.editorChoice).map((app) => app.slug),
      categories,
      tombstones,
    };

    cachedDirectory = { data: result, timestamp: Date.now() };
    return result;
  } catch (err) {
    console.error("[directory] publishedDirectory DB query failed, using static fallback:", err);
    const seedApps = (raw.apps as unknown as AppItem[]).map((app) => ({
      ...app,
      editorChoice: Boolean(app.editorChoice),
      status: "published",
      badgeStatus: "verified",
      badgeDetail: "",
    }));
    return {
      apps: seedApps,
      posts: raw.posts as unknown as Post[],
      editors: seedApps.filter((app) => app.editorChoice).map((app) => app.slug),
      categories: shelfCategories,
      tombstones: [],
    };
  }
}

export const MAX_EDITOR_CHOICE_SLOTS = 6;
export const MAX_TIER_SLOTS = 6; // All 6 slots are Gold (Article) tier
export const MAX_HOT_SLOTS = 6; // Maximum 6 active slots for Hot apps
export const FEATURED_APP_DURATION_DAYS = 7;

export function getNextCycleLabel(now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + FEATURED_APP_DURATION_DAYS);
  const dayNum = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${dayNum} ${months[d.getMonth()]}`;
}

export function formatCycleDate(d: Date): string {
  if (isNaN(d.getTime())) return getNextCycleLabel();
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

export async function countActiveHotApps(excludeId?: string): Promise<number> {
  const sql = await directorySql();
  if (excludeId) {
    const rows = await sql.query<{ count: string }>(
      "select count(*)::text as count from apps where is_hot = true and status = 'published' and id <> $1",
      [excludeId],
    );
    return Number(rows[0]?.count ?? 0);
  }
  const rows = await sql.query<{ count: string }>(
    "select count(*)::text as count from apps where is_hot = true and status = 'published'",
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getPaidSlotDates(tier: "featured" | "article"): Promise<string[]> {
  const sql = await directorySql();
  if (tier === "featured") {
    const rows = await sql.query<{ hot_expires_at: string | Date | null }>(
      `select coalesce(hot_marked_at, created_at) + interval '7 days' as hot_expires_at
       from apps
       where is_hot = true
         and status = 'published'
         and coalesce(hot_marked_at, created_at) + interval '7 days' > now()
       order by coalesce(hot_marked_at, created_at) + interval '7 days' asc`,
    );
    return rows.map((r) => (r.hot_expires_at instanceof Date ? r.hot_expires_at.toISOString() : String(r.hot_expires_at)));
  }
  const rows = await sql.query<{ featured_until: string | Date | null }>(
    `select featured_until from apps
     where editor_choice = true
       and status = 'published'
       and coalesce(featured_tier, 'featured') = 'article'
       and featured_until is not null
       and featured_until > now()
     order by featured_until asc`,
  );
  return rows.map((r) => (r.featured_until instanceof Date ? r.featured_until.toISOString() : String(r.featured_until)));
}

export async function countQueuedPaidSubmissions(tier: "featured" | "article"): Promise<number> {
  const sql = await directorySql();
  const rows = await sql.query<{ count: string }>(
    `select count(*)::text as count
     from submissions
     where plan = 'choice'
       and tier = $1
       and status in ('paid', 'awaiting_payment')
       and created_at > now() - interval '7 days'`,
    [tier],
  );
  return Number(rows[0]?.count ?? 0);
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
  hotPriceCents?: number;
  hotCompareCents?: number;
  hotSlots?: EditorChoiceSlotsInfo;
  featuredSlots: EditorChoiceSlotsInfo;
  articleSlots: EditorChoiceSlotsInfo;
  slots: EditorChoiceSlotsInfo;
  priceCents: number;
  compareCents: number;
};

let cachedPublicOffer: { data: PublicOffer; timestamp: number } | null = null;
const PUBLIC_OFFER_CACHE_TTL_MS = 30 * 1000; // 30 seconds in-memory cache for fast SSR

export function invalidatePublicOfferCache() {
  cachedPublicOffer = null;
}

export async function publicOffer(): Promise<PublicOffer> {
  if (cachedPublicOffer && Date.now() - cachedPublicOffer.timestamp < PUBLIC_OFFER_CACHE_TTL_MS) {
    return cachedPublicOffer.data;
  }

  try {
    const sql = await directorySql();

    // Concurrently fetch settings, aggregated slot counts, slot expiration dates, and Dodo prices
    const [settingsRows, countsRows, datesRows, livePrices] = await Promise.all([
      sql.query<{ key: string; value: string }>("select key, value from settings"),
      sql.query<{
        active_total: string;
        active_featured: string;
        active_article: string;
        active_hot: string;
      }>(`
        select
          count(*) filter (where editor_choice = true and status = 'published')::text as active_total,
          count(*) filter (where editor_choice = true and status = 'published' and coalesce(featured_tier, 'featured') = 'featured')::text as active_featured,
          count(*) filter (where editor_choice = true and status = 'published' and coalesce(featured_tier, 'featured') = 'article')::text as active_article,
          count(*) filter (where is_hot = true and status = 'published')::text as active_hot
        from apps
      `),
      sql.query<{
        tier: string;
        featured_until: string | Date | null;
        is_hot: boolean;
        hot_expires_at: string | Date | null;
      }>(`
        select
          coalesce(featured_tier, 'featured') as tier,
          featured_until,
          is_hot,
          coalesce(hot_marked_at, created_at) + interval '7 days' as hot_expires_at
        from apps
        where status = 'published'
          and (
            (editor_choice = true and featured_until is not null and featured_until > now())
            or
            (is_hot = true and coalesce(hot_marked_at, created_at) + interval '7 days' > now())
          )
        order by coalesce(featured_until, coalesce(hot_marked_at, created_at) + interval '7 days') asc
      `),
      Promise.all([readDodoPrice("featured"), readDodoPrice("article")]),
    ]);

    const map = Object.fromEntries(settingsRows.map((row) => [row.key, row.value]));
    let featuredPriceCents = Number(map.featured_price_cents ?? map.choice_price_cents ?? 9900);
    const featuredCompareCents = Number(map.featured_compare_cents ?? map.choice_compare_cents ?? 19900);
    let articlePriceCents = Number(map.article_price_cents ?? 12000);
    const articleCompareCents = Number(map.article_compare_cents ?? 24900);
    let hotPriceCents = Number(map.hot_price_cents ?? map.featured_price_cents ?? map.choice_price_cents ?? 9900);
    const hotCompareCents = Number(map.hot_compare_cents ?? map.featured_compare_cents ?? map.choice_compare_cents ?? 19900);

    const [liveFeatured, liveArticle] = livePrices;
    if (liveFeatured != null && liveFeatured !== featuredPriceCents) {
      featuredPriceCents = liveFeatured;
      void sql
        .query(
          `insert into settings (key, value) values ('featured_price_cents', $1), ('choice_price_cents', $1)
           on conflict (key) do update set value = excluded.value`,
          [String(liveFeatured)],
        )
        .catch(() => {});
    }

    if (liveArticle != null && liveArticle !== articlePriceCents) {
      articlePriceCents = liveArticle;
      void sql
        .query(
          `insert into settings (key, value) values ('article_price_cents', $1)
           on conflict (key) do update set value = excluded.value`,
          [String(liveArticle)],
        )
        .catch(() => {});
    }

    const counts = countsRows[0] ?? { active_total: "0", active_featured: "0", active_article: "0", active_hot: "0" };
    const activeTotal = Number(counts.active_total ?? 0);
    const activeFeatured = Number(counts.active_featured ?? 0);
    const activeArticle = Number(counts.active_article ?? 0);
    const activeHot = Number(counts.active_hot ?? 0);

    const featuredOpenDates: string[] = [];
    const articleOpenDates: string[] = [];
    const hotOpenDates: string[] = [];
    for (const r of datesRows) {
      if (r.tier === "article" && r.featured_until) {
        const iso = r.featured_until instanceof Date ? r.featured_until.toISOString() : String(r.featured_until);
        articleOpenDates.push(iso);
      } else if (r.featured_until) {
        const iso = r.featured_until instanceof Date ? r.featured_until.toISOString() : String(r.featured_until);
        featuredOpenDates.push(iso);
      }
      if (r.is_hot && r.hot_expires_at) {
        const iso = r.hot_expires_at instanceof Date ? r.hot_expires_at.toISOString() : String(r.hot_expires_at);
        hotOpenDates.push(iso);
      }
    }

    const defaultNextDate = getNextCycleLabel();
    const articleNextDate =
      articleOpenDates.length > 0 && activeArticle >= MAX_EDITOR_CHOICE_SLOTS
        ? formatCycleDate(new Date(articleOpenDates[0]))
        : defaultNextDate;
    const hotNextDate =
      hotOpenDates.length > 0 && activeHot >= MAX_HOT_SLOTS
        ? formatCycleDate(new Date(hotOpenDates[0]))
        : defaultNextDate;

    const featuredRemaining = 0; // Blue (featured) tier discontinued — no new slots offered
    const articleRemaining = Math.max(0, MAX_EDITOR_CHOICE_SLOTS - activeArticle);
    const totalRemaining = Math.max(0, MAX_EDITOR_CHOICE_SLOTS - activeTotal);
    const hotRemaining = Math.max(0, MAX_HOT_SLOTS - activeHot);

    const featuredSlots: EditorChoiceSlotsInfo = {
      total: 0,
      active: activeFeatured,
      remaining: 0,
      isFull: true, // Blue tier discontinued — always full/closed
      nextDate: defaultNextDate,
      openDates: [],
    };

    const articleSlots: EditorChoiceSlotsInfo = {
      total: MAX_EDITOR_CHOICE_SLOTS,
      active: activeArticle,
      remaining: articleRemaining,
      isFull: articleRemaining === 0,
      nextDate: articleNextDate,
      openDates: articleOpenDates,
    };

    const hotSlots: EditorChoiceSlotsInfo = {
      total: MAX_HOT_SLOTS,
      active: activeHot,
      remaining: hotRemaining,
      isFull: hotRemaining === 0,
      nextDate: hotNextDate,
      openDates: hotOpenDates,
    };

    const result: PublicOffer = {
      featuredPriceCents,
      featuredCompareCents,
      articlePriceCents,
      articleCompareCents,
      hotPriceCents,
      hotCompareCents,
      featuredSlots,
      articleSlots,
      hotSlots,
      priceCents: featuredPriceCents,
      compareCents: featuredCompareCents,
      slots: {
        total: MAX_EDITOR_CHOICE_SLOTS,
        active: activeTotal,
        remaining: totalRemaining,
        isFull: totalRemaining === 0,
        nextDate: defaultNextDate,
        openDates: [...featuredOpenDates, ...articleOpenDates].sort(),
      },
    };

    cachedPublicOffer = { data: result, timestamp: Date.now() };
    return result;
  } catch (err) {
    console.error("[directory] publicOffer DB query failed, using defaults:", err);
    const nextDate = getNextCycleLabel();
    const fallbackArticleSlots: EditorChoiceSlotsInfo = {
      total: MAX_EDITOR_CHOICE_SLOTS,
      active: 0,
      remaining: MAX_EDITOR_CHOICE_SLOTS,
      isFull: false,
      nextDate,
      openDates: [],
    };
    const fallbackFeaturedSlots: EditorChoiceSlotsInfo = {
      total: 0,
      active: 0,
      remaining: 0,
      isFull: true,
      nextDate,
      openDates: [],
    };
    const fallbackHotSlots: EditorChoiceSlotsInfo = {
      total: MAX_HOT_SLOTS,
      active: 0,
      remaining: MAX_HOT_SLOTS,
      isFull: false,
      nextDate,
      openDates: [],
    };
    return {
      featuredPriceCents: 9900,
      featuredCompareCents: 19900,
      articlePriceCents: 12000,
      articleCompareCents: 24900,
      hotPriceCents: 9900,
      hotCompareCents: 19900,
      featuredSlots: fallbackFeaturedSlots,
      articleSlots: fallbackArticleSlots,
      hotSlots: fallbackHotSlots,
      priceCents: 9900,
      compareCents: 19900,
      slots: {
        total: MAX_EDITOR_CHOICE_SLOTS,
        active: 0,
        remaining: MAX_EDITOR_CHOICE_SLOTS,
        isFull: false,
        nextDate,
        openDates: [],
      },
    };
  }
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
  let scheduledHotApps: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    hotScheduledFor: string | null;
    submitter: string | null;
  }[] = [];
  let scheduledGoldApps: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    featuredScheduledFor: string | null;
    submitter: string | null;
  }[] = [];
  let queuedPaidBookings: {
    id: string;
    appName: string;
    website: string;
    icon: string;
    tier: string;
    submitter: string;
    createdAt: string;
  }[] = [];
  let blueOccupants: { id: string; name: string; slug: string; icon: string; featuredUntil: string | null }[] = [];
  let goldOccupants: { id: string; name: string; slug: string; icon: string; featuredUntil: string | null }[] = [];
  try {
    await expireOldHotApps().catch(() => {});
    await sql.query("update apps set hot_marked_at = now() where is_hot = true and hot_marked_at is null");
    const hotRows = await sql.query<{ id: string; name: string; slug: string; icon: string; hot_marked_at: string | Date | null }>(
      "select id, name, slug, icon, hot_marked_at from apps where status = 'published' and is_hot = true order by created_at asc",
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

    const schedHotRows = await sql.query<{
      id: string;
      name: string;
      slug: string;
      icon: string;
      hot_scheduled_for: string | Date | null;
      submitter_email: string | null;
      submitter_x: string | null;
    }>(
      `select id, name, slug, icon, hot_scheduled_for, submitter_email, submitter_x
       from apps
       where status = 'published'
         and is_hot = false
         and hot_scheduled_for is not null
       order by hot_scheduled_for asc`,
    );
    scheduledHotApps = schedHotRows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      icon: r.icon,
      hotScheduledFor: r.hot_scheduled_for
        ? (r.hot_scheduled_for instanceof Date ? r.hot_scheduled_for.toISOString() : String(r.hot_scheduled_for))
        : null,
      submitter: r.submitter_x || r.submitter_email || null,
    }));

    const schedGoldRows = await sql.query<{
      id: string;
      name: string;
      slug: string;
      icon: string;
      featured_scheduled_for: string | Date | null;
      submitter_email: string | null;
      submitter_x: string | null;
    }>(
      `select id, name, slug, icon, featured_scheduled_for, submitter_email, submitter_x
       from apps
       where status = 'published'
         and editor_choice = false
         and featured_scheduled_for is not null
       order by featured_scheduled_for asc`,
    );
    scheduledGoldApps = schedGoldRows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      icon: r.icon,
      featuredScheduledFor: r.featured_scheduled_for
        ? (r.featured_scheduled_for instanceof Date ? r.featured_scheduled_for.toISOString() : String(r.featured_scheduled_for))
        : null,
      submitter: r.submitter_x || r.submitter_email || null,
    }));

    const queuedRows = await sql.query<{
      id: string;
      app_name: string;
      website: string;
      icon: string;
      tier: string;
      email: string;
      x_handle: string;
      created_at: string | Date;
    }>(
      `select id, app_name, website, icon, tier, email, x_handle, created_at
       from submissions
       where plan = 'choice'
         and status = 'paid'
       order by created_at asc`,
    );
    queuedPaidBookings = queuedRows.map((r) => ({
      id: r.id,
      appName: r.app_name,
      website: r.website,
      icon: r.icon,
      tier: r.tier,
      submitter: r.x_handle || r.email || "",
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
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

  let recentAudit: {
    id: string;
    actor: string;
    action: string;
    target: string;
    detail: string;
    createdAt: string;
  }[] = [];
  try {
    const auditRows = await sql.query<{
      id: string;
      actor: string;
      action: string;
      target: string;
      detail: string;
      created_at: string | Date;
    }>("select id, actor, action, target, detail, created_at from audit_log order by created_at desc limit 5");
    recentAudit = auditRows.map((r) => ({
      id: r.id,
      actor: r.actor,
      action: r.action,
      target: r.target,
      detail: r.detail,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }));
  } catch (err) {
    console.error("adminStats recentAudit error:", err);
  }

  const topPerforming = live
    .slice()
    .sort(
      (a, b) =>
        Number(b.try_count ?? 0) * 3 +
        Number(b.click_count ?? 0) -
        (Number(a.try_count ?? 0) * 3 + Number(a.click_count ?? 0)),
    )
    .slice(0, 3)
    .map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      icon: a.icon,
      clickCount: Number(a.click_count ?? 0),
      tryCount: Number(a.try_count ?? 0),
      category: a.category_name,
    }));

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
    scheduledHotApps,
    scheduledGoldApps,
    queuedPaidBookings,
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
    recentAudit,
    topPerforming,
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
  if (nextHot) {
    const activeHot = await countActiveHotApps(id);
    if (activeHot >= MAX_HOT_SLOTS) {
      throw new Error(
        `Cannot mark as Hot: All ${MAX_HOT_SLOTS} slots are currently filled (${activeHot}/${MAX_HOT_SLOTS} active). Please remove another app from Hot first.`,
      );
    }
  }
  await sql.query(
    "update apps set is_hot = $1, hot_marked_at = case when $1 then now() else null end, updated_at = now() where id = $2",
    [nextHot, id],
  );
  invalidatePublishedDirectoryCache();
  invalidatePublicOfferCache();
  await audit(sql, nextHot ? "mark_hot" : "unmark_hot", id, `Hot set to ${nextHot}`);
  return { id, isHot: nextHot };
}

export async function publishAllUnpublishedApps() {
  const sql = await directorySql();
  const res = await sql.query<{ id: string }>(
    "update apps set status = 'published', updated_at = now() where status = 'unpublished' or status = 'pending' returning id",
  );
  invalidatePublishedDirectoryCache();
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
  checkBadge?: boolean;
  xHandle?: string;
  status?: string;
  scheduleHotNextCycle?: boolean;
  hotScheduledFor?: string | null;
  scheduleGoldNextCycle?: boolean;
  featuredScheduledFor?: string | null;
}) {
  const sql = await directorySql();
  const id = randomUUID();
  const dashboardToken = randomBytes(24).toString("hex");
  let slug = (input.slug?.trim() || input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-+|-+$/g, "");
  if (!slug) slug = `app-${id.slice(0, 8)}`;

  const existing = await sql.query<{ id: string }>("select id from apps where slug = $1 limit 1", [slug]);
  if (existing.length > 0) {
    slug = `${slug}-${id.slice(0, 4)}`;
  }

  const status = cleanStatus(input.status || "published");
  const offer = await publicOffer();
  const nextHotIso = input.hotScheduledFor || offer.hotSlots.openDates[0] || new Date(Date.now() + 7 * 86400000).toISOString();
  const nextGoldIso = input.featuredScheduledFor || offer.articleSlots.openDates[0] || new Date(Date.now() + 7 * 86400000).toISOString();

  let hotScheduledFor: string | null = null;
  let isHot = input.isHot === true;
  if (input.scheduleHotNextCycle) {
    isHot = false;
    hotScheduledFor = nextHotIso;
  } else if (isHot && status === "published") {
    const hotActive = await countActiveHotApps();
    if (hotActive >= MAX_HOT_SLOTS) {
      throw new Error(`Cannot mark as Hot: All ${MAX_HOT_SLOTS} slots are currently filled (${hotActive}/${MAX_HOT_SLOTS} active). Please choose 'Schedule for Next Week'.`);
    }
  }

  let featuredScheduledFor: string | null = null;
  let isChoice = input.editorChoice === true;
  let tier = isChoice ? (input.featuredTier === "article" ? "article" : "featured") : (input.scheduleGoldNextCycle ? "article" : null);

  if (input.scheduleGoldNextCycle) {
    isChoice = false;
    tier = "article";
    featuredScheduledFor = nextGoldIso;
  } else if (isChoice && status === "published" && tier) {
    const tierActive = await countActiveTierApps(tier);
    if (tierActive >= MAX_TIER_SLOTS) {
      const tierName = tier === "article" ? "Featured + Medium Article (Gold)" : "Featured Placement (Blue)";
      throw new Error(`Cannot enable ${tierName}: All ${MAX_TIER_SLOTS} slots for this tier are already taken (${tierActive}/${MAX_TIER_SLOTS} active). Please choose 'Schedule for Next Week'.`);
    }
  }

  const foundCategory = findShelfCategory(input.category);
  const category = {
    slug: foundCategory?.slug ?? "utility",
    name: foundCategory?.name ?? "Utility",
    emoji: foundCategory?.emoji ?? "🔧",
  };

  const xHandleClean = (input.xHandle || "").trim().replace(/^@/, "");

  await sql.query(
    `insert into apps (
      id, name, slug, tagline, description, icon, website, pricing, category, category_name, category_icon,
      editor_choice, featured_tier, featured_until, is_hot, hot_marked_at, hot_scheduled_for, featured_scheduled_for,
      status, demo, is_user_submitted, check_badge, x_handle, submitter_x, dashboard_token, created_at, updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, case when $12 then now() + interval '7 days' else null end, $14, case when $14 then now() else null end, $15, $16, $17, $18, false, $19, $20, $21, $22, now(), now())`,
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
      isHot,
      hotScheduledFor,
      featuredScheduledFor,
      status,
      input.demo?.trim() || "",
      input.checkBadge === true,
      xHandleClean,
      xHandleClean,
      dashboardToken,
    ],
  );
  await sql.query("delete from app_tombstones where slug = $1", [slug]);
  invalidatePublicOfferCache();
  invalidatePublishedDirectoryCache();
  await audit(sql, "create_app", slug, `Admin created app "${input.name}"`);

  await notifyTelegramAdminAppCreated({
    id,
    name: input.name.trim(),
    slug,
    tagline: input.tagline.trim(),
    website: input.website.trim(),
    pricing: cleanPricing(input.pricing),
    category: category.name,
    xHandle: xHandleClean,
    dashboardToken,
    editorChoice: isChoice,
    featuredTier: tier,
    isHot: input.isHot === true,
  }).catch((err) => {
    console.error("[telegram] notify admin app created failed:", err);
  });

  return { id, slug, dashboardToken };
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
  const [otherTotal, otherFeatured, otherArticle, otherHot, offer] = await Promise.all([
    countActiveEditorChoiceApps(id),
    countActiveTierApps("featured", id),
    countActiveTierApps("article", id),
    countActiveHotApps(id),
    publicOffer(),
  ]);
  return {
    ...toApp(rows[0]),
    otherEditorChoiceCount: otherTotal,
    editorChoiceSlotsFull: otherTotal >= MAX_EDITOR_CHOICE_SLOTS,
    otherFeaturedCount: otherFeatured,
    featuredSlotsFull: true, // Blue tier discontinued — always full
    otherArticleCount: otherArticle,
    articleSlotsFull: otherArticle >= MAX_EDITOR_CHOICE_SLOTS,
    otherHotCount: otherHot,
    hotSlotsFull: otherHot >= MAX_HOT_SLOTS,
    nextHotDate: offer.hotSlots.nextDate,
    nextGoldDate: offer.articleSlots.nextDate,
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
  checkBadge?: boolean;
  xHandle?: string;
  status: string;
  scheduleHotNextCycle?: boolean;
  hotScheduledFor?: string | null;
  clearHotSchedule?: boolean;
  scheduleGoldNextCycle?: boolean;
  featuredScheduledFor?: string | null;
  clearGoldSchedule?: boolean;
}) {
  const sql = await directorySql();
  const current = await sql.query<AppRow>("select * from apps where id = $1", [input.id]);
  const row = current[0];
  if (!row) throw new Error("App not found");
  const status = cleanStatus(input.status);

  const offer = await publicOffer();
  const nextHotIso = input.hotScheduledFor || offer.hotSlots.openDates[0] || new Date(Date.now() + 7 * 86400000).toISOString();
  const nextGoldIso = input.featuredScheduledFor || offer.articleSlots.openDates[0] || new Date(Date.now() + 7 * 86400000).toISOString();

  let hotScheduledFor: string | null = row.hot_scheduled_for
    ? (row.hot_scheduled_for instanceof Date ? row.hot_scheduled_for.toISOString() : String(row.hot_scheduled_for))
    : null;
  let isHot = input.isHot === true;

  if (input.clearHotSchedule) {
    hotScheduledFor = null;
  } else if (input.scheduleHotNextCycle) {
    isHot = false;
    hotScheduledFor = nextHotIso;
  } else if (input.hotScheduledFor !== undefined) {
    hotScheduledFor = input.hotScheduledFor;
  }

  if (isHot && status === "published") {
    const hotActive = await countActiveHotApps(input.id);
    if (hotActive >= MAX_HOT_SLOTS) {
      throw new Error(
        `Cannot mark as Hot: All ${MAX_HOT_SLOTS} slots are currently filled by other published apps (${hotActive}/${MAX_HOT_SLOTS} active). Please choose 'Schedule for Next Week' or unmark another app first.`
      );
    }
    hotScheduledFor = null;
  }

  let featuredScheduledFor: string | null = row.featured_scheduled_for
    ? (row.featured_scheduled_for instanceof Date ? row.featured_scheduled_for.toISOString() : String(row.featured_scheduled_for))
    : null;
  let isChoice = input.editorChoice;
  let tier = isChoice ? (input.featuredTier === "article" ? "article" : "featured") : (input.scheduleGoldNextCycle ? "article" : null);

  if (input.clearGoldSchedule) {
    featuredScheduledFor = null;
  } else if (input.scheduleGoldNextCycle) {
    isChoice = false;
    tier = "article";
    featuredScheduledFor = nextGoldIso;
  } else if (input.featuredScheduledFor !== undefined) {
    featuredScheduledFor = input.featuredScheduledFor;
  }

  if (isChoice && status === "published" && tier) {
    const tierActive = await countActiveTierApps(tier, input.id);
    if (tierActive >= MAX_TIER_SLOTS) {
      const tierName = tier === "article" ? "Featured + Medium Article (Gold)" : "Featured Placement (Blue)";
      throw new Error(
        `Cannot enable ${tierName}: All ${MAX_TIER_SLOTS} slots for this tier are already taken by other published apps (${tierActive}/${MAX_TIER_SLOTS} active). Please choose 'Schedule for Next Week' or uncheck another app first.`
      );
    }
    featuredScheduledFor = null;
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

  const cleanX = input.xHandle !== undefined ? input.xHandle.trim().replace(/^@/, "") : (row.x_handle ?? "");

  await sql.query(
    `update apps set name = $2, slug = $3, tagline = $4, description = $5, website = $6, pricing = $7,
      category = $8, category_name = $9, category_icon = $10, editor_choice = $11,
      featured_tier = $12,
      featured_until = case when $11 then coalesce(featured_until, now() + interval '7 days') else null end,
      status = $13, icon = $14, demo = $15, is_hot = $16,
      hot_marked_at = case when $16 then coalesce(hot_marked_at, now()) else null end,
      check_badge = $17, x_handle = $18, submitter_x = coalesce(nullif($18, ''), submitter_x),
      hot_scheduled_for = $19,
      featured_scheduled_for = $20,
      updated_at = now()
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
      isChoice,
      tier,
      status,
      input.icon.trim(),
      input.demo.trim(),
      isHot,
      input.checkBadge !== undefined ? input.checkBadge === true : Boolean(row.check_badge),
      cleanX,
      hotScheduledFor,
      featuredScheduledFor,
    ],
  );
  invalidatePublicOfferCache();
  invalidatePublishedDirectoryCache();
  await audit(sql, "save-app", input.slug, status);
}

export async function generateAppDashboardToken(appId: string): Promise<string> {
  const sql = await directorySql();
  const existing = await sql.query<{ dashboard_token: string | null }>(
    "select dashboard_token from apps where id = $1 limit 1",
    [appId],
  );
  if (existing[0]?.dashboard_token) {
    return existing[0].dashboard_token;
  }
  const token = randomBytes(24).toString("hex");
  await sql.query(
    "update apps set dashboard_token = $2, updated_at = now() where id = $1",
    [appId, token],
  );
  return token;
}

export async function regenerateAppDashboardToken(appId: string): Promise<string> {
  const sql = await directorySql();
  const token = randomBytes(24).toString("hex");
  await sql.query(
    "update apps set dashboard_token = $2, updated_at = now() where id = $1",
    [appId, token],
  );
  return token;
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
  invalidatePublicOfferCache();
  invalidatePublishedDirectoryCache();
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
  invalidatePublishedDirectoryCache();
  await audit(sql, "save-guide", slug, status);
  return slug;
}

export async function deleteGuide(slug: string) {
  const sql = await directorySql();
  await sql.query("delete from guides where slug = $1", [slug]);
  invalidatePublishedDirectoryCache();
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
      `insert into settings (key, value) values ('choice_price_cents', $1), ('choice_compare_cents', $2), ('hot_price_cents', $1), ('hot_compare_cents', $2)
       on conflict (key) do update set value = excluded.value`,
      [String(amountCents), String(compareCents)],
    );
  }
  invalidatePublicOfferCache();
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
  const offer = await publicOffer();
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
  if (!row) {
    const appRows = await sql.query<{
      id: string;
      name: string;
      slug: string;
      tagline: string;
      website: string;
      pricing: string;
      category: string;
      editor_choice: boolean;
      featured_tier: string | null;
      x_handle: string | null;
      submitter_x: string | null;
      dashboard_token: string | null;
      status: string;
    }>(
      `select id, name, slug, tagline, website, pricing, category, editor_choice, featured_tier, x_handle, submitter_x, dashboard_token, status
         from apps
        where id = $1
        limit 1`,
      [id],
    );
    const app = appRows[0];
    if (!app) return null;
    return {
      id: app.id,
      appName: app.name,
      website: app.website,
      tagline: app.tagline,
      email: "",
      xHandle: app.x_handle || app.submitter_x || undefined,
      plan: app.editor_choice ? "choice" : "free",
      tier: app.featured_tier || "featured",
      pricing: app.pricing || undefined,
      category: app.category || undefined,
      badgeOk: true,
      status: app.status || "approved",
      approvedSlug: app.slug,
      existingSlug: app.slug,
      isUpdate: false,
      dashboardToken: app.dashboard_token || undefined,
      hotSlots: offer.hotSlots,
      articleSlots: offer.articleSlots,
    };
  }
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
    hotSlots: offer.hotSlots,
    articleSlots: offer.articleSlots,
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
    currency?: string;
    coupon?: string;
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
    const isHotTier = tier === "featured";
    if (isHotTier) {
      const activeHotSlots = await countActiveHotApps();
      const queuedHot = await countQueuedPaidSubmissions("featured");
      // Allow booking for next cycle: up to MAX_HOT_SLOTS * 2 (current active + next week queue)
      if (activeHotSlots + queuedHot >= MAX_HOT_SLOTS * 2) {
        return {
          ok: false as const,
          message: `All spots for Hot Boost are currently booked for this and the upcoming cycle. Please check back soon or submit using Free plan.`,
        };
      }
    } else {
      const activeTierSlots = await countActiveTierApps("article");
      const queuedTier = await countQueuedPaidSubmissions("article");
      // Allow booking for next cycle: up to MAX_TIER_SLOTS * 2 (current active + next week queue)
      if (activeTierSlots + queuedTier >= MAX_TIER_SLOTS * 2) {
        return {
          ok: false as const,
          message: `All spots for Gold Spotlight are currently booked for this and the upcoming cycle. Please check back soon or submit using Free plan.`,
        };
      }
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
  const currentOffer = await publicOffer();
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
    hotSlots: currentOffer.hotSlots,
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
    const isBfcm = input.coupon?.trim().toUpperCase() === "BFCM50";
    const checkout = await createChoiceCheckout({
      submissionId: id,
      email,
      name,
      returnUrl: `${origin}/dashboard/${submissionToken}?paid=1`,
      tier: tier === "article" ? "article" : "featured",
      currency: input.currency,
      discountCode: isBfcm ? "BFCM50" : undefined,
      mlVisitorId: attribution?.mlVisitorId,
      mlSessionId: attribution?.mlSessionId,
    });
    if (checkout.paymentId) {
      const offer = await publicOffer();
      let amountCents = tier === "article" ? offer.articlePriceCents : offer.featuredPriceCents;
      if (isBfcm) {
        amountCents = Math.round(amountCents * 0.5);
      }
      const paymentCurrency = (input.currency && input.currency.trim().toUpperCase()) || "USD";
      await sql.query(
        `insert into payments (id, submission_id, provider_payment_id, amount_cents, currency, status)
         values ($1,$2,$3,$4,$5,'pending')`,
        [randomUUID(), id, checkout.paymentId, amountCents, paymentCurrency],
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
    const currentOffer = await publicOffer();
    const paidTelegramInfo: TelegramSubmissionInfo = {
      ...paidSubmission,
      hotSlots: currentOffer.hotSlots,
    };
    await notifyTelegramSubmission(paidTelegramInfo, "payment_succeeded").catch((err) => {
      console.error("[telegram] notify paid confirmation failed:", err);
    });
  }
}

export async function approveSubmission(
  id: string,
  options?: {
    approvedBy?: string;
    makeHot?: boolean;
    scheduleHot?: boolean;
    makeGold?: boolean;
    scheduleGold?: boolean;
  },
) {
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

  const isChoice = submission.plan === "choice";
  const isChoiceHot = isChoice && submission.tier === "featured";
  const isChoiceGold = isChoice && submission.tier === "article";

  if (isChoice && submission.status !== "paid") {
    throw new Error("Editor’s Choice can be approved only after Dodo confirms payment.");
  }

  if (!isChoice) {
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

  const activeHot = await countActiveHotApps(submission.app_id ?? undefined);
  const hotSlotsFull = activeHot >= MAX_HOT_SLOTS;

  const activeGold = await countActiveTierApps("article", submission.app_id ?? undefined);
  const goldSlotsFull = activeGold >= MAX_TIER_SLOTS;

  const offer = await publicOffer();
  const nextHotDate = offer.hotSlots.nextDate;
  const nextGoldDate = offer.articleSlots.nextDate;
  const nextHotIso = offer.hotSlots.openDates[0] || new Date(Date.now() + 7 * 86400000).toISOString();
  const nextGoldIso = offer.articleSlots.openDates[0] || new Date(Date.now() + 7 * 86400000).toISOString();

  const wantsHot = isChoiceHot || Boolean(options?.makeHot) || Boolean(options?.scheduleHot);

  let shouldBeHot = false;
  let hotScheduledFor: string | null = null;
  let isHotScheduled = false;

  if (options?.scheduleHot || (wantsHot && hotSlotsFull)) {
    // Either explicitly scheduled for next cycle or hot slots are full: schedule it!
    shouldBeHot = false;
    hotScheduledFor = nextHotIso;
    isHotScheduled = true;
  } else if (wantsHot) {
    shouldBeHot = true;
    hotScheduledFor = null;
  }

  const wantsGold = isChoiceGold || Boolean(options?.makeGold) || Boolean(options?.scheduleGold);

  let shouldBeEditorChoice = false;
  let shouldBeTier: string | null = null;
  let featuredScheduledFor: string | null = null;
  let isGoldScheduled = false;

  if (wantsGold) {
    if (options?.scheduleGold || goldSlotsFull) {
      shouldBeEditorChoice = false;
      shouldBeTier = "article";
      featuredScheduledFor = nextGoldIso;
      isGoldScheduled = true;
    } else {
      shouldBeEditorChoice = true;
      shouldBeTier = "article";
      featuredScheduledFor = null;
    }
  }

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
    const updatedEditorChoice = wantsGold ? shouldBeEditorChoice : existingApp.editor_choice;
    const updatedTier = wantsGold ? "article" : (wantsHot ? null : existingApp.featured_tier);
    const updatedIsHot = wantsHot ? shouldBeHot : existingApp.is_hot;

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
          when $11 and not editor_choice then now() + interval '7 days'
          when $11 and editor_choice and (featured_until is null or featured_until < now()) then now() + interval '7 days'
          when not $11 then null
          else featured_until
        end,
        is_hot = $13,
        hot_marked_at = case
          when $13 and not is_hot then now()
          when not $13 then null
          else hot_marked_at
        end,
        hot_scheduled_for = $14,
        featured_scheduled_for = $15,
        submitter_email = coalesce(nullif($16, ''), submitter_email),
        submitter_x = coalesce(nullif($17, ''), submitter_x),
        dashboard_token = coalesce(dashboard_token, $18),
        status = 'published',
        badge_misses = 0,
        updated_at = now()
      where id = $19`,
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
        updatedIsHot,
        hotScheduledFor,
        featuredScheduledFor,
        submission.email,
        submission.x_handle || "",
        dashboardToken,
        existingApp.id,
      ],
    );

    await sql.query("delete from app_tombstones where slug = $1", [existingApp.slug]);
    await sql.query("update submissions set status = 'approved', app_id = $2 where id = $1", [id, existingApp.id]);
    invalidatePublicOfferCache();
    invalidatePublishedDirectoryCache();
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
      isHot: updatedIsHot,
      isHotScheduled,
      isGold: updatedEditorChoice,
      isGoldScheduled,
      scheduledDate: isHotScheduled ? nextHotDate : isGoldScheduled ? nextGoldDate : undefined,
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
      editor_choice, featured_tier, featured_until, is_hot, hot_marked_at, hot_scheduled_for, featured_scheduled_for, demo, status, submitter_email, submitter_x, is_user_submitted, dashboard_token
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,case when $12 then now() + interval '7 days' else null end,$14,case when $14 then now() else null end,$15,$16,$17,'published',$18,$19,true,$20)`,
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
      shouldBeEditorChoice,
      shouldBeTier,
      shouldBeHot,
      hotScheduledFor,
      featuredScheduledFor,
      submission.demo || "",
      submission.email,
      submission.x_handle || "",
      dashboardToken,
    ],
  );

  await sql.query("delete from app_tombstones where slug = $1", [slug]);
  await sql.query("update submissions set status = 'approved', app_id = $2 where id = $1", [id, appId]);
  invalidatePublicOfferCache();
  invalidatePublishedDirectoryCache();
  await audit(sql, "approve_submission", slug, submission.plan);
  return {
    id: appId,
    slug,
    name: submission.app_name,
    categorySlug: category.slug,
    isUpdate: false,
    isChoice,
    tier: shouldBeTier,
    dashboardToken,
    isHot: shouldBeHot,
    isHotScheduled,
    isGold: shouldBeEditorChoice,
    isGoldScheduled,
    scheduledDate: isHotScheduled ? nextHotDate : isGoldScheduled ? nextGoldDate : undefined,
  };
}

export async function runBadgeChecks() {
  const sql = await directorySql();
  const rows = await sql.query<AppRow>(
    "select * from apps where status in ('published', 'unpublished') and editor_choice = false and is_hot = false and (is_user_submitted = true or check_badge = true)",
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
// Hot Auto-Expiry (7 days)
// -------------------------------------------------------------
export { HOT_APP_DURATION_DAYS };

export async function expireOldHotApps(): Promise<number> {
  const sql = await directorySql();
  const rows = await sql.query<{ id: string }>(
    `update apps
     set is_hot = false, hot_marked_at = null, updated_at = now()
     where is_hot = true
       and hot_marked_at is not null
       and hot_marked_at < now() - interval '${HOT_APP_DURATION_DAYS} days'
     returning id`,
  );
  if (rows.length > 0) {
    invalidatePublishedDirectoryCache();
    await audit(sql, "expire_hot", `${rows.length} apps`, `Expired hot tags older than ${HOT_APP_DURATION_DAYS} days`);
  }

  // Activate any scheduled Hot apps whose scheduled time has arrived and slot is open
  try {
    const activeHotCount = await countActiveHotApps();
    const availableSlots = Math.max(0, MAX_HOT_SLOTS - activeHotCount);
    if (availableSlots > 0) {
      const readyApps = await sql.query<{ id: string; name: string }>(
        `select id, name from apps
         where status = 'published'
           and is_hot = false
           and hot_scheduled_for is not null
           and hot_scheduled_for <= now()
         order by hot_scheduled_for asc
         limit $1`,
        [availableSlots],
      );
      for (const app of readyApps) {
        await sql.query(
          `update apps
           set is_hot = true, hot_marked_at = now(), hot_scheduled_for = null, updated_at = now()
           where id = $1`,
          [app.id],
        );
        await audit(sql, "activate_scheduled_hot", app.name, "Promoted scheduled Hot app to active");
      }
      if (readyApps.length > 0) {
        invalidatePublishedDirectoryCache();
      }
    }
  } catch (err) {
    console.error("Auto-activating scheduled hot apps failed:", err);
  }

  // Activate any scheduled Gold apps whose scheduled time has arrived and slot is open
  try {
    const activeGoldCount = await countActiveTierApps("article");
    const availableGold = Math.max(0, MAX_TIER_SLOTS - activeGoldCount);
    if (availableGold > 0) {
      const readyGold = await sql.query<{ id: string; name: string }>(
        `select id, name from apps
         where status = 'published'
           and editor_choice = false
           and featured_scheduled_for is not null
           and featured_scheduled_for <= now()
         order by featured_scheduled_for asc
         limit $1`,
        [availableGold],
      );
      for (const app of readyGold) {
        await sql.query(
          `update apps
           set editor_choice = true, featured_tier = 'article', featured_until = now() + interval '7 days', featured_scheduled_for = null, updated_at = now()
           where id = $1`,
          [app.id],
        );
        await audit(sql, "activate_scheduled_gold", app.name, "Promoted scheduled Gold app to active");
      }
      if (readyGold.length > 0) {
        invalidatePublishedDirectoryCache();
      }
    }
  } catch (err) {
    console.error("Auto-activating scheduled gold apps failed:", err);
  }

  return rows.length;
}

// -------------------------------------------------------------
// Click & Try-App Tracking
// -------------------------------------------------------------
export type RecordClickResult = {
  ok: boolean;
  clickCount: number;
  tryCount: number;
  totalClicks: number;
};

export async function recordAppClick(
  appIdOrSlug: string,
  type: "click" | "try",
): Promise<RecordClickResult> {
  if (!appIdOrSlug || typeof appIdOrSlug !== "string") {
    return { ok: false, clickCount: 0, tryCount: 0, totalClicks: 0 };
  }
  const cleanTarget = appIdOrSlug.trim();
  const sql = await directorySql();
  const column = type === "try" ? "try_count" : "click_count";
  const rows = await sql.query<AppRow>(
    `update apps
     set ${column} = coalesce(${column}, 0) + 1, updated_at = now()
     where id = $1 or slug = $1
     returning id, click_count, try_count`,
    [cleanTarget],
  );
  if (rows.length > 0) {
    invalidatePublishedDirectoryCache();
    const clickCount = Number(rows[0].click_count ?? 0);
    const tryCount = Number(rows[0].try_count ?? 0);
    return {
      ok: true,
      clickCount,
      tryCount,
      totalClicks: clickCount + tryCount,
    };
  }
  return { ok: false, clickCount: 0, tryCount: 0, totalClicks: 0 };
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
  invalidatePublishedDirectoryCache();
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

let cachedUpvoteSettings: { data: UpvoteSettings; timestamp: number } | null = null;
const UPVOTE_SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory cache

export function invalidateUpvoteSettingsCache() {
  cachedUpvoteSettings = null;
}

export async function getUpvoteSettings(): Promise<UpvoteSettings> {
  if (cachedUpvoteSettings && Date.now() - cachedUpvoteSettings.timestamp < UPVOTE_SETTINGS_CACHE_TTL_MS) {
    return cachedUpvoteSettings.data;
  }
  const sql = await directorySql();
  const rows = await sql.query<{ key: string; value: string }>(
    "select key, value from settings where key in ('upvotes_enabled', 'upvote_auto_hot_enabled', 'upvote_hot_threshold')",
  );
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const result: UpvoteSettings = {
    upvotesEnabled: map.upvotes_enabled === undefined ? true : asBool(map.upvotes_enabled),
    autoHotEnabled: map.upvote_auto_hot_enabled === undefined ? true : asBool(map.upvote_auto_hot_enabled),
    hotThreshold: Number(map.upvote_hot_threshold ?? 15) || 15,
  };
  cachedUpvoteSettings = { data: result, timestamp: Date.now() };
  return result;
}

export async function updateUpvoteSettings(settings: Partial<UpvoteSettings>): Promise<void> {
  invalidateUpvoteSettingsCache();
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
    const activeHot = await countActiveHotApps();
    if (activeHot < MAX_HOT_SLOTS) {
      await sql.query(
        "update apps set is_hot = true, hot_marked_at = now(), updated_at = now() where id = $1",
        [appId],
      );
      invalidatePublishedDirectoryCache();
      await audit(sql, "auto_promote_hot", appId, `Auto-promoted to Hot via ${newCount} upvotes (threshold: ${settings.hotThreshold})`);
      promotedToHot = true;
    } else {
      const offer = await publicOffer();
      const nextHotIso = offer.hotSlots.openDates[0] || new Date(Date.now() + 7 * 86400000).toISOString();
      await sql.query(
        "update apps set hot_scheduled_for = $2, updated_at = now() where id = $1 and hot_scheduled_for is null",
        [appId, nextHotIso],
      );
      await audit(sql, "auto_schedule_hot", appId, `Hot slots full (6/6). Scheduled for next cycle ${nextHotIso} via ${newCount} upvotes`);
    }
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

  const activeHot = await countActiveHotApps();
  const availableSlots = Math.max(0, MAX_HOT_SLOTS - activeHot);
  if (availableSlots <= 0) return 0;

  const rows = await sql.query<{ id: string }>(
    `update apps
     set is_hot = true, hot_marked_at = now(), updated_at = now()
     where id in (
       select id from apps
       where status = 'published'
         and is_hot = false
         and coalesce(upvote_count, 0) >= $1
       order by upvote_count desc, created_at asc
       limit $2
     )
     returning id`,
    [settings.hotThreshold, availableSlots],
  );
  if (rows.length > 0) {
    invalidatePublishedDirectoryCache();
    await audit(sql, "cron_promote_hot", `${rows.length} apps`, `Promoted to hot via upvotes cron (threshold: ${settings.hotThreshold})`);
  }
  return rows.length;
}
