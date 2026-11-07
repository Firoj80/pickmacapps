import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { Missing } from "@/components/missing";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buildMetadata, fetchSiteOrigin, originFrom } from "@/lib/seo";
import { fetchDirectory } from "@/lib/directory.fn";
import { pageCopy } from "@/lib/site";
import appCss from "../styles.css?url";

// ---------------------------------------------------------------------------
// Client-side directory cache
// ---------------------------------------------------------------------------
// The root beforeLoad previously called fetchDirectory() on EVERY navigation,
// blocking the router (and making single clicks appear broken) because
// TanStack Router awaits beforeLoad before completing any navigation.
//
// We cache the result in module scope for DIRECTORY_STALE_MS (5 min) so that
// client-side SPA navigations reuse the already-fetched data instantly.
// SSR always fetches fresh (no module cache persists between requests).
// ---------------------------------------------------------------------------
const STALE_MS = 5 * 60 * 1000; // 5 minutes

// --- Directory cache ---
type DirectoryResult = Awaited<ReturnType<typeof fetchDirectory>>;
let _directoryCache: DirectoryResult | null = null;
let _directoryCachedAt = 0;
let _directoryPromise: Promise<DirectoryResult | null> | null = null;

async function getCachedDirectory(): Promise<DirectoryResult | null> {
  // Server-side: never share cache between requests
  if (typeof window === "undefined") {
    try {
      return await fetchDirectory();
    } catch {
      return null;
    }
  }
  // Client-side: return cached value if still fresh
  const now = Date.now();
  if (_directoryCache !== null && now - _directoryCachedAt < STALE_MS) {
    return _directoryCache;
  }
  // Deduplicate concurrent fetches (e.g. rapid navigation)
  if (_directoryPromise) return _directoryPromise;
  _directoryPromise = fetchDirectory()
    .then((result) => {
      _directoryCache = result;
      _directoryCachedAt = Date.now();
      _directoryPromise = null;
      return result;
    })
    .catch(() => {
      _directoryPromise = null;
      return _directoryCache; // return stale on error rather than null
    });
  return _directoryPromise;
}

// --- Origin cache ---
let _originCache: string | null = null;
let _originCachedAt = 0;
let _originPromise: Promise<string> | null = null;

async function getCachedOrigin(): Promise<string> {
  if (typeof window === "undefined") {
    try {
      return await fetchSiteOrigin();
    } catch {
      return "";
    }
  }
  const now = Date.now();
  if (_originCache !== null && now - _originCachedAt < STALE_MS) {
    return _originCache;
  }
  if (_originPromise) return _originPromise;
  _originPromise = fetchSiteOrigin()
    .then((result) => {
      _originCache = result;
      _originCachedAt = Date.now();
      _originPromise = null;
      return result;
    })
    .catch(() => {
      _originPromise = null;
      return _originCache ?? "";
    });
  return _originPromise;
}

const THEME_SCRIPT = `(function(){try{var d=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)");function a(){var t=localStorage.getItem("theme");if(t!=="dark"&&t!=="system")t="light";d.dataset.theme=t;d.classList.toggle("dark",t==="dark"||(t==="system"&&m.matches))}a();m.addEventListener("change",a)}catch(e){}})()`;

function Frame() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const admin = path.startsWith("/admin");
  return (
    <>
      {admin ? null : <SiteHeader />}
      <div className="flex-1">
        <Outlet />
      </div>
      {admin ? null : <SiteFooter />}
    </>
  );
}

export const Route = createRootRoute({
  beforeLoad: async () => {
    let origin = "";
    try {
      origin = await getCachedOrigin();
    } catch {
      origin = "";
    }
    try {
      const directory = await getCachedDirectory();
      return { origin, directory };
    } catch (err) {
      console.error("[root.beforeLoad] fetchDirectory error:", err);
      return { origin, directory: null };
    }
  },
  notFoundComponent: () => (
    <Missing title="Page not found" body="That page isn't part of the directory." />
  ),
  head: ({ matches }) => {
    const missing = matches.some((match) => match.status === "notFound" || match._notFound);
    const origin = originFrom(matches);
    const described = (path: string) => ({
      rel: "describedby",
      href: origin ? `${origin}${path}` : path,
      type: "text/plain",
    });
    const missingMeta = missing
      ? buildMetadata({
          title: pageCopy.notFound.title,
          description: pageCopy.notFound.description,
          path: "/",
          origin,
          noindex: true,
        })
      : null;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#ffffff" },
        ...(missingMeta?.meta ?? []),
      ],
      links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap",
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      described("/llms.txt"),
      described("/llms-full.txt"),
      described("/ai.txt"),
      ...(missingMeta?.links ?? []),
      ],
      scripts: [{ children: THEME_SCRIPT }],
    };
  },
  component: () => (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-full flex-col bg-canvas font-sans text-body">
        <AuthProvider>
          <Frame />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
