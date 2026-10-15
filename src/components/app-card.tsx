import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ClockIcon, FeaturedMark, LayersIcon, TagIcon } from "@/components/icons";
import { addedLabel, pricingLabel, type AppItem } from "@/lib/catalog";

function Meta({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
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

export function AppCard({ app, silver = false }: { app: AppItem; silver?: boolean }) {
  const choice = silver;
  return (
    <Link
      to="/app/$slug"
      params={{ slug: app.slug }}
      className={
        choice
          ? "card-silver group flex flex-col rounded-xl border p-5 transition-colors duration-200"
          : "group flex flex-col rounded-xl border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-2 hover:bg-surface-2"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
            <img alt={app.name} src={app.icon} className="h-full w-full object-cover" />
          </div>
          <h3 className="flex min-w-0 items-center gap-1.5 text-xl font-[550] tracking-[-0.025em] text-ink">
            <span className="truncate">{app.name}</span>
            {app.featured && !choice ? <FeaturedMark /> : null}
          </h3>
        </div>
        {choice ? (
          <span className="silver-tag shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium">
            Editor's Choice
          </span>
        ) : null}
      </div>
      <p className="clamp-2 mt-4 min-h-[2.75rem] text-[14px] leading-[1.45] text-body">{app.tagline}</p>
      <div className="mt-4 flex flex-col gap-2">
        <Meta icon={<LayersIcon />} label="Category" value={app.categoryName} />
        <Meta icon={<TagIcon />} label="Pricing" value={pricingLabel[app.pricing]} />
        <Meta icon={<ClockIcon />} label="Added" value={addedLabel(app.createdAt)} />
      </div>
    </Link>
  );
}
