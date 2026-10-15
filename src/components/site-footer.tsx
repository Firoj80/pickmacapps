import { Link } from "@tanstack/react-router";
import { categories } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-canvas">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="text-[19px] font-medium text-ink">
              PickMacApps
            </Link>
            <p className="mt-3 max-w-[26ch] text-[13px] leading-relaxed text-muted">
              A growing directory of the best apps for macOS, added by developers and makers
              everywhere.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink">Browse</p>
            <ul className="mt-3.5 space-y-2.5">
              <li>
                <Link to="/" hash="apps" className="text-[13px] text-muted transition-colors hover:text-ink">
                  All Apps
                </Link>
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
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    to="/category/$slug"
                    params={{ slug: category.slug }}
                    className="text-[13px] text-muted transition-colors hover:text-ink"
                  >
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
                <a
                  href="https://x.com/hii_mohit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-muted transition-colors hover:text-ink"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-line pt-8">
          <p className="text-[13px] font-semibold text-ink">Popular Categories</p>
          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
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
        <div className="mt-12 flex flex-col-reverse items-start gap-5 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-faint">© 2026 PickMacApps. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3">
            <a href="https://wired.business" target="_blank" rel="noopener noreferrer">
              <img src="https://wired.business/badge0-white.svg" alt="Featured on Wired Business" width="160" height="43" />
            </a>
            <a href="https://findly.tools/try-mac-apps?utm_source=try-mac-apps" target="_blank" rel="noopener noreferrer">
              <img
                src="https://findly.tools/badges/findly-tools-badge-light.svg"
                alt="Featured on Findly.tools"
                width="140"
                height="44"
                className="dark:hidden"
              />
              <img
                src="https://findly.tools/badges/findly-tools-badge-dark.svg"
                alt="Featured on Findly.tools"
                width="140"
                height="44"
                className="hidden dark:block"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
