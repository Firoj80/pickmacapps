import { describedBy, handleIncoming } from "../../src/lib/md/handle"

interface MarkdownEvent {
  url: URL
  req: { method: string; headers: Headers }
}

function isAsset(pathname: string) {
  return /\.(?:js|css|map|png|jpe?g|gif|svg|webp|ico|woff2?|mp4|webmanifest)$/i.test(pathname)
}

export default async function markdownMiddleware(
  event: MarkdownEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const request = new Request(event.url, { method: event.req.method, headers: event.req.headers })
  const served = await handleIncoming(request)
  if (served) return served

  const result = await next()
  if (isAsset(event.url.pathname) || !(result instanceof Response)) return result
  const headers = new Headers(result.headers)
  if (!headers.has("Link")) headers.set("Link", describedBy(event.url.origin))
  else headers.set("Link", `${headers.get("Link")}, ${describedBy(event.url.origin)}`)
  return new Response(result.body, { status: result.status, statusText: result.statusText, headers })
}
