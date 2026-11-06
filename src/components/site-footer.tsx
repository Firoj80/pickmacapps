import { Link, useRouteContext } from "@tanstack/react-router";
import { isEditorChoice } from "@/lib/catalog";
import { publishedApps } from "@/lib/app-seed";

const creatorUrl = "https://x.com/hiii_firoj";

export function SiteFooter() {
  const { directory } = useRouteContext({ from: "__root__" });
  const list = publishedApps(directory);
  const categories = [...(directory?.categories ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const featured = list.filter((app) => isEditorChoice(app));

  return (
    <footer className="mt-auto border-t border-line bg-canvas">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="text-[19px] font-medium text-ink">
              PickMacApps
            </Link>
            <p className="mt-3 max-w-[34ch] text-[13px] leading-relaxed text-muted">
              A curated shelf of hand-picked Mac apps.
            </p>
            <a
              href={creatorUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-[13px] text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
            >
              Created by @hiii_firoj
            </a>
            <p className="mt-6 max-w-[36ch] text-[13px] leading-relaxed text-muted">
              New listings are added by hand. Follow updates on X.
            </p>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[13px] font-semibold text-ink">Categories</p>
            <ul className="mt-3.5 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    to="/category/$slug"
                    params={{ slug: category.slug }}
                    className="inline-flex items-center gap-2 text-[13px] text-muted transition-colors hover:text-ink"
                  >
                    <span aria-hidden="true" className="w-4 text-center text-[14px] leading-none">
                      {category.emoji}
                    </span>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[13px] font-semibold text-ink">Featured</p>
            <ul className="mt-3.5 space-y-2.5">
              {featured.length === 0 ? (
                <li className="text-[13px] text-muted">No Editor’s Choice apps right now.</li>
              ) : (
                featured.map((app) => (
                  <li key={app.slug}>
                    <Link
                      to="/app/$slug"
                      params={{ slug: app.slug }}
                      className="inline-flex items-center gap-2.5 text-[13px] text-muted transition-colors hover:text-ink"
                    >
                      <img
                        alt=""
                        src={app.icon}
                        onError={(event) => {
                          event.currentTarget.src = "/site-favicon.svg";
                        }}
                        className="h-6 w-6 shrink-0 rounded-md object-cover ring-1 ring-line"
                      />
                      {app.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6">
          <Link to="/about" className="text-[13px] text-muted transition-colors hover:text-ink">
            About
          </Link>
          <Link to="/how-we-pick" className="text-[13px] text-muted transition-colors hover:text-ink">
            How we pick
          </Link>
          <Link to="/blog" className="text-[13px] text-muted transition-colors hover:text-ink">
            Blog
          </Link>
          <Link to="/compare" className="text-[13px] text-muted transition-colors hover:text-ink">
            Alternatives
          </Link>
          <Link to="/submit" className="text-[13px] text-muted transition-colors hover:text-ink">
            Submit an app
          </Link>
          <Link to="/privacy" className="text-[13px] text-muted transition-colors hover:text-ink">
            Privacy
          </Link>
        </div>
        <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-muted">
          A hand-picked directory. Not affiliated with Apple Inc. — all app marks belong to their respective owners.
        </p>
        <p className="mt-3 text-[13px] text-muted">© {new Date().getFullYear()} PickMacApps</p>
      </div>
    </footer>
  );
}
