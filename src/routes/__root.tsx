import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { Missing } from "@/components/missing";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buildMetadata, fetchSiteOrigin, originFrom } from "@/lib/seo";
import { fetchDirectory } from "@/lib/directory.fn";
import { pageCopy } from "@/lib/site";
import appCss from "../styles.css?url";

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
      origin = await fetchSiteOrigin();
    } catch {
      origin = "";
    }
    try {
      return { origin, directory: await fetchDirectory() };
    } catch {
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
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
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
        <PreviewHostBridge />
        <AuthProvider>
          <Frame />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
