import { createFileRoute, Link } from "@tanstack/react-router";
import { AppGrid } from "@/components/app-grid";
import { ArrowIcon } from "@/components/icons";
import { apps, hero, posts } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  component: Home,
});

const numberFormat = new Intl.NumberFormat("en-US");

function Home() {
  const guides = posts.slice(0, 3);
  return (
    <main className="flex-1">
      <section className="hero-grid relative overflow-hidden border-b border-line px-4 py-12 text-center sm:px-6 lg:py-16">
        <div className="relative mx-auto max-w-3xl">
          <h1 className="font-[family-name:var(--font-display)] text-3xl leading-9 font-bold tracking-[-0.04em] text-ink md:text-5xl md:leading-none">
            Try the Best Mac apps
            <br />
            on the Internet
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-6 text-body md:text-lg md:leading-7">
            Skip the endless lists. Discover genuinely useful, beautifully built Mac apps shared by
            developers and makers from around the world.
          </p>
          <div className="mt-10 flex justify-center" aria-label="Featured Mac apps">
            {hero.map((icon) => (
              <Link
                key={icon.slug}
                to="/app/$slug"
                params={{ slug: icon.slug }}
                title={icon.title}
                style={{ transform: icon.style.replace(/^transform:/, "") }}
                className={`group -mx-1.5 shrink-0 transition-transform duration-200 hover:z-10 sm:-mx-2 ${icon.mobile ? "" : "hidden sm:block"}`}
              >
                <span className="block transition-transform duration-200 group-hover:-translate-y-2 group-hover:scale-110">
                  <span className="relative block h-12 w-12 overflow-hidden rounded-[22%] bg-surface shadow-lg shadow-black/15 ring-2 ring-canvas sm:h-14 sm:w-14">
                    <img alt={icon.title} src={icon.src} className="h-full w-full object-cover" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <div
              className="inline-flex items-center gap-3 rounded-full border border-line bg-surface p-1 pr-4 text-sm shadow-sm"
              aria-live="polite"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>
                  <span className="font-semibold tabular-nums">{numberFormat.format(8)}</span> online now
                </span>
              </span>
              <span className="text-muted">
                <span className="font-semibold text-ink tabular-nums">{numberFormat.format(1938)}</span>{" "}
                visitors in the last 7 days
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16">
        <AppGrid apps={apps} />
        <section className="mt-20">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <h2 className="text-[19px] font-[550] tracking-[-0.025em] text-ink">
              Guides to the best Mac apps
            </h2>
            <span aria-hidden="true" className="hidden h-px min-w-8 flex-1 bg-line sm:block" />
            <Link
              to="/blog"
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-medium text-body transition-colors hover:border-line-2 hover:text-ink"
            >
              Read the blog
              <ArrowIcon />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((post) => (
              <Link
                key={post.slug}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="flex flex-col rounded-xl border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-2 hover:bg-surface-2"
              >
                <h3 className="text-[17px] leading-snug font-[550] tracking-[-0.025em] text-ink">
                  {post.title}
                </h3>
                <p className="clamp-2 mt-2.5 text-[14px] leading-[1.45] text-body">{post.excerpt}</p>
                <p className="mt-auto pt-4 text-[12.5px] text-muted">{post.minutes} min read</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
