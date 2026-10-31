/** Dev-server twin of server/middleware/markdown.ts. Runs before TanStack Start. */
export function markdownPlugin() {
  return {
    name: "pickmacapps:markdown",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const method = (req.method ?? "GET").toUpperCase()
          if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
            next()
            return
          }
          const rawUrl = req.url ?? "/"
          const pathOnly = rawUrl.split("?", 1)[0] ?? "/"
          if (/\.(?:js|css|map|png|jpe?g|gif|svg|webp|ico|woff2?|mp4|webmanifest)$/i.test(pathOnly)) {
            next()
            return
          }
          const accept = String(req.headers.accept ?? "")
          const machine =
            pathOnly === "/llms.txt" ||
            pathOnly === "/llms-full.txt" ||
            pathOnly === "/ai.txt" ||
            pathOnly === "/robots.txt" ||
            pathOnly === "/api/md" ||
            pathOnly.startsWith("/api/md/") ||
            pathOnly.endsWith(".md")
          const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080")
          const proto = String(req.headers["x-forwarded-proto"] ?? "http")
          if (!machine && !accept.includes("text/markdown")) {
            if (method === "GET" || method === "HEAD") {
              res.setHeader(
                "Link",
                ["llms.txt", "llms-full.txt", "ai.txt"]
                  .map((name) => `<${proto}://${host}/${name}>; rel="describedby"`)
                  .join(", "),
              )
            }
            next()
            return
          }
          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue
            headers.set(key, Array.isArray(value) ? value.join(", ") : String(value))
          }
          const request = new Request(`${proto}://${host}${rawUrl}`, { method, headers })
          const mod = await server.ssrLoadModule("/src/lib/md/handle.ts")
          const response = mod.handleIncoming(request)
          if (response) {
            res.statusCode = response.status
            response.headers.forEach((value, key) => {
              res.setHeader(key, value)
            })
            if (method === "HEAD" || response.body === null) res.end()
            else res.end(Buffer.from(await response.arrayBuffer()))
            return
          }
          if (method === "GET" || method === "HEAD") {
            res.setHeader("Link", mod.describedBy(`${proto}://${host}`))
          }
          next()
        } catch (err) {
          console.error("[markdown] request failed:", err)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader("content-type", "text/plain; charset=utf-8")
            res.end("markdown handler failed")
          }
        }
      })
    },
  }
}
