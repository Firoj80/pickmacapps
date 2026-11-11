export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const THEME_EVENT = "pickmacapps-theme-change";

export function isAdminPathname(pathname?: string): boolean {
  const path = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return /^\/admin(\/|$)/.test(path);
}

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "light";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "dark" || raw === "system" || raw === "light") return raw;
  } catch {
    // ignore storage errors
  }
  return "light";
}

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === "dark") return "dark";
  if (pref === "system" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function syncThemeToDom(pref: ThemePreference, pathname?: string): ResolvedTheme {
  const resolved = resolveTheme(pref);
  if (typeof document === "undefined") return resolved;

  const root = document.documentElement;
  const admin = isAdminPathname(pathname);
  const activeDark = !admin && resolved === "dark";

  root.dataset.theme = admin ? "light" : pref;
  root.classList.toggle("dark", activeDark);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", activeDark ? "#08090a" : "#ffffff");
  }
  return resolved;
}

export function setThemePreference(pref: ThemePreference): ResolvedTheme {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
      // ignore storage errors
    }
    const resolved = syncThemeToDom(pref);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { pref, resolved } }));
    return resolved;
  }
  return resolveTheme(pref);
}

export function toggleLightDarkTheme(): ResolvedTheme {
  const current = resolveTheme(getStoredTheme());
  return setThemePreference(current === "dark" ? "light" : "dark");
}
