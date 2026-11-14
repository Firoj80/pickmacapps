import { useState, useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

export type AdminSection =
  | "overview"
  | "apps"
  | "stats"
  | "add_app"
  | "guides"
  | "add_guide"
  | "submissions"
  | "upvotes"
  | "badges"
  | "telegram";

const mainNav = [
  { to: "/admin", label: "Overview", id: "overview" as const, icon: "📊", section: "core" },
  { to: "/admin/stats", label: "App Analytics", id: "stats" as const, icon: "📈", section: "core" },
  { to: "/admin/submissions", label: "Submissions", id: "submissions" as const, icon: "📥", section: "core" },
  { to: "/admin/apps", label: "All Apps", id: "apps" as const, icon: "📱", section: "core" },
  { to: "/admin/upvotes", label: "Upvotes & Hot", id: "upvotes" as const, icon: "▲", section: "system" },
  { to: "/admin/badges", label: "Free Badges", id: "badges" as const, icon: "🔍", section: "system" },
  { to: "/admin/telegram", label: "Telegram Bot", id: "telegram" as const, icon: "🤖", section: "system" },
  { to: "/admin/guides", label: "All Guides", id: "guides" as const, icon: "📖", section: "system" },
];

const quickNav = [
  { to: "/admin/apps/new", label: "Add New App", id: "add_app" as const, icon: "➕", badge: "New" },
  { to: "/admin/guides/new", label: "Add New Guide", id: "add_guide" as const, icon: "✍️", badge: "New" },
];

export const fieldClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-ink shadow-2xs";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-[13px] font-medium text-ink">
      {label}
      {children}
      {hint ? <span className="mt-1 block text-[12px] font-normal text-muted">{hint}</span> : null}
    </label>
  );
}

const tones = {
  ok: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20",
  wait: "bg-amber-50 text-amber-900 ring-1 ring-amber-600/20",
  off: "bg-stone-100 text-stone-600 ring-1 ring-stone-400/20",
  choice: "bg-accent/10 text-accent ring-1 ring-accent/25",
} as const;

