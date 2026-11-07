import { Link, useRouteContext } from "@tanstack/react-router";
import { isEditorChoice } from "@/lib/catalog";
import { publishedApps } from "@/lib/app-seed";

const creatorUrl = "https://x.com/hiii_firoj";

export function SiteFooter() {
  const { directory } = useRouteContext({ from: "__root__" });
  const list = publishedApps(directory);
  const categories = [...(directory?.categories ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  // Editor's Choice apps first, backfilled with top published apps up to 8 items
  const editorApps = list.filter((app) => isEditorChoice(app));
  const otherApps = list.filter((app) => !isEditorChoice(app));
  const featured = [...editorApps, ...otherApps].slice(0, 8);

  return (
    <footer className="mt-auto border-t border-line bg-canvas">
      <div className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6 lg:py-16">
        {/* 4-Column Main Layout matching Macapp Supply reference */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-12 lg:gap-10">
          {/* Column 1: Brand & Creator */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight text-ink">
              <span>PickMacApps</span>
            </Link>
            <p className="mt-3 max-w-[28ch] text-[13px] leading-relaxed text-muted">
              A curated shelf of beautifully designed macOS apps.
            </p>

            {/* Curated by badge pill */}
            <div className="mt-5">
              <a
                href={creatorUrl}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-full border border-line bg-surface py-1 pr-4 pl-1.5 shadow-xs transition-all hover:border-line-2 hover:bg-surface-2"
              >
                <img
                  src="/firoj.jpg"
                  alt="Firoj Alam"
                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                />
                <div className="flex items-center gap-1.5 text-[13px]">
                  <span className="text-muted">Curated by</span>
                  <span className="font-semibold text-ink group-hover:underline">Firoj Alam</span>
                </div>
              </a>
            </div>
          </div>

          {/* Column 2: Menu */}
          <div className="col-span-1 lg:col-span-2">
            <p className="text-[14px] font-semibold text-ink mb-3.5">Menu</p>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link to="/" className="text-muted transition-colors hover:text-ink">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-muted transition-colors hover:text-ink">
                  Alternatives
                </Link>
              </li>
              <li>
                <Link to="/submit" className="text-muted transition-colors hover:text-ink">
                  Submit an app
                </Link>
              </li>
              <li>
                <Link
                  to="/sponsor"
                  className="group inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
                >
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-xs">
                    ✓
                  </span>
                  <span className="font-medium text-ink group-hover:text-amber-600">Sponsor</span>
                </Link>
              </li>
              <li>
                <Link to="/how-we-pick" className="text-muted transition-colors hover:text-ink">
                  Listing Guidelines
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted transition-colors hover:text-ink">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted transition-colors hover:text-ink">
                  About
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted transition-colors hover:text-ink">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div className="col-span-1 lg:col-span-2">
            <p className="text-[14px] font-semibold text-ink mb-3.5">Categories</p>
            <ul className="space-y-2.5 text-[13px]">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    to="/category/$slug"
                    params={{ slug: category.slug }}
                    className="block text-muted transition-colors hover:text-ink truncate"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Featured Apps */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-4">
            <p className="text-[14px] font-semibold text-ink mb-3.5">Featured</p>
            <ul className="space-y-3 text-[13px]">
              {featured.length === 0 ? (
                <li className="text-muted">No featured apps right now.</li>
              ) : (
                featured.map((app) => (
                  <li key={app.slug}>
                    <Link
                      to="/app/$slug"
                      params={{ slug: app.slug }}
                      className="group flex items-center gap-2.5 text-muted transition-colors hover:text-ink"
                    >
                      <img
                        alt=""
                        src={app.icon}
                        onError={(event) => {
                          event.currentTarget.src = "/site-favicon.svg";
                        }}
                        className="h-5 w-5 shrink-0 rounded-md object-cover ring-1 ring-line group-hover:ring-accent"
                      />
                      <span className="truncate group-hover:text-ink">{app.name}</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar matching reference layout */}
        <div className="mt-14 flex flex-col gap-4 border-t border-line/70 pt-8 sm:flex-row sm:items-center sm:justify-between text-[12px] text-muted">
          <div>
            <span>© {new Date().getFullYear()} PickMacApps. All rights reserved.</span>
          </div>

          <p className="max-w-xl text-[11.5px] leading-relaxed text-muted sm:text-right">
            A manually curated collection. Some outbound links may be affiliate links. Not affiliated with Apple Inc. — all app marks belong to their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
