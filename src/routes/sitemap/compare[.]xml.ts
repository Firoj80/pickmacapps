import { createFileRoute } from "@tanstack/react-router";
import { sitemapResponse } from "@/lib/sitemap";

function respond(request: Request) {
  return sitemapResponse("compare", new URL(request.url).origin);
}

export const Route = createFileRoute("/sitemap/compare.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => respond(request),
      HEAD: async ({ request }) => {
        const response = respond(request);
        return new Response(null, { status: response.status, headers: response.headers });
      },
    },
  },
});
