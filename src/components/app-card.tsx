import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { addedLabel, editors, pricingLabel, type AppItem } from "@/lib/catalog";

export function AppCard({ app }: { app: AppItem; size?: "lg" | "md" | "sm" }) {
  const choice = app.editorChoice ?? editors.has(app.slug);
  return (
    <Link
      to="/app/$slug"
      params={{ slug: app.slug }}
      className={`group flex flex-col rounded-xl border p-5 transition-colors duration-200 ${choice ? "card-silver" : "border-line bg-surface hover:border-line-2"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            alt=""
            src={app.icon}
            onError={(event) => {
              event.currentTarget.src = "/site-favicon.svg";
            }}
            className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-line"
          />
          <h3 className="min-w-0 truncate text-xl font-[550] tracking-[-0.025em] text-ink">{app.name}</h3>
        </div>
        {choice ? <span className="silver-tag shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium">Editor’s Choice</span> : null}
      </div>
      <p className="clamp-2 mt-4 min-h-[2.75rem] text-[14px] leading-[1.45] text-body">{app.tagline}</p>
      <div className="mt-4 flex flex-col gap-2">
        <Spec label="Category" value={app.categoryName} icon={<LayersIcon />} />
        <Spec label="Pricing" value={pricingLabel[app.pricing]} icon={<TagIcon />} />
        <Spec label="Added" value={addedLabel(app.createdAt)} icon={<ClockIcon />} />
      </div>
    </Link>
  );
}

function Spec({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]">
      <span className="flex shrink-0 items-center gap-1.5 text-muted">
        {icon}
        {label}
      </span>
      <span aria-hidden="true" className="h-px min-w-3 flex-1 bg-line-2" />
      <span className="shrink-0 font-medium text-ink">{value}</span>
    </div>
  );
}

function LayersIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.6 13.4 12 22l-8-8V4h10l6.6 6.6a2 2 0 0 1 0 2.8z" />
      <circle cx="8.2" cy="8.2" r="1.4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}
