import { createFileRoute } from "@tanstack/react-router"

async function respond(request: Request) {
  const { handleIncoming } = await import("@/lib/md/handle")
  const served = await handleIncoming(request)
  return (
    served ??
    new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } })
  )
}

export const Route = createFileRoute("/api/md/$")({
  server: {
    handlers: {
      GET: async ({ request }) => respond(request),
      HEAD: async ({ request }) => respond(request),
      OPTIONS: async ({ request }) => respond(request),
    },
  },
})
