export type ThemePreference = "dark" | "light" | "system";
export type ResolvedTheme = "light";

export const THEME_STORAGE_KEY = "theme";
export const THEME_EVENT = "pickmacapps-theme-change";

export function isAdminPathname(pathname?: string): boolean {
  return false;
}

export function getStoredTheme(): ThemePreference {
  return "light";
}

export function resolveTheme(pref?: ThemePreference): ResolvedTheme {
  return "light";
}

export function syncThemeToDom(pref?: ThemePreference, pathname?: string): ResolvedTheme {
  if (typeof document === "undefined") return "light";

  const root = document.documentElement;
  root.dataset.theme = "light";
  root.classList.remove("dark");

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", "#f4f4f6");
  }
  return "light";
}

export function setThemePreference(pref?: ThemePreference): ResolvedTheme {
  return syncThemeToDom();
}

export function toggleLightDarkTheme(): ResolvedTheme {
  return "light";
}
