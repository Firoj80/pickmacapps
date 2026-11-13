import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "node:crypto";

export const Route = createFileRoute("/api/upvote")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { appId?: string; visitorId?: string };
          const { appId, visitorId } = body || {};
          if (!appId || !visitorId) {
            return Response.json({ ok: false, error: "appId and visitorId required" }, { status: 400 });
          }

          // Hash the visitorId so raw ids are never stored
          const fingerprint = createHash("sha256").update(visitorId.trim()).digest("hex");

          const { submitAppUpvote } = await import("@/lib/directory.server");
          const result = await submitAppUpvote(appId, fingerprint);
          return Response.json(result);
        } catch {
          return Response.json({ ok: false, error: "Internal error" }, { status: 500 });
        }
      },
    },
  },
});
