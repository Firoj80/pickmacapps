/**
 * Accurate Click & Referral Tracking for PickMacApps
 *
 * Tracks app card clicks (browsing) and outbound "Visit Website" / "Try App" referral clicks.
 * Uses keepalive requests so clicks register reliably even during navigation or tab switching.
 * Includes short cooldown deduplication to prevent accidental rapid double-counting.
 */

export type TrackClickResponse = {
  ok: boolean;
  clickCount?: number;
  tryCount?: number;
  totalClicks?: number;
};

// Cooldown map: prevent duplicate submissions within 1.5 seconds per app & click type
const clickCooldowns = new Map<string, number>();

export async function trackAppClick(
  appId?: string,
  slug?: string,
  type: "click" | "try" = "try",
): Promise<TrackClickResponse> {
  if (typeof window === "undefined") {
    return { ok: false };
  }

  const target = (appId || slug || "").trim();
  if (!target) {
    return { ok: false };
  }

  const key = `${target}:${type}`;
  const now = Date.now();
  const lastTime = clickCooldowns.get(key) || 0;
  if (now - lastTime < 1500) {
    // Throttled: click already registered recently
    return { ok: true };
  }
  clickCooldowns.set(key, now);

  try {
    const res = await fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appId, slug, type }),
      keepalive: true,
    });
    if (!res.ok) {
      return { ok: false };
    }
    const data = (await res.json()) as TrackClickResponse;
    return data;
  } catch (err) {
    console.debug("[trackAppClick] Network error:", err);
    return { ok: false };
  }
}

/**
 * Calculates authentic total clicks (Card Clicks + Referral Try Clicks) with zero fake inflation.
 */
export function getAppTotalClicks(app?: { clickCount?: number; tryCount?: number } | null): number {
  if (!app) return 0;
  const clicks = Number(app.clickCount ?? 0);
  const tries = Number(app.tryCount ?? 0);
  return Math.max(0, (isNaN(clicks) ? 0 : clicks) + (isNaN(tries) ? 0 : tries));
}
