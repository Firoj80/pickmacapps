import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { appId?: string; type?: "click" | "try" };
          const { appId, type } = body || {};
          if (!appId || (type !== "click" && type !== "try")) {
            return Response.json({ ok: false, error: "Invalid payload" }, { status: 400 });
          }
          const { recordAppClick } = await import("@/lib/directory.server");
          const ok = await recordAppClick(appId, type);
          return Response.json({ ok });
        } catch {
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
