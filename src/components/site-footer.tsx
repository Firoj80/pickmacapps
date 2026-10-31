import { Link, useRouteContext } from "@tanstack/react-router";
import { apps, categories, editors } from "@/lib/catalog";

const menu = [
  { to: "/", label: "Home" },
  { to: "/blog", label: "Guides" },
  { to: "/compare", label: "Comparisons" },
  { to: "/submit", label: "Submit an app" },
  { to: "/privacy", label: "Privacy" },
] as const;

const fan = ["-rotate-12 translate-y-1", "rotate-6 -translate-y-1.5", "-rotate-8 translate-y-2", "rotate-3 -translate-y-1"];

export function SiteFooter() {
  const { directory } = useRouteContext({ from: "__root__" });
  const list = directory?.apps ?? apps;
  const used = categories.filter((category) => list.some((app) => app.category === category.slug));
  const picks = list.filter((app) => app.editorChoice ?? editors.has(app.slug));
  const icons = picks.slice(0, 8);

  return (
    <footer className="mt-16 px-5 pt-12 pb-10 md:px-10">
      <div className="mx-auto w-full max-w-[1400px]">
        {icons.length > 0 ? (
          <div className="mb-14 flex justify-center overflow-hidden py-6">
            <div className="flex items-center">
              {icons.map((app, index) => (
                <Link
                  key={app.id}
                  to="/app/$slug"
                  params={{ slug: app.slug }}
                  aria-label={app.name}
                  className={`${index === 0 ? "" : "-ml-3 md:-ml-4"} ${fan[index] ?? ""} transition-transform duration-300 hover:z-10 hover:translate-y-0 hover:rotate-0 hover:scale-110`}
                >
                  <img alt="" src={app.icon} className="h-11 w-11 rounded-xl bg-white object-cover shadow-lg ring-1 ring-black/5 md:h-14 md:w-14 md:rounded-2xl" />
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-ink">
              <span>Pick</span>
              <img src="/favicon.svg" alt="" className="h-6 w-6 rounded-[5px] object-cover" />
              <span>MacApps</span>
            </Link>
            <p className="mt-3 max-w-[240px] text-[13px] leading-relaxed text-muted">
              A curated shelf of Mac apps worth installing.
            </p>
          </div>

          <div>
            <h2 className="text-[13px] font-semibold text-ink">Menu</h2>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {menu.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-ink transition hover:text-muted">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[13px] font-semibold text-ink">Categories</h2>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {used.length === 0 ? (
                <li className="text-faint">—</li>
              ) : (
                used.map((category) => (
                  <li key={category.slug}>
                    <Link to="/category/$slug" params={{ slug: category.slug }} className="text-ink transition hover:text-muted">
                      {category.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h2 className="text-[13px] font-semibold text-ink">Editor's Choice</h2>
            <ul className="mt-4 space-y-2.5">
              {picks.length === 0 ? (
                <li className="text-[14px] text-faint">—</li>
              ) : (
                picks.map((app) => (
                  <li key={app.id}>
                    <Link to="/app/$slug" params={{ slug: app.slug }} className="group flex items-center gap-2.5">
                      <img alt="" src={app.icon} className="h-7 w-7 shrink-0 rounded-lg bg-white object-cover" />
                      <span className="truncate text-[14px] text-ink transition group-hover:text-muted">{app.name}</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-[12px] leading-relaxed text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} PickMacApps. All rights reserved.</p>
          <p className="max-w-xl md:text-right">
            A manually curated collection. Not affiliated with Apple Inc. App marks belong to their owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
