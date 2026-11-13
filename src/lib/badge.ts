import { createServerFn } from "@tanstack/react-start";

export function publicUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0" ||
    host === "::1"
  ) {
    return null;
  }
  if (
    /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host) ||
    host.endsWith(".localhost")
  ) {
    return null;
  }
  return url;
}

/**
 * Verifies whether the HTML contains an authentic PickMacApps badge or backlink.
 * Rejects generic "badge.svg" or "badge.png" matches that belong to third-party
 * directories (such as TryMacApps, Product Hunt, MacNative).
 */
export function hasPickMacAppsBadge(html: string): boolean {
  const lower = html.toLowerCase();
  if (!lower.includes("pickmacapps")) {
    return false;
  }
  const hasBacklink =
    lower.includes("pickmacapps.store") ||
    lower.includes("pickmacapps.com") ||
    /href=["'][^"']*pickmacapps/i.test(lower);

  const hasBadgeAsset =
    /src=["'][^"']*pickmacapps/i.test(lower) ||
    lower.includes("badge.svg") ||
    lower.includes("badge-classic.svg") ||
    lower.includes("badge-dark.svg") ||
    lower.includes("featured on pickmacapps");

  return hasBacklink || hasBadgeAsset;
}

export async function checkBadgeOnPage(value: string) {
  const url = publicUrl(value.trim());
  if (!url) {
    return { ok: false, message: "Enter a public website URL, including https://" };
  }
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "PickMacAppsBadgeCheck/1.0",
        Accept: "text/html",
      },
    });
    if (!response.ok) {
      return { ok: false, message: `We couldn't open that page (${response.status}).` };
    }
    const html = (await response.text()).slice(0, 1_500_000);
    const found = hasPickMacAppsBadge(html);
    if (!found) {
      return { ok: false, message: "We couldn't find the PickMacApps badge or reciprocal link on that page yet." };
    }
    return { ok: true, message: "Badge found. You can submit your app." };
  } catch {
    return { ok: false, message: "We couldn't reach that page. Check the URL and try again." };
  }
}

export const verifyBadge = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const url = typeof input === "object" && input && "url" in input ? String(input.url) : "";
    return { url };
  })
  .handler(async ({ data }) => checkBadgeOnPage(data.url));
