import { getApp, getPost } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/sitemap";

const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH = 10_000;

export function indexNowKey() {
  const key = process.env.INDEXNOW_KEY?.trim().toLowerCase() ?? "";
  return /^[a-f0-9]{32}$/.test(key) ? key : "";
}

/** Ping only a production deploy that has a valid key. Preview and local stay quiet. */
export function indexNowEnabled() {
  if (!indexNowKey()) return false;
  const stage = process.env.VERCEL_ENV?.trim();
  if (stage) return stage === "production";
  return process.env.NODE_ENV === "production" && process.env.INDEXNOW_ENABLE === "1";
}

export function urlsForAppChange(origin: string, slug: string) {
  const app = getApp(slug);
  if (!app) return [];
  return [
    absoluteUrl(origin, `/app/${app.slug}`),
    absoluteUrl(origin, `/category/${app.category}`),
    absoluteUrl(origin, "/"),
  ];
}

export function urlsForGuideChange(origin: string, slug: string) {
  const post = getPost(slug);
  if (!post) return [];
  return [absoluteUrl(origin, `/blog/${post.slug}`), absoluteUrl(origin, "/blog"), absoluteUrl(origin, "/")];
}

export function indexNowPayload(origin: string, urls: string[]) {
  const key = indexNowKey();
  const urlList = [...new Set(urls.map((url) => url.trim()).filter(Boolean))].slice(0, BATCH);
  let host = "";
  try {
    host = new URL(origin).host;
  } catch {
    host = "";
  }
  return {
    host,
    key,
    keyLocation: key && host ? `${origin.replace(/\/$/, "")}/${key}.txt` : "",
    urlList,
  };
}

/**
 * Fire and forget. Returns without waiting, and never throws to the caller.
 * Outside production, or without a key, it logs the payload and does not POST.
 */
export function submitToIndexNow(origin: string, urls: string[]) {
  const payload = indexNowPayload(origin, urls);
  if (!payload.urlList.length) return;
  if (!indexNowEnabled()) {
    console.info("[indexnow] skipped", { count: payload.urlList.length, host: payload.host });
    return;
  }
  void send(payload).catch((error: unknown) => {
    console.error("[indexnow] failed", error instanceof Error ? error.message : error);
  });
}

async function send(payload: ReturnType<typeof indexNowPayload>) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    console.error("[indexnow] failed", response.status);
  }
}
