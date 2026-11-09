import { randomUUID } from "node:crypto";
import raw from "@/data/catalog.json";
import { shouldSeedCatalogApps } from "@/lib/app-seed";
import { findShelfCategory, shelfCategories, type ShelfCategory } from "@/lib/shelf-categories";
import { getSql, type Sql } from "@/lib/db";
import { checkBadgeOnPage } from "@/lib/badge";
import { createChoiceCheckout, readDodoPrice, updateDodoPrice } from "@/lib/dodo.server";
import { cleanXHandle } from "@/lib/metadata.server";
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
  is_user_submitted?: boolean;
  views_7d?: number | string;
  created_at: string | Date;
  demo: string;
  related: string[] | string;
  status: string;
  badge_status: string;
  badge_misses: number;
  badge_checked_at: string | Date | null;
  badge_detail: string;
  submitter_email: string | null;
  submitter_x?: string | null;
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
    isUserSubmitted: asBool(row.is_user_submitted),
    views7d: Number(row.views_7d ?? 0),
    createdAt: iso(row.created_at),
    demo: row.demo,
    related: asJson(row.related, []),
    status: row.status,
    badgeStatus: row.badge_status,
    badgeDetail: row.badge_detail,
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
      deleted_at timestamptz not null default now()
    )`,
  );
  await sql.query(
    `insert into app_tombstones (slug) values ('scanmydisk') on conflict (slug) do nothing`,
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
          app.editorChoice === true,
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
     order by a.created_at desc`,
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
  return {
    apps,
    posts: guideRows.map(toPost),
    editors: apps.filter((app) => app.editorChoice).map((app) => app.slug),
    categories,
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

export type EditorChoiceSlotsInfo = {
  total: number;
  active: number;
  remaining: number;
  isFull: boolean;
  nextDate: string;
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

  const [activeTotal, activeFeatured, activeArticle] = await Promise.all([
    countActiveEditorChoiceApps(),
    countActiveTierApps("featured"),
    countActiveTierApps("article"),
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
  };

  const articleSlots: EditorChoiceSlotsInfo = {
    total: MAX_TIER_SLOTS,
    active: activeArticle,
    remaining: articleRemaining,
    isFull: articleRemaining === 0,
    nextDate,
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
    },
  };
}

export async function adminStats() {
  const sql = await directorySql();
  const apps = await sql.query<{ pricing: string; status: string; editor_choice: boolean; featured_tier: string | null; is_hot?: boolean }>(
    "select pricing, status, editor_choice, featured_tier, is_hot from apps",
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

  const views7d = 0;
  const views30d = 0;
  const topApps7d: { id: string; name: string; slug: string; icon: string; views: number }[] = [];
  const trafficSources7d: { source: string; views: number }[] = [];

  let hotApps: { id: string; name: string; slug: string; icon: string }[] = [];
  let blueOccupants: { id: string; name: string; slug: string; icon: string; featuredUntil: string | null }[] = [];
  let goldOccupants: { id: string; name: string; slug: string; icon: string; featuredUntil: string | null }[] = [];
  try {
    const hotRows = await sql.query<{ id: string; name: string; slug: string; icon: string }>(
      "select id, name, slug, icon from apps where status = 'published' and is_hot = true order by updated_at desc limit 12",
    );
    hotApps = hotRows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, icon: r.icon }));

    const blueRows = await sql.query<{ id: string; name: string; slug: string; icon: string; featured_until: string | null }>(
      "select id, name, slug, icon, featured_until from apps where status = 'published' and editor_choice = true and (featured_tier = 'featured' or featured_tier is null) order by created_at desc",
    );
    blueOccupants = blueRows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      icon: r.icon,
      featuredUntil: r.featured_until ? String(r.featured_until) : null,
    }));

    const goldRows = await sql.query<{ id: string; name: string; slug: string; icon: string; featured_until: string | null }>(
      "select id, name, slug, icon, featured_until from apps where status = 'published' and editor_choice = true and featured_tier = 'article' order by created_at desc",
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
    "update apps set is_hot = $1, updated_at = now() where id = $2",
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
  const rows = await sql.query<{ slug: string }>("delete from apps where id = $1 returning slug", [id]);
  const slug = rows[0]?.slug;
  if (!slug) return;
  try {
    await sql.query(
      `insert into app_tombstones (slug) values ($1)
       on conflict (slug) do update set deleted_at = now()`,
      [slug],
    );
  } catch (err) {
    console.error("app tombstone failed:", err);
  }
  await audit(sql, "delete-app", slug);
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
    created_at: string | Date;
  }>("select id, app_name, website, plan, coalesce(tier, 'featured') as tier, status, email, coalesce(x_handle, '') as x_handle, created_at from submissions order by created_at desc limit 100");
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
  const sql = await directorySql();
  const id = randomUUID();
  await sql.query(
    `insert into submissions (id, app_name, website, tagline, email, x_handle, plan, tier, badge_ok, status, description, icon, demo, pricing, category)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
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
      plan === "choice" ? "awaiting_payment" : "pending",
      description,
      icon,
      demo,
      cleanPricing(input.pricing),
      category.slug,
    ],
  );
  if (plan === "free") return { ok: true as const, message: "Submitted. It stays pending until an admin approves it." };
  try {
    const checkout = await createChoiceCheckout({
      submissionId: id,
      email,
      name,
      returnUrl: `${origin}/submit?submitted=1`,
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
    return { ok: true as const, checkoutUrl: checkout.checkoutUrl, message: "Continue to checkout." };
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
}

export async function approveSubmission(id: string) {
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
  }
  const appId = randomUUID();
  let slug =
    submission.app_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || appId.slice(0, 8);
  const taken = await sql.query("select id from apps where slug = $1", [slug]);
  if (taken.length) slug = `${slug}-${appId.slice(0, 4)}`;
  const category = findShelfCategory(submission.category) ?? {
    slug: "utility",
    name: "Utility",
    emoji: "🔧",
    paragraphs: [],
    tips: [],
  };
  const isChoice = submission.plan === "choice";
  const tier = isChoice ? (submission.tier === "article" ? "article" : "featured") : null;
  await sql.query(
    `insert into apps (
      id, name, slug, tagline, description, icon, website, pricing, category, category_name, category_icon,
      editor_choice, featured_tier, featured_until, demo, status, submitter_email, submitter_x, is_user_submitted
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,case when $12 then now() + interval '30 days' else null end,$14,'published',$15,$16,true)`,
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
      submission.demo || "",
      submission.email,
      submission.x_handle || "",
    ],
  );
  await sql.query("update submissions set status = 'approved', app_id = $2 where id = $1", [id, appId]);
  await audit(sql, "approve", slug, submission.plan);
}

export async function runBadgeChecks() {
  const sql = await directorySql();
  const rows = await sql.query<AppRow>(
    "select * from apps where status = 'published' and editor_choice = false and is_user_submitted = true",
  );
  const results: { slug: string; result: string; detail: string }[] = [];
  for (const row of rows) {
    const check = await checkBadgeOnPage(row.website);
    let result = "ok";
    let misses = 0;
    if (!check.ok && check.message.includes("couldn't find")) {
      result = "missing";
      misses = Number(row.badge_misses) + 1;
    } else if (!check.ok) {
      result = "error";
      misses = Number(row.badge_misses);
    }
    const unpublish = result === "missing" && misses >= 2;
    await sql.query(
      `update apps set badge_status = $2, badge_misses = $3, badge_checked_at = now(), badge_detail = $4,
        status = case when $5 then 'unpublished' else status end, updated_at = now()
       where id = $1`,
      [row.id, unpublish ? "missing" : result, result === "ok" ? 0 : misses, check.message, unpublish],
    );
    await sql.query(
      "insert into badge_checks (id, app_id, result, detail) values ($1,$2,$3,$4)",
      [randomUUID(), row.id, unpublish ? "unpublished" : result, check.message],
    );
    results.push({ slug: row.slug, result: unpublish ? "unpublished" : result, detail: check.message });
  }
  return results;
}
