/**
 * Minilytics Analytics & Revenue Attribution Helper
 *
 * Host: https://minilytics.firojstats.workers.dev
 * Website ID: 5q3e1c3f5d0d1518
 */

declare global {
  interface Window {
    minilytics?: ((cmd: "goal" | "identify" | "pageview", a?: unknown, b?: unknown) => void) & {
      attribution?: () => { ml_visitor_id?: string; ml_session_id?: string };
    };
  }
}

function isAdminRoute(): boolean {
  return typeof window !== "undefined" && /^\/admin(\/|$)/.test(window.location.pathname);
}

/**
 * Retrieve visitor and session attribution IDs from Minilytics client.
 */
export function getAttribution(): { ml_visitor_id?: string; ml_session_id?: string } {
  if (typeof window === "undefined" || isAdminRoute()) return {};
  try {
    return window.minilytics?.attribution?.() ?? {};
  } catch (err) {
    console.debug("[minilytics] attribution error:", err);
    return {};
  }
}

/**
 * Appends Minilytics attribution params to an external checkout or redirect URL.
 * e.g. https://checkout.dodopayments.com/buy/... -> ...?metadata_ml_visitor_id=...&metadata_ml_session_id=...
 */
export function appendAttributionToUrl(targetUrl: string): string {
  if (typeof window === "undefined") return targetUrl;
  try {
    const attr = getAttribution();
    if (!attr.ml_visitor_id && !attr.ml_session_id) return targetUrl;
    const url = new URL(targetUrl, window.location.href);
    if (attr.ml_visitor_id && !url.searchParams.has("metadata_ml_visitor_id")) {
      url.searchParams.set("metadata_ml_visitor_id", attr.ml_visitor_id);
    }
    if (attr.ml_session_id && !url.searchParams.has("metadata_ml_session_id")) {
      url.searchParams.set("metadata_ml_session_id", attr.ml_session_id);
    }
    return url.toString();
  } catch {
    return targetUrl;
  }
}

/**
 * Track a custom conversion or event goal with Minilytics.
 * e.g. trackGoal("signup_completed", { plan: "featured" })
 */
export function trackGoal(goal: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined" || isAdminRoute()) return;
  try {
    window.minilytics?.("goal", goal, properties);
  } catch (err) {
    console.debug("[minilytics] trackGoal error:", err);
  }
}

/**
 * Identify a user with Minilytics.
 * e.g. identifyUser({ user_id: user.id, email: user.email, name: user.name })
 */
export function identifyUser(user: { user_id?: string; email?: string; name?: string; [key: string]: unknown }): void {
  if (typeof window === "undefined" || isAdminRoute()) return;
  try {
    window.minilytics?.("identify", user);
  } catch (err) {
    console.debug("[minilytics] identifyUser error:", err);
  }
}
