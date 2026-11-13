import { createFileRoute } from "@tanstack/react-router";

async function run(request: Request) {
  const { adminSessionOk } = await import("@/lib/admin-auth.server");
  const secret = process.env.CRON_SECRET?.trim();
  const bearer = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (!bearer && !isVercelCron && !adminSessionOk(request.headers.get("cookie"))) {
    return new Response("Unauthorized\n", { status: 401 });
  }
  const { promoteEligibleUpvotedApps } = await import("@/lib/directory.server");
  const promotedCount = await promoteEligibleUpvotedApps();
  return Response.json({ ok: true, promotedCount });
}

export const Route = createFileRoute("/api/cron/upvote-promote")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});