export function Pill({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function statusTone(status: string): keyof typeof tones {
  if (status === "published" || status === "approved" || status === "paid" || status === "ok") return "ok";
  if (status === "pending" || status === "awaiting_payment" || status === "draft") return "wait";
  return "off";
}

export function useAdminNotice() {
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const params = new URLSearchParams(search);
  return { error: params.get("error") ?? "", saved: params.get("saved") ?? "" };
}

const savedCopy: Record<string, string> = {
  "1": "Saved successfully.",
  price: "Price updated.",
  badges: "Badge check finished.",
  approved: "Listing approved and published.",
  rejected: "Submission rejected.",
  published_all: "All unpublished listings have been published.",
  created: "New listing created and published successfully.",
  telegram: "Telegram webhook connected and test message sent.",
  badge_ok: "PickMacApps badge verified on website! You can now approve this listing.",
  deleted: "Listing permanently deleted. The URL now serves the Alternatives Hub.",
};

export function Notice({ error, saved }: { error: string; saved: string }) {
  if (!error && !saved) return null;
  if (error) {
    return (
      <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-xs">
        <span className="text-base">⚠️</span>
        <span>{error}</span>
      </div>
    );
  }
  return (
    <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 shadow-xs">
      <span className="text-base">✅</span>
      <span>{savedCopy[saved] ?? "Saved."}</span>
    </div>
  );
}

export function AdminShell({
  title,
  lede,
  active,
  actions,
  children,
}: {
  title: string;
  lede?: string;
  active: AdminSection;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [currentPath]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  const coreNav = mainNav.filter((item) => item.section === "core");
  const systemNav = mainNav.filter((item) => item.section === "system");

  return (
    <div className="min-h-screen bg-[#f8f8f6] dark:bg-[#0d0e10] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Top Loading Progress Bar */}
      {isLoading ? (
        <div
          role="status"
          aria-label="Loading page"
          className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-gradient-to-r from-accent via-amber-400 to-sky-500 animate-pulse shadow-xs"
        />
      ) : null}

      {/* Mobile Top App Bar (< lg) */}
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur-md lg:hidden shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-stone-50 text-ink hover:bg-stone-100 transition cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Link to="/admin" className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-xs text-canvas">
              🍎
            </span>
            <span>PickMacApps</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>

          <Link
            to="/"
            title="View public site"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-stone-50 text-sm hover:bg-stone-100 transition"
          >
            🌐
          </Link>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer Navigation (< lg) */}
      {mobileDrawerOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden" aria-modal="true" role="dialog">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative flex h-full w-[280px] max-w-[85vw] flex-col border-r border-line bg-white shadow-2xl">
            {/* Drawer Header */}
            <div className="flex h-14 items-center justify-between border-b border-line px-5">
              <div className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink text-xs text-canvas">
                  🍎
                </span>
                <span>Console Menu</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-stone-100 hover:text-ink transition cursor-pointer"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Nav Items */}
            <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
              {/* Core Operations */}
              <div>
                <p className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-muted uppercase">
                  Core Management
                </p>
                <div className="space-y-1">
                  {coreNav.map((item) => {
                    const isActive = active === item.id;
                    return (
                      <Link
                        key={item.id}
                        to={item.to}
                        preload="intent"
                        onClick={() => setTimeout(() => setMobileDrawerOpen(false), 50)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-ink font-semibold text-canvas shadow-xs"
                            : "text-body hover:bg-stone-100 hover:text-ink"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="text-base">{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                        {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Automations & Moderation */}
              <div>
                <p className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-muted uppercase">
                  Automations & Features
                </p>
                <div className="space-y-1">
                  {systemNav.map((item) => {
                    const isActive = active === item.id;
                    return (
                      <Link
                        key={item.id}
                        to={item.to}
                        preload="intent"
                        onClick={() => setTimeout(() => setMobileDrawerOpen(false), 50)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-ink font-semibold text-canvas shadow-xs"
                            : "text-body hover:bg-stone-100 hover:text-ink"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="text-base">{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                        {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <p className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-muted uppercase">
                  Quick Actions
                </p>
                <div className="space-y-1">
                  {quickNav.map((item) => {
                    const isActive = active === item.id;
                    return (
                      <Link
                        key={item.id}
                        to={item.to}
                        preload="intent"
                        onClick={() => setTimeout(() => setMobileDrawerOpen(false), 50)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-ink font-semibold text-canvas shadow-xs"
                            : "text-body hover:bg-stone-100 hover:text-ink"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="text-sm">{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                        <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                          {item.badge}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-line p-3.5 space-y-1">
              <Link
                to="/"
                className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-body hover:bg-stone-100 transition"
              >
                <span className="flex items-center gap-2">
                  <span>🌐</span>
                  <span>View Public Site</span>
                </span>
                <span className="text-muted text-[11px]">↗</span>
              </Link>
              <form method="post" action="/api/admin/logout">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <span>🚪</span>
                  <span>Sign out</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {/* Desktop Sticky Sidebar (lg+) */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r border-line bg-white/95 backdrop-blur-md shadow-xs">
        {/* Brand Header */}
        <div className="px-5 pt-5 pb-4 border-b border-line">
          <Link
            to="/admin"
            preload="intent"
            className="flex items-center gap-2.5 font-display text-[18px] font-semibold tracking-tight text-ink transition hover:opacity-85"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-sm text-canvas">
              🍎
            </span>
            <span>PickMacApps</span>
          </Link>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-muted uppercase">
              Admin Console
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-600/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 [scrollbar-width:thin]">
          {/* Core Operations */}
          <div>
            <p className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-muted/80 uppercase">
              Core Management
            </p>
            <nav className="space-y-1">
              {coreNav.map((item) => {
                const isActive = active === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    preload="intent"
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-ink font-semibold text-canvas shadow-xs"
                        : "text-body hover:bg-stone-100 hover:text-ink"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    {isActive ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Automations & Moderation */}
          <div>
            <p className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-muted/80 uppercase">
              Automations & Badges
            </p>
            <nav className="space-y-1">
              {systemNav.map((item) => {
                const isActive = active === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    preload="intent"
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-ink font-semibold text-canvas shadow-xs"
                        : "text-body hover:bg-stone-100 hover:text-ink"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    {isActive ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Actions / Create Menu */}
          <div>
            <p className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-muted/80 uppercase">
              Quick Actions
            </p>
            <div className="space-y-1">
              {quickNav.map((item) => {
                const isActive = active === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    preload="intent"
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-ink font-semibold text-canvas shadow-xs"
                        : "text-body hover:bg-stone-100 hover:text-ink"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-accent/10 text-accent group-hover:bg-accent/20"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="border-t border-line p-3.5 space-y-1 mt-auto bg-stone-50/50">
          <Link
            to="/"
            preload="intent"
            onClick={() => {
              if (typeof window !== "undefined") {
                (window as unknown as { __invalidateDirectoryCache?: () => void }).__invalidateDirectoryCache?.();
              }
            }}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-body transition hover:bg-stone-100 hover:text-ink"
          >
            <span className="flex items-center gap-2">
              <span>🌐</span>
              <span>View Public Site</span>
            </span>
            <span className="text-muted text-[10px]">↗</span>
          </Link>
          <form method="post" action="/api/admin/logout">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-muted transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
            >
              <span>🚪</span>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 px-4 py-5 pb-24 sm:px-6 sm:py-7 lg:px-8 lg:py-8 lg:pb-12">
        {/* Page Top Header with Title and Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-5">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink truncate">
              {title}
            </h1>
            {lede ? <p className="mt-1 max-w-3xl text-xs sm:text-sm leading-relaxed text-body">{lede}</p> : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {actions}
            </div>
          ) : null}
        </div>

        {/* Page Body */}
        <div className="mt-6">{children}</div>
      </div>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-line bg-white/95 px-2 backdrop-blur-md lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      >
        <Link
          to="/admin"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition ${
            active === "overview" ? "font-bold text-ink" : "text-muted hover:text-ink"
          }`}
        >
          <span className="text-base">📊</span>
          <span>Overview</span>
        </Link>
        <Link
          to="/admin/submissions"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition ${
            active === "submissions" ? "font-bold text-ink" : "text-muted hover:text-ink"
          }`}
        >
          <span className="text-base">📥</span>
          <span>Submissions</span>
        </Link>
        <Link
          to="/admin/apps"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition ${
            active === "apps" ? "font-bold text-ink" : "text-muted hover:text-ink"
          }`}
        >
          <span className="text-base">📱</span>
          <span>Apps</span>
        </Link>
        <Link
          to="/admin/stats"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition ${
            active === "stats" ? "font-bold text-ink" : "text-muted hover:text-ink"
          }`}
        >
          <span className="text-base">📈</span>
          <span>Analytics</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium text-muted hover:text-ink transition cursor-pointer"
        >
          <span className="text-base">☰</span>
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
