import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-[20px] font-medium text-ink transition-opacity hover:opacity-75">
          PickMacApps
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            hash="apps"
            className="hidden items-center rounded-lg px-3 py-2 text-sm text-body transition-colors hover:text-ink sm:inline-flex"
          >
            Apps
          </Link>
          <Link
            to="/alternatives"
            className="inline-flex items-center rounded-lg px-2 py-2 text-sm text-body transition-colors hover:text-ink sm:px-3"
          >
            Alternatives
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center rounded-lg px-2 py-2 text-sm text-body transition-colors hover:text-ink sm:px-3"
          >
            Blog
          </Link>
          <Link
            to="/submit"
            className="inline-flex items-center rounded-lg border border-line-2 bg-surface px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2 sm:px-3.5"
          >
            Submit
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
