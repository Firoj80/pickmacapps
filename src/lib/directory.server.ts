import { randomUUID } from "node:crypto";
import raw from "@/data/catalog.json";
import { getSql, type Sql } from "@/lib/db";
import { checkBadgeOnPage } from "@/lib/badge";
import { createChoiceCheckout, readDodoPrice, updateDodoPrice } from "@/lib/dodo.server";
import type { AppItem, Post, Pricing } from "@/lib/catalog";

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
  created_at: string | Date;
  demo: string;
  related: string[] | string;
  status: string;
  badge_status: string;
  badge_misses: number;
  badge_checked_at: string | Date | null;
  badge_detail: string;
  submitter_email: string | null;
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
    editorChoice: row.editor_choice,
    createdAt: iso(row.created_at),
    demo: row.demo,
    related: asJson(row.related, []),
    status: row.status,
    badgeStatus: row.badge_status,
    badgeDetail: row.badge_detail,
  };
}

function toPost(row: GuideRow): Post {
  return {
    slug: row.slug,
    title: row.title,
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

async function ensureSeed(sql: Sql) {
  const existing = await sql.query<{ count: string }>("select count(*)::text as count from apps");
  if (Number(existing[0]?.count ?? 0) > 0) return;
  const editors = new Set(raw.editors);
  for (const app of raw.apps) {
    await sql.query(
      `insert into apps (
        id, name, slug, tagline, description, icon, website, pricing, category, category_name,
        category_icon, editor_choice, created_at, demo, related, status
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,'published')`,
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
        editors.has(app.slug),
        app.createdAt,
        app.demo,
        JSON.stringify(app.related ?? []),
      ],
    );
  }
  for (const post of raw.posts) {
    await sql.query(
      `insert into guides (slug, title, excerpt, date, date_label, minutes, tags, toc, html, more, status)
       values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10::jsonb,'published')`,
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
  }
  await sql.query(
    `insert into settings (key, value) values ('choice_price_cents', '9900'), ('choice_compare_cents', '19900')
     on conflict (key) do nothing`,
  );
}

export async function directorySql() {
  const sql = await getSql();
  await ensureSeed(sql);
  return sql;
}

export async function publishedDirectory() {
  const sql = await directorySql();
  const appRows = await sql.query<AppRow>("select * from apps where status = 'published' order by created_at desc");
  const guideRows = await sql.query<GuideRow>("select * from guides where status = 'published' order by date desc");
  const apps = appRows.map(toApp);
  return {
    apps,
    posts: guideRows.map(toPost),
    editors: apps.filter((app) => app.editorChoice).map((app) => app.slug),
  };
}

export async function publicOffer() {
  const sql = await directorySql();
  const rows = await sql.query<{ key: string; value: string }>("select key, value from settings");
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  let priceCents = Number(map.choice_price_cents ?? 9900);
  const compareCents = Number(map.choice_compare_cents ?? 19900);
  const live = await readDodoPrice();
  if (live != null && live !== priceCents) {
    priceCents = live;
    await sql.query(
      `insert into settings (key, value) values ('choice_price_cents', $1)
       on conflict (key) do update set value = excluded.value`,
      [String(live)],
    );
  }
  return { priceCents, compareCents };
}

export async function adminStats() {
  const sql = await directorySql();
  const apps = await sql.query<{ pricing: string; status: string; editor_choice: boolean }>(
    "select pricing, status, editor_choice from apps",
  );
  const guides = await sql.query<{ status: string }>("select status from guides");
  const revenue = await sql.query<{ cents: string }>(
    "select coalesce(sum(amount_cents), 0)::text as cents from payments where status = 'paid'",
  );
  const live = apps.filter((app) => app.status === "published");
  return {
    free: live.filter((app) => app.pricing === "free").length,
    paid: live.filter((app) => app.pricing === "paid").length,
    freemium: live.filter((app) => app.pricing === "freemium").length,
    editorChoice: live.filter((app) => app.editor_choice).length,
    pendingApps: apps.filter((app) => app.status === "pending").length,
    guides: guides.filter((guide) => guide.status === "published").length,
    draftGuides: guides.filter((guide) => guide.status !== "published").length,
    revenueCents: Number(revenue[0]?.cents ?? 0),
  };
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
  return rows[0] ? toApp(rows[0]) : null;
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
  status: string;
}) {
  const sql = await directorySql();
  const current = await sql.query<AppRow>("select * from apps where id = $1", [input.id]);
  const row = current[0];
  if (!row) throw new Error("App not found");
  const category = raw.categories.find((item) => item.slug === input.category) ?? {
    slug: row.category,
    name: row.category_name,
    emoji: row.category_icon,
  };
  await sql.query(
    `update apps set name = $2, slug = $3, tagline = $4, description = $5, website = $6, pricing = $7,
      category = $8, category_name = $9, category_icon = $10, editor_choice = $11, status = $12,
      icon = $13, demo = $14, updated_at = now()
     where id = $1`,
    [
      input.id,
      input.name.trim(),
      input.slug.trim(),
      input.tagline.trim(),
      input.description.trim(),
      input.website.trim(),
      cleanPricing(input.pricing),
      category.slug,
      category.name,
      category.emoji,
      input.editorChoice,
      cleanStatus(input.status),
      input.icon.trim(),
      input.demo.trim(),
    ],
  );
  await audit(sql, "save-app", input.slug, cleanStatus(input.status));
}

export async function deleteApp(id: string) {
  const sql = await directorySql();
  const rows = await sql.query<{ slug: string }>("delete from apps where id = $1 returning slug", [id]);
  if (rows[0]) await audit(sql, "delete-app", rows[0].slug);
}

export async function listGuides() {
  const sql = await directorySql();
  return sql.query<{ slug: string; title: string; status: string; date: string }>(
    "select slug, title, status, date from guides order by date desc",
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

export async function setChoicePrice(amountCents: number, compareCents: number) {
  if (!Number.isInteger(amountCents) || amountCents < 100 || amountCents > 100_000_00) {
    throw new Error("Price must be a whole number of cents from the server form.");
  }
  if (!Number.isInteger(compareCents) || compareCents < 0 || compareCents > 100_000_00) {
    throw new Error("Compare-at price must be a whole number of cents.");
  }
  await updateDodoPrice(amountCents);
  const sql = await directorySql();
  await sql.query(
    `insert into settings (key, value) values ('choice_price_cents', $1)
     on conflict (key) do update set value = excluded.value`,
    [String(amountCents)],
  );
  await sql.query(
    `insert into settings (key, value) values ('choice_compare_cents', $1)
     on conflict (key) do update set value = excluded.value`,
    [String(compareCents)],
  );
  await audit(sql, "price", "choice", String(amountCents));
}

export async function listSubmissions() {
  const sql = await directorySql();
  return sql.query<{
    id: string;
    app_name: string;
    website: string;
    plan: string;
    status: string;
    email: string;
    created_at: string | Date;
  }>("select id, app_name, website, plan, status, email, created_at from submissions order by created_at desc limit 100");
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
    plan: string;
  },
  origin: string,
) {
  const plan = input.plan === "choice" ? "choice" : "free";
  const name = input.name.trim();
  const website = input.website.trim();
  const tagline = input.tagline.trim();
  const description = input.description.trim();
  const icon = input.icon.trim();
  const demo = input.demo.trim();
  const email = input.email.trim();
  const category = raw.categories.find((item) => item.slug === input.category);
  if (!name || !website || !tagline || !description || !icon || !email.includes("@") || !category) {
    return { ok: false as const, message: "Name, website, tagline, description, icon, category, and email are required." };
  }
  if (plan === "free") {
    const badge = await checkBadgeOnPage(website);
    if (!badge.ok) return { ok: false as const, message: badge.message };
  }
  const sql = await directorySql();
  const id = randomUUID();
  await sql.query(
    `insert into submissions (id, app_name, website, tagline, email, plan, badge_ok, status, description, icon, demo, pricing, category)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      id,
      name,
      website,
      tagline,
      email,
      plan,
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
    });
    if (checkout.paymentId) {
      const offer = await publicOffer();
      await sql.query(
        `insert into payments (id, submission_id, provider_payment_id, amount_cents, currency, status)
         values ($1,$2,$3,$4,'USD','pending')`,
        [randomUUID(), id, checkout.paymentId, offer.priceCents],
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
    plan: string;
    status: string;
  }>("select * from submissions where id = $1", [id]);
  const submission = rows[0];
  if (!submission) throw new Error("Submission not found");
  if (submission.status === "approved") throw new Error("That submission is already approved.");
  if (submission.plan === "choice" && submission.status !== "paid") {
    throw new Error("Editor’s Choice can be approved only after Dodo confirms payment.");
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
  const category = raw.categories.find((item) => item.slug === submission.category) ?? {
    slug: "utilities",
    name: "Utilities",
    emoji: "🔧",
  };
  await sql.query(
    `insert into apps (
      id, name, slug, tagline, description, icon, website, pricing, category, category_name, category_icon,
      editor_choice, demo, status, submitter_email
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'published',$14)`,
    [
      appId,
      submission.app_name,
      slug || appId.slice(0, 8),
      submission.tagline,
      submission.description || submission.tagline,
      submission.icon || "",
      submission.website,
      cleanPricing(submission.pricing || (submission.plan === "choice" ? "paid" : "free")),
      category.slug,
      category.name,
      category.emoji,
      submission.plan === "choice",
      submission.demo || "",
      submission.email,
    ],
  );
  await sql.query("update submissions set status = 'approved', app_id = $2 where id = $1", [id, appId]);
  await audit(sql, "approve", slug, submission.plan);
}

export async function runBadgeChecks() {
  const sql = await directorySql();
  const rows = await sql.query<AppRow>(
    "select * from apps where status = 'published' and editor_choice = false",
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
