import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/$")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleAdminPost } = await import("@/lib/admin-post.server");
        return handleAdminPost(request);
      },
    },
  },
});
