import { useEffect, useState } from "react";
import {
  getStoredTheme,
  setThemePreference,
  syncThemeToDom,
  THEME_EVENT,
  toggleLightDarkTheme,
  type ThemePreference,
} from "@/lib/theme";

export function HeaderThemeToggle() {
  return (
    <button
      type="button"
      onClick={() => toggleLightDarkTheme()}
      aria-label="Toggle dark and light theme"
      title="Switch theme (Light / Dark)"
      className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-body shadow-2xs transition-colors hover:border-line-2 hover:bg-surface-2 hover:text-ink sm:h-9 sm:w-9"
    >
      {/* In light mode: show Moon (switch to Dark) */}
      <MoonIcon className="h-4 w-4 dark:hidden" />
      {/* In dark mode: show Sun (switch to Light) */}
      <SunIcon className="hidden h-4 w-4 dark:block" />
    </button>
  );
}

const options: { id: ThemePreference; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "Auto" },
];

export function FooterThemeSwitcher() {
  const [pref, setPref] = useState<ThemePreference | null>(null);

  useEffect(() => {
    const sync = () => setPref(getStoredTheme());
    sync();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onMedia = () => syncThemeToDom(getStoredTheme());
    window.addEventListener(THEME_EVENT, sync);
    window.addEventListener("storage", sync);
    media.addEventListener("change", onMedia);

    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      window.removeEventListener("storage", sync);
      media.removeEventListener("change", onMedia);
    };
  }, []);

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5 shadow-2xs"
    >
      {options.map((opt) => {
        const active = pref === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              setThemePreference(opt.id);
              setPref(opt.id);
            }}
            aria-pressed={active}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
              active
                ? "bg-surface-2 text-ink shadow-2xs ring-1 ring-line"
                : "text-muted hover:text-ink"
            }`}
          >
            {opt.id === "light" ? <SunIcon className="h-3 w-3" /> : null}
            {opt.id === "dark" ? <MoonIcon className="h-3 w-3" /> : null}
            {opt.id === "system" ? <MonitorIcon className="h-3 w-3" /> : null}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
