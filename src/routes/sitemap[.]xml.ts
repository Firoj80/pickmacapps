import { createFileRoute } from "@tanstack/react-router";
import { apps, categories, posts } from "@/lib/catalog";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const used = new Set(apps.map((app) => app.category));
        const paths = [
          "/",
          "/blog",
          "/submit",
          "/privacy",
          ...categories.filter((category) => used.has(category.slug)).map((category) => `/category/${category.slug}`),
          ...posts.map((post) => `/blog/${post.slug}`),
          ...apps.map((app) => `/app/${app.slug}`),
        ];
        const urls = paths
          .map((path) => `  <url><loc>${origin}${path}</loc></url>`)
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
