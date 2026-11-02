import { createFileRoute } from "@tanstack/react-router"

async function respond(request: Request) {
  const { handleIncoming } = await import("@/lib/md/handle")
  const served = await handleIncoming(request)
  return served ?? new Response("Not found\n", { status: 404 })
}

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => respond(request),
      HEAD: async ({ request }) => respond(request),
    },
  },
})
