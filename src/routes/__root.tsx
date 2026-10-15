import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import appCss from "../styles.css?url";

const THEME_SCRIPT = `(function(){try{var d=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)");function a(){var t=localStorage.getItem("theme");if(t!=="dark"&&t!=="system")t="light";d.dataset.theme=t;d.classList.toggle("dark",t==="dark"||(t==="system"&&m.matches))}a();m.addEventListener("change",a)}catch(e){}})()`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PickMacApps — Discover the Best Mac Apps" },
      {
        name: "description",
        content:
          "Explore a growing collection of beautiful, useful, and powerful Mac apps from developers around the world.",
      },
      { name: "theme-color", content: "#fbfbfc" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@400..700&family=Inter+Tight:wght@500..800&display=swap",
      },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
    scripts: [{ children: THEME_SCRIPT }],
  }),
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
