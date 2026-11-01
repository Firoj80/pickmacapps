import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

const nav = [
  { to: "/admin", label: "Overview", id: "overview" },
  { to: "/admin/apps", label: "Apps", id: "apps" },
  { to: "/admin/guides", label: "Guides", id: "guides" },
] as const;

export type AdminSection = (typeof nav)[number]["id"];

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
  "1": "Saved.",
  price: "Price updated.",
  badges: "Badge check finished.",
  approved: "Listing approved and published.",
  rejected: "Submission rejected.",
};

export function Notice({ error, saved }: { error: string; saved: string }) {
  if (!error && !saved) return null;
  if (error) {
    return <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{error}</p>;
  }
  return (
    <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
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
  return (
    <div className="min-h-screen bg-[#f4f3ef] lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0">
        <div className="px-5 pt-5 pb-3">
          <Link to="/admin" className="font-display text-[17px] font-semibold tracking-tight text-ink">
            PickMacApps
          </Link>
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Admin</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible">
          {nav.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className={`block rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
                active === item.id ? "bg-ink font-medium text-canvas" : "text-body hover:bg-[#f4f3ef]"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/" className="block rounded-lg px-3 py-2 text-sm whitespace-nowrap text-muted hover:bg-[#f4f3ef]">
            View site
          </Link>
        </nav>
        <form method="post" action="/api/admin/logout" className="mt-auto hidden px-3 pt-4 pb-5 lg:block">
          <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-[#f4f3ef]">
            Sign out
          </button>
        </form>
      </aside>
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
