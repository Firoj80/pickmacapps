export function prefersMarkdown(accept: string | null) {
  if (!accept) return false
  let markdown = -1
  let html = -1
  for (const part of accept.split(",")) {
    const [typeRaw, ...params] = part.trim().split(";").map((piece) => piece.trim())
    const type = typeRaw.toLowerCase()
    let q = 1
    for (const param of params) {
      const match = /^q=([0-9.]+)$/i.exec(param)
      if (match) q = Number(match[1])
    }
    if (Number.isNaN(q)) q = 1
    if (type === "text/markdown") markdown = Math.max(markdown, q)
    if (type === "text/html") html = Math.max(html, q)
  }
  if (markdown < 0) return false
  return markdown > (html < 0 ? 0 : html)
}

export function tokenCount(text: string) {
  return Math.max(1, Math.round(text.length / 4))
}

export function httpDate(isoDay: string) {
  const date = new Date(`${isoDay}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? undefined : date.toUTCString()
}

export function markdownHeaders(input: {
  canonical: string
  body: string
  updated?: string
  negotiated?: boolean
  cache?: string
}) {
  const headers = new Headers()
  headers.set("Content-Type", "text/markdown; charset=utf-8")
  headers.set("X-Markdown-Tokens", String(tokenCount(input.body)))
  headers.set("X-Robots-Tag", "noindex, follow")
  headers.set("Content-Location", input.canonical)
  headers.set("Link", `<${input.canonical}>; rel="canonical"`)
  headers.set(
    "Cache-Control",
    input.cache ?? "public, s-maxage=3600, stale-while-revalidate=86400",
  )
  if (input.negotiated) headers.set("Vary", "Accept")
  const modified = input.updated ? httpDate(input.updated) : undefined
  if (modified) headers.set("Last-Modified", modified)
  headers.set("Access-Control-Allow-Origin", "*")
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
  headers.set("Access-Control-Allow-Headers", "Accept")
  return headers
}

export function markdownHttp(input: {
  status?: number
  body: string
  canonical: string
  updated?: string
  negotiated?: boolean
  method?: string
}) {
  const headers = markdownHeaders(input)
  const head = input.method === "HEAD"
  return new Response(head ? null : input.body, { status: input.status ?? 200, headers })
}

export function textHttp(body: string, type: string, cache: string, method?: string) {
  const headers = new Headers()
  headers.set("Content-Type", type)
  headers.set("Cache-Control", cache)
  headers.set("Access-Control-Allow-Origin", "*")
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
  return new Response(method === "HEAD" ? null : body, { status: 200, headers })
}

export function optionsHttp() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Accept",
      "Access-Control-Max-Age": "86400",
    },
  })
}
