/**
 * Minilytics Analytics & Goal Tracking Helper
 *
 * Supports:
 * 1. Declarative DOM goals via data-ml-goal="<goal_name>"
 * 2. Programmatic goals: trackGoal("submit_listing", { plan: "featured", price: 99 })
 * 3. User identification: identifyUser({ email: user.email, name: user.name })
 */

declare global {
  interface Window {
    minilytics?: (action: "goal" | "identify" | string, ...args: unknown[]) => void;
  }
}

/**
 * Track a custom conversion or event goal with Minilytics.
 * e.g. trackGoal("signup", { plan: "pro" })
 */
export function trackGoal(goal: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.minilytics === "function") {
      window.minilytics("goal", goal, properties);
    }
  } catch (err) {
    console.debug("[minilytics] trackGoal error:", err);
  }
}

/**
 * Identify a user with Minilytics.
 * e.g. identifyUser({ email: user.email, name: user.name })
 */
export function identifyUser(user: { email?: string; name?: string; [key: string]: unknown }): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.minilytics === "function") {
      window.minilytics("identify", user);
    }
  } catch (err) {
    console.debug("[minilytics] identifyUser error:", err);
  }
}
