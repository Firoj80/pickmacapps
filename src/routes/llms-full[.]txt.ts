import { createFileRoute } from "@tanstack/react-router"

async function respond(request: Request) {
  const { handleIncoming } = await import("@/lib/md/handle")
  return handleIncoming(request) ?? new Response("Not found\n", { status: 404 })
}

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => respond(request),
      HEAD: async ({ request }) => respond(request),
      OPTIONS: async ({ request }) => respond(request),
    },
  },
})
