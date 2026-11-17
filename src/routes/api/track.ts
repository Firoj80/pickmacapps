import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { appId?: string; slug?: string; type?: "click" | "try" };
          const { appId, slug, type } = body || {};
          const target = appId || slug;
          if (!target || (type !== "click" && type !== "try")) {
            return Response.json({ ok: false, error: "Invalid payload" }, { status: 400 });
          }
          const { recordAppClick } = await import("@/lib/directory.server");
          const result = await recordAppClick(target, type);
          return Response.json(result);
        } catch {
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
