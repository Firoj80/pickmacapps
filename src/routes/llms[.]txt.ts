import { createFileRoute } from "@tanstack/react-router";
import { apps, editors, posts } from "@/lib/catalog";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const link = (label: string, path: string, note: string) =>
          `- [${label}](${origin}${path}): ${note.replace(/\s+/g, " ").trim()}`;
        const picks = apps.filter((app) => editors.has(app.slug));
        const rest = apps.filter((app) => !editors.has(app.slug));
        const body = [
          "# PickMacApps",
          "",
          "> A curated shelf of Mac apps worth installing. Each guide compares one popular Mac app with the apps on this shelf, including when the popular app is still the better fit.",
          "",
          "## Guides",
          ...posts.map((post) => link(post.title, `/blog/${post.slug}`, post.excerpt)),
          "",
          "## Editor's Choice",
          ...picks.map((app) => link(app.name, `/app/${app.slug}`, `${app.tagline} Paid placement.`)),
          "",
          "## Apps",
          ...rest.map((app) => link(app.name, `/app/${app.slug}`, app.tagline)),
          "",
          "## Optional",
          link("Home", "/", "The full shelf of Mac apps."),
          link("Guides", "/blog", "Every guide on the site."),
          link("Submit an app", "/submit", "Send a Mac app for the shelf."),
          link("Privacy", "/privacy", "What the site stores."),
          "",
        ].join("\n");
        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
