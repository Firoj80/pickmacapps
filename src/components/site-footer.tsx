import { Link, useRouteContext } from "@tanstack/react-router";
import { categories } from "@/lib/catalog";
import { publishedApps } from "@/lib/app-seed";

export function SiteFooter() {
  const { directory } = useRouteContext({ from: "__root__" });
  const list = publishedApps(directory);
  const used = categories.filter((category) => list.some((app) => app.category === category.slug));

  return (
    <footer className="mt-auto border-t border-line bg-canvas">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="text-[19px] font-medium text-ink">
              PickMacApps
            </Link>
            <p className="mt-3 max-w-[26ch] text-[13px] leading-relaxed text-muted">
              A growing directory of useful Mac apps, picked by hand.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink">Browse</p>
            <ul className="mt-3.5 space-y-2.5">
              <li>
                <a className="text-[13px] text-muted transition-colors hover:text-ink" href="/#apps">
                  All Apps
                </a>
              </li>
              <li>
                <Link to="/blog" className="text-[13px] text-muted transition-colors hover:text-ink">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/submit" className="text-[13px] text-muted transition-colors hover:text-ink">
                  Submit an App
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink">Categories</p>
            <ul className="mt-3.5 space-y-2.5">
              {used.map((category) => (
                <li key={category.slug}>
                  <Link to="/category/$slug" params={{ slug: category.slug }} className="text-[13px] text-muted transition-colors hover:text-ink">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink">Links</p>
            <ul className="mt-3.5 space-y-2.5">
              <li>
                <Link to="/about" className="text-[13px] text-muted transition-colors hover:text-ink">
                  About
                </Link>
              </li>
              <li>
                <Link to="/how-we-pick" className="text-[13px] text-muted transition-colors hover:text-ink">
                  How we pick
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-[13px] text-muted transition-colors hover:text-ink">
                  Alternatives
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-[13px] text-muted transition-colors hover:text-ink">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-line pt-8">
          <p className="text-[13px] font-semibold text-ink">Popular Categories</p>
          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
            {used.map((category) => (
              <Link
                key={category.slug}
                to="/category/$slug"
                params={{ slug: category.slug }}
                className="flex items-center gap-2.5 border-b border-line/70 pb-2.5 text-[13px] text-muted transition-colors hover:text-ink"
              >
                <span className="text-[13px] leading-none">{category.emoji}</span>
                {category.name} Apps
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-8 text-[13px] text-muted">© {new Date().getFullYear()} PickMacApps. Not affiliated with Apple.</p>
      </div>
    </footer>
  );
}
