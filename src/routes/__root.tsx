import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { Missing } from "@/components/missing";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { fetchSiteOrigin } from "@/lib/seo";
import appCss from "../styles.css?url";

const THEME_SCRIPT = `(function(){try{document.documentElement.classList.remove("dark");document.documentElement.dataset.theme="light";localStorage.removeItem("theme")}catch(e){}})()`;

export const Route = createRootRoute({
  beforeLoad: async () => {
    try {
      return { origin: await fetchSiteOrigin() };
    } catch {
      return { origin: "" };
    }
  },
  notFoundComponent: () => (
    <Missing title="Page not found" body="That page isn't part of the directory." />
  ),
  head: ({ matches }) => {
    const missing = matches.some((match) => match.status === "notFound" || match._notFound);
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#ffffff" },
        missing
          ? { title: "Page not found — PickMacApps" }
          : { title: "PickMacApps — Mac apps worth installing" },
        missing
          ? { name: "description", content: "That page isn't part of the directory." }
          : {
              name: "description",
              content: "A curated shelf of Mac apps. Browse by category, compare alternatives, and read short guides.",
            },
        ...(missing ? [{ name: "robots", content: "noindex" }] : []),
      ],
      links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap",
      },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
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
        <PreviewHostBridge />
        <AuthProvider>
          <SiteHeader />
          <div className="flex-1">
            <Outlet />
          </div>
          <SiteFooter />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
