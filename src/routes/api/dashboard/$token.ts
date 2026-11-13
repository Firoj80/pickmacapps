import { createFileRoute } from "@tanstack/react-router";
import type { Pricing } from "@/lib/catalog";

export const Route = createFileRoute("/api/dashboard/$token")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const { token } = params;
          if (!token) return Response.json({ ok: false, error: "Token required" }, { status: 400 });

          const body = (await request.json()) as {
            tagline?: string;
            description?: string;
            demo?: string;
            pricing?: Pricing;
            category?: string;
            icon?: string;
          };

          const { updateAppByToken } = await import("@/lib/directory.server");
          const ok = await updateAppByToken(token, body);
          if (!ok) {
            return Response.json({ ok: false, error: "App not found or invalid token" }, { status: 404 });
          }

          return Response.json({ ok: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Internal error";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
