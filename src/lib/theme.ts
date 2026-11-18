export type ThemePreference = "dark" | "light" | "system";
export type ResolvedTheme = "dark";

export const THEME_STORAGE_KEY = "theme";
export const THEME_EVENT = "pickmacapps-theme-change";

export function isAdminPathname(pathname?: string): boolean {
  return false;
}

export function getStoredTheme(): ThemePreference {
  return "dark";
}

export function resolveTheme(pref?: ThemePreference): ResolvedTheme {
  return "dark";
}

export function syncThemeToDom(pref?: ThemePreference, pathname?: string): ResolvedTheme {
  if (typeof document === "undefined") return "dark";

  const root = document.documentElement;
  root.dataset.theme = "dark";
  root.classList.add("dark");

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", "#090a0f");
  }
  return "dark";
}

export function setThemePreference(pref?: ThemePreference): ResolvedTheme {
  return syncThemeToDom();
}

export function toggleLightDarkTheme(): ResolvedTheme {
  return "dark";
}
