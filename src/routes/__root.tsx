import { useEffect, useRef } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { Missing } from "@/components/missing";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buildMetadata, fetchSiteOrigin, originFrom, PRIMARY_ORIGIN } from "@/lib/seo";
import {
  getCachedDirectory,
  invalidateDirectoryCache,
  seedDirectoryCache,
  type DirectoryResult,
} from "@/lib/directory-cache";
import { pageCopy } from "@/lib/site";
import { getStoredTheme, syncThemeToDom } from "@/lib/theme";
import appCss from "../styles.css?url";

export { invalidateDirectoryCache };

// --- Origin cache ---
function getCachedOrigin(): string | Promise<string> {
  if (typeof window !== "undefined") {
    return window.location.origin || PRIMARY_ORIGIN;
  }
  return fetchSiteOrigin().catch(() => PRIMARY_ORIGIN);
}

const THEME_SCRIPT = `(function(){try{var d=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)");function a(){var adm=/^\\/admin(\\/|$)/.test(location.pathname);var t=localStorage.getItem("theme");if(t!=="dark"&&t!=="system")t="light";var dark=!adm&&(t==="dark"||(t==="system"&&m.matches));d.dataset.theme=adm?"light":t;d.classList.toggle("dark",dark);var mc=document.querySelector('meta[name="theme-color"]');if(mc)mc.setAttribute("content",dark?"#08090a":"#ffffff")}a();m.addEventListener("change",a)}catch(e){}})()`;

const MINILYTICS_HOST = "https://minilytics.firojstats.workers.dev";
const MINILYTICS_ADMIN_GUARD = `(function(){try{var w=window,l=w.location,u="${MINILYTICS_HOST}";if(w.__mlAdminGuard)return;w.__mlAdminGuard=1;function isAdm(){return /^\\/admin(\\/|$)/.test(l.pathname)}var origFetch=w.fetch;if(origFetch){w.fetch=function(input){var target=typeof input==="string"?input:input&&typeof input==="object"&&"url"in input?String(input.url):"";if(isAdm()&&target.indexOf(u)===0)return Promise.resolve(new Response(null,{status:204}));return origFetch.apply(this,arguments)}}var nav=w.navigator;if(nav&&nav.sendBeacon){var origBeacon=nav.sendBeacon.bind(nav);nav.sendBeacon=function(target){if(isAdm()&&typeof target==="string"&&target.indexOf(u)===0)return true;return origBeacon.apply(nav,arguments)}}}catch(e){}})()`;

function NavigationProgressBar() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  if (!isLoading) return null;
  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      className="fixed top-0 left-0 right-0 z-[99999] h-[3px] bg-gradient-to-r from-accent via-amber-400 to-sky-500 animate-pulse pointer-events-none shadow-xs"
    />
  );
}

function Frame() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { directory } = Route.useRouteContext();
  const admin = path.startsWith("/admin");
  const wasAdminRef = useRef(admin);

  useEffect(() => {
    syncThemeToDom(getStoredTheme(), path);
    if (wasAdminRef.current && !admin) {
      invalidateDirectoryCache();
    }
    wasAdminRef.current = admin;
  }, [path, admin]);

  useEffect(() => {
    if (!admin && directory) {
      seedDirectoryCache(directory);
    }
  }, [admin, directory]);

  return (
    <>
      <NavigationProgressBar />
      {admin ? null : <SiteHeader />}
      <div className="flex-1">
        <Outlet />
      </div>
      {admin ? null : <SiteFooter />}
    </>
  );
}

export const Route = createRootRoute({
  beforeLoad: async ({ context, location }) => {
    // For admin pages, resolve instantly without querying public directory
    if (location.pathname.startsWith("/admin")) {
      return { origin: "", directory: null };
    }
    const origin = typeof window !== "undefined"
      ? (window.location.origin || PRIMARY_ORIGIN)
      : await getCachedOrigin();
    const directoryOrPromise = getCachedDirectory((context as { directory?: DirectoryResult | null })?.directory);
    const directory = directoryOrPromise instanceof Promise ? await directoryOrPromise : directoryOrPromise;
    return { origin, directory };
  },
  notFoundComponent: () => (
    <Missing title="Page not found" body="That page isn't part of the directory." />
  ),
  head: ({ matches }) => {
    const missing = matches.some((match) => match.status === "notFound" || match._notFound);
    const isAdminRoute = matches.some(
      (match) => match.pathname?.startsWith("/admin") || match.routeId?.startsWith("/admin"),
    );
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
        { name: "color-scheme", content: "light dark" },
        ...((process.env.GOOGLE_SITE_VERIFICATION || process.env.VITE_GOOGLE_SITE_VERIFICATION)
          ? [{ name: "google-site-verification", content: (process.env.GOOGLE_SITE_VERIFICATION || process.env.VITE_GOOGLE_SITE_VERIFICATION)! }]
          : []),
        ...(missingMeta?.meta ?? []),
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "preconnect", href: "https://wsrv.nl", crossOrigin: "anonymous" },
        { rel: "dns-prefetch", href: "https://wsrv.nl" },
        ...(!isAdminRoute
          ? [
              { rel: "preconnect", href: MINILYTICS_HOST, crossOrigin: "anonymous" as const },
              { rel: "dns-prefetch", href: MINILYTICS_HOST },
            ]
          : []),
        { rel: "preconnect", href: "https://pub-621eb870dc3341c586576c494fa43fdc.r2.dev", crossOrigin: "anonymous" },
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
      scripts: [
        { children: THEME_SCRIPT },
        ...(!isAdminRoute
          ? [
              { children: MINILYTICS_ADMIN_GUARD },
              {
                src: `${MINILYTICS_HOST}/js/script.js`,
                defer: true,
                "data-website-id": "5q3e1c3f5d0d1518",
              },
            ]
          : []),
      ],
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
