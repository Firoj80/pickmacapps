import { Link } from "@tanstack/react-router";
import { editors, type AppItem } from "@/lib/catalog";

const covers = ["#f6d6c6", "#d7e4f5", "#e7d7f2", "#d8efe2", "#f3e6c4", "#f6d5e2", "#d9e8e4"];

export function AppCard({ app, size = "md" }: { app: AppItem; size?: "lg" | "md" | "sm" }) {
  const choice = editors.has(app.slug);
  const icon = size === "lg" ? "h-14 w-14" : size === "md" ? "h-12 w-12" : "h-10 w-10";
  const title = size === "lg" ? "text-[20px]" : size === "md" ? "text-[17px]" : "text-[15px]";
  const tag = size === "lg" ? "text-[15px]" : size === "md" ? "text-[14px]" : "text-[13px]";
  const gap = size === "lg" ? "gap-4" : "gap-3.5";
  const image = app.demo && !app.demo.endsWith(".mp4") ? app.demo : "";
  const wash = covers[app.name.length % covers.length];

  return (
    <Link to="/app/$slug" params={{ slug: app.slug }} className="shelf-card rise group block min-w-0">
      <div className="cover relative aspect-[1200/630] overflow-hidden rounded-2xl border border-line/80 bg-surface-2">
        {image ? (
          <img alt="" src={image} className="h-full w-full object-cover" />
        ) : (
          <div className="wash h-full w-full" style={{ background: `linear-gradient(135deg, ${wash} 0%, #111113 78%)` }} />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,rgba(255,255,255,0.55),transparent_55%)] opacity-70 mix-blend-overlay" />
      </div>
      <div className={`mt-4 flex ${gap}`}>
        <img alt="" src={app.icon} className={`mark mt-0.5 shrink-0 rounded-xl bg-white object-cover ${icon}`} />
        <div className="min-w-0">
          <h3 className={`${title} truncate font-semibold tracking-tight text-ink`}>{app.name}</h3>
          <p className={`mt-0.5 line-clamp-2 ${tag} leading-relaxed text-muted`}>{app.tagline}</p>
          {choice ? <p className="mt-1 text-[11px] font-medium text-muted">Paid placement</p> : null}
        </div>
      </div>
    </Link>
  );
}
