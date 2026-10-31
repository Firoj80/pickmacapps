import { createFileRoute } from "@tanstack/react-router";

async function run(request: Request) {
  const { adminSessionOk } = await import("@/lib/admin-auth.server");
  const secret = process.env.CRON_SECRET?.trim();
  const bearer = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  if (!bearer && !adminSessionOk(request.headers.get("cookie"))) {
    return new Response("Unauthorized\n", { status: 401 });
  }
  const { runBadgeChecks } = await import("@/lib/directory.server");
  const results = await runBadgeChecks();
  return Response.json({ ok: true, checked: results.length, results });
}

export const Route = createFileRoute("/api/cron/badges")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});
