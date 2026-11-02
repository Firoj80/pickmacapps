import { aiText, catalogJson, llmsFullText, llmsText, robotsText } from "@/lib/md/documents"
import { indexNowKey } from "@/lib/indexnow"
import { abs } from "@/lib/md/format"
import { markdownHttp, optionsHttp, prefersMarkdown, textHttp } from "@/lib/md/http"
import { contentPathFromMarkdown, isContentPath, renderMarkdown, runWithDirectory } from "@/lib/md/registry"

const SKIP_PREFIXES = ["/_next/", "/.well-known/", "/__grok/"]

function originOf(request: Request) {
  return new URL(request.url).origin
}

export function describedBy(origin: string) {
  return ["/llms.txt", "/llms-full.txt", "/ai.txt"]
    .map((path) => `<${abs(origin, path)}>; rel="describedby"`)
    .join(", ")
}

function notFound(origin: string, htmlPath: string, method: string) {
  const canonical = abs(origin, htmlPath)
  const body = `# Page not found\n\n> That page isn't part of the directory.\n\nCanonical: ${canonical}\n\nThat page isn't part of the directory.\n`
  return markdownHttp({ status: 404, body, canonical, method })
}

function servePage(origin: string, htmlPath: string, method: string, negotiated: boolean) {
  const page = renderMarkdown(origin, htmlPath)
  if (!page) return notFound(origin, htmlPath, method)
  return markdownHttp({
    body: page.markdown,
    canonical: abs(origin, page.htmlPath),
    updated: page.updated,
    negotiated,
    method,
  })
}

function plain(pathname: string, origin: string, method: string) {
  if (pathname === "/llms.txt") return textHttp(llmsText(origin), "text/plain; charset=utf-8", "public, s-maxage=86400, stale-while-revalidate=604800", method)
  if (pathname === "/llms-full.txt") {
    return textHttp(llmsFullText(origin), "text/plain; charset=utf-8", "public, s-maxage=86400, stale-while-revalidate=604800", method)
  }
  if (pathname === "/ai.txt") return textHttp(aiText(origin), "text/plain; charset=utf-8", "public, s-maxage=86400, stale-while-revalidate=604800", method)
  if (pathname === "/robots.txt") return textHttp(robotsText(origin), "text/plain; charset=utf-8", "public, s-maxage=3600, stale-while-revalidate=86400", method)
  return null
}

function apiMarkdown(pathname: string, origin: string, method: string) {
  if (pathname === "/api/md" || pathname === "/api/md/" || pathname === "/api/md/index") {
    return servePage(origin, "/", method, false)
  }
  if (pathname === "/api/md/_catalog") {
    const body = catalogJson(origin)
    const headers = new Headers()
    headers.set("Content-Type", "application/json; charset=utf-8")
    headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
    headers.set("Access-Control-Allow-Origin", "*")
    return new Response(method === "HEAD" ? null : body, { status: 200, headers })
  }
  const rest = pathname.slice("/api/md".length)
  const htmlPath = rest === "" ? "/" : rest
  return servePage(origin, htmlPath, method, false)
}

/**
 * Markdown, llms, and ai responses. Returns null when the HTML app should answer.
 * .md and Accept negotiation only run for known content paths, plus a markdown 404
 * when the URL itself ends in .md and is not a machine file.
 */
export function handleIncoming(request: Request): Promise<Response | null> {
  return withPublishedDirectory(() => handleIncomingSync(request))
}

async function withPublishedDirectory<T>(fn: () => T): Promise<T> {
  try {
    const { publishedDirectory } = await import("@/lib/directory.server")
    const directory = await publishedDirectory()
    return runWithDirectory({ apps: directory.apps, posts: directory.posts }, fn)
  } catch (error) {
    console.error("[directory] markdown used the bundled catalog", error)
    return fn()
  }
}

function handleIncomingSync(request: Request): Response | null {
  const url = new URL(request.url)
  const pathname = decodeURIComponent(url.pathname)
  const method = request.method.toUpperCase()
  const origin = originOf(request)

  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null
  if (pathname === "/sitemap.xml" || pathname.startsWith("/sitemap/")) return null

  const key = indexNowKey()
  if (key && pathname === `/${key}.txt` && (method === "GET" || method === "HEAD")) {
    return textHttp(`${key}\n`, "text/plain; charset=utf-8", "public, max-age=3600", method)
  }

  const machine = pathname === "/llms.txt" || pathname === "/llms-full.txt" || pathname === "/ai.txt" || pathname === "/robots.txt"
  const api = pathname === "/api/md" || pathname.startsWith("/api/md/")
  const dotMd = pathname.endsWith(".md") && !machine

  if (method === "OPTIONS" && (machine || api || dotMd || isContentPath(pathname))) return optionsHttp()
  if (method !== "GET" && method !== "HEAD") return null

  const text = plain(pathname, origin, method)
  if (text) return text
  if (api) return apiMarkdown(pathname, origin, method)

  if (dotMd) {
    const htmlPath = contentPathFromMarkdown(pathname)
    if (!htmlPath || !isContentPath(htmlPath)) return notFound(origin, htmlPath || "/", method)
    return servePage(origin, htmlPath, method, false)
  }

  if (isContentPath(pathname) && prefersMarkdown(request.headers.get("accept"))) {
    return servePage(origin, pathname, method, true)
  }
  return null
}
