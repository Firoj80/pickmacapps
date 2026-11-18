import { Link, useRouterState, useRouteContext } from "@tanstack/react-router";
import { PickMacAppsIcon } from "@/components/brand-logo";
import { shelfCategories } from "@/lib/shelf-categories";

export function SiteSidebarContent({
  onOpenSearch,
  onClose,
  isMobile = false,
}: {
  onOpenSearch: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const currentSearch = useRouterState({ select: (s) => s.location.search }) as { sort?: string; cat?: string };
  const { directory } = useRouteContext({ from: "__root__" });

  const categories = directory?.categories?.length ? directory.categories : shelfCategories;
  const topCategories = categories.slice(0, 8);

  const isHome = currentPath === "/";
  const activeSort = isHome ? (currentSearch.sort || "featured") : "";
  const isPick = isHome && currentSearch.cat === "pick";
  const isFeatured = isHome && (activeSort === "featured" || isPick);

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Top Brand & Search Trigger */}
      <div className={`shrink-0 ${isMobile ? "pt-2" : "pt-6"}`}>
        <div className="flex items-center justify-between px-2.5">
          <Link
            to="/"
            preload="intent"
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 text-[19px] font-bold tracking-tight text-ink transition hover:opacity-80"
          >
            <PickMacAppsIcon className="h-6 w-6 shrink-0" />
            <span>PickMacApps</span>
          </Link>

          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink cursor-pointer"
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Button Trigger */}
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            onOpenSearch();
          }}
          aria-label="Search apps"
          className="mt-4 sm:mt-5 flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[13px] text-muted shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-line-2 hover:text-ink cursor-pointer"
        >
          <svg
            className="h-4 w-4 shrink-0 text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="flex-1 text-left">Search apps</span>
          <span className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
            ⌘K
          </span>
        </button>
      </div>

      {/* Navigation Links Area (Scrollable if needed) */}
      <nav
        aria-label="Browse"
        className="-mx-1 mt-4 sm:mt-5 min-h-0 flex-1 overflow-y-auto px-1 pb-6 [scrollbar-width:thin]"
      >
        {/* 1. DISCOVER Section */}
        <p className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Discover
        </p>
        <div className="mt-1.5 space-y-0.5">
          <Link
            to="/"
            search={{ sort: "featured", cat: "all" }}
            onClick={handleLinkClick}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition ${
              isFeatured
                ? "bg-surface font-semibold text-ink shadow-2xs border border-line/60"
                : "text-muted hover:bg-surface/70 hover:text-ink"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <svg className="h-4 w-4 text-accent fill-accent/20 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Featured</span>
            </span>
          </Link>

          <Link
            to="/"
            search={{ sort: "hot", cat: "all" }}
            onClick={handleLinkClick}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition ${
              isHome && activeSort === "hot" && !isPick
                ? "bg-surface font-semibold text-ink shadow-2xs border border-line/60"
                : "text-muted hover:bg-surface/70 hover:text-ink"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <svg className="h-4 w-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
              </svg>
              <span>Hot</span>
            </span>
          </Link>

          <Link
            to="/"
            search={{ sort: "new", cat: "all" }}
            onClick={handleLinkClick}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition ${
              isHome && activeSort === "new"
                ? "bg-surface font-semibold text-ink shadow-2xs border border-line/60"
                : "text-muted hover:bg-surface/70 hover:text-ink"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <svg className="h-4 w-4 text-sky-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                <path d="M20 2v4" />
                <path d="M22 4h-4" />
                <circle cx="4" cy="20" r="2" />
              </svg>
              <span>Latest</span>
            </span>
          </Link>

          <Link
            to="/"
            search={{ sort: "trending", cat: "all" }}
            onClick={handleLinkClick}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition ${
              isHome && activeSort === "trending"
                ? "bg-surface font-semibold text-ink shadow-2xs border border-line/60"
                : "text-muted hover:bg-surface/70 hover:text-ink"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <svg className="h-4 w-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 7h6v6" />
                <path d="m22 7-8.5 8.5-5-5L2 17" />
              </svg>
              <span>Trending</span>
            </span>
          </Link>
        </div>

        {/* 2. CATEGORIES Section */}
        <div className="mt-6 flex items-center justify-between pr-2.5">
          <p className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Categories
          </p>
          <Link
            to="/category"
            onClick={handleLinkClick}
            className="text-[11px] text-muted transition hover:text-ink font-medium"
          >
            View all
          </Link>
        </div>
        <div className="mt-1.5 space-y-0.5">
          {topCategories.map((cat) => {
            const isActive = currentPath === `/category/${cat.slug}`;
            return (
              <Link
                key={cat.slug}
                to="/category/$slug"
                params={{ slug: cat.slug }}
                onClick={handleLinkClick}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-[13px] transition ${
                  isActive
                    ? "bg-surface font-semibold text-ink shadow-2xs border border-line/60"
                    : "text-muted hover:bg-surface/70 hover:text-ink"
                }`}
              >
                <span className="truncate">{cat.name}</span>
              </Link>
            );
          })}
        </div>

        {/* 3. MORE Section */}
        <p className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mt-6">
          More
        </p>
        <div className="mt-1.5 space-y-0.5">
          <Link
            to="/leaderboard"
            onClick={handleLinkClick}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition ${
              currentPath === "/leaderboard"
                ? "bg-surface font-semibold text-ink shadow-2xs border border-line/60"
                : "text-muted hover:bg-surface/70 hover:text-ink"
            }`}
          >
            <svg className="h-4 w-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
              <path d="M6 4h12v7a6 6 0 0 1-12 0V4Z" />
            </svg>
            <span>Leaderboard</span>
          </Link>

          <Link
            to="/compare"
            onClick={handleLinkClick}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition ${
              currentPath.startsWith("/compare")
                ? "bg-surface font-semibold text-ink shadow-2xs border border-line/60"
                : "text-muted hover:bg-surface/70 hover:text-ink"
            }`}
          >
            <svg className="h-4 w-4 text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="18" r="3" />
              <circle cx="6" cy="6" r="3" />
              <path d="M13 6h3a2 2 0 0 1 2 2v7" />
              <path d="M11 18H8a2 2 0 0 1-2-2V9" />
            </svg>
            <span>Alternatives</span>
          </Link>

          <Link
            to="/blog"
            onClick={handleLinkClick}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition ${
              currentPath.startsWith("/blog")
                ? "bg-surface font-semibold text-ink shadow-2xs border border-line/60"
                : "text-muted hover:bg-surface/70 hover:text-ink"
            }`}
          >
            <svg className="h-4 w-4 text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <span>Blog</span>
          </Link>

          <Link
            to="/sponsor"
            onClick={handleLinkClick}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition ${
              currentPath === "/sponsor"
                ? "bg-surface font-semibold text-ink shadow-2xs border border-line/60"
                : "text-muted hover:bg-surface/70 hover:text-ink"
            }`}
          >
            <svg className="h-4 w-4 text-amber-500 fill-amber-500/20 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Sponsor</span>
          </Link>
        </div>
      </nav>

      {/* Pinned Bottom CTA */}
      <div className="shrink-0 border-t border-line/70 py-4">
        <Link
          to="/submit"
          onClick={handleLinkClick}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas transition hover:opacity-90 shadow-xs"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          <span>Submit an app</span>
        </Link>
      </div>
    </div>
  );
}

export function SiteSidebar({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <aside
      className="hidden lg:block lg:min-h-0 w-[264px] shrink-0"
      aria-label="Site navigation"
    >
      <div className="h-full min-h-0 px-4">
        <SiteSidebarContent onOpenSearch={onOpenSearch} />
      </div>
    </aside>
  );
}
