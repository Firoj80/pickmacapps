import { useEffect, useRef, useState } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = theme;
  root.classList.toggle("dark", dark);
}

function readTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "system" || stored === "light") return stored;
  return "light";
}

const options: { id: Theme; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = readTheme();
    setTheme(current);
    applyTheme(current);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = readTheme();
      if (next === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: Theme) {
    localStorage.setItem("theme", next);
    setTheme(next);
    applyTheme(next);
    setOpen(false);
  }

  const Icon = theme === "dark" ? MoonIcon : theme === "system" ? MonitorIcon : SunIcon;

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Theme"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-body transition-colors hover:bg-surface-2 hover:text-ink"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-36 rounded-xl border border-line bg-surface p-1 shadow-lg"
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === option.id}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-body hover:bg-surface-2 hover:text-ink"
              onClick={() => choose(option.id)}
            >
              {option.label}
              {theme === option.id ? <span className="text-accent">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
