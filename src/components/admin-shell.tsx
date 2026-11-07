import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

export type AdminSection = "overview" | "apps" | "add_app" | "guides" | "add_guide";

const mainNav = [
  { to: "/admin", label: "Overview", id: "overview" as const, icon: "📊" },
  { to: "/admin/apps", label: "All Apps", id: "apps" as const, icon: "📱" },
  { to: "/admin/guides", label: "All Guides", id: "guides" as const, icon: "📖" },
];

const quickNav = [
  { to: "/admin/apps/new", label: "Add New App", id: "add_app" as const, icon: "➕", badge: "New" },
  { to: "/admin/guides/new", label: "Add New Guide", id: "add_guide" as const, icon: "✍️", badge: "New" },
];

export const fieldClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-ink";

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
  ok: "bg-emerald-50 text-emerald-800",
  wait: "bg-amber-50 text-amber-900",
  off: "bg-stone-100 text-stone-600",
  choice: "bg-accent/10 text-accent",
} as const;

export function Pill({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
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
};

export function Notice({ error, saved }: { error: string; saved: string }) {
  if (!error && !saved) return null;
  if (error) {
    return <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-xs">{error}</p>;
  }
  return (
    <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-xs">
      {savedCopy[saved] ?? "Saved."}
    </p>
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
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  return (
    <div className="min-h-screen bg-[#f4f3ef] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* Top Loading Progress Bar */}
      {isLoading ? (
        <div
          role="status"
          aria-label="Loading page"
          className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-gradient-to-r from-accent via-amber-400 to-sky-500 animate-pulse shadow-xs"
        />
      ) : null}

      {/* Redesigned Sidebar */}
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0 shadow-xs">
        {/* Brand Header */}
        <div className="px-5 pt-5 pb-4 border-b border-line/60">
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
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* Main Navigation */}
          <div>
            <p className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-muted/80 uppercase">
              Main Menu
            </p>
            <nav className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
              {mainNav.map((item) => {
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

        {/* Sidebar Footer */}
        <div className="border-t border-line/60 p-3 space-y-1 mt-auto">
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
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-muted transition hover:bg-stone-100 hover:text-rose-600"
            >
              <span>🚪</span>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-ink">{title}</h1>
            {lede ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-body">{lede}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <form method="post" action="/api/admin/logout" className="lg:hidden">
              <button type="submit" className="text-sm text-muted underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
