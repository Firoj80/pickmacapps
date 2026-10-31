export function oneSentence(text: string, fallback = "Mac apps worth installing.") {
  const clean = text.replace(/\s+/g, " ").trim()
  if (!clean) return fallback
  if (clean.length <= 155) return clean
  const cut = clean.slice(0, 152)
  const space = cut.lastIndexOf(" ")
  return `${(space > 80 ? cut.slice(0, space) : cut).replace(/[.,;:]+$/, "").trim()}…`
}

export function abs(origin: string, pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`
  return origin ? `${origin}${path}` : path
}

export function markdownPath(htmlPath: string) {
  if (htmlPath === "/") return "/index.md"
  return `${htmlPath.replace(/\/$/, "")}.md`
}

export function pageMarkdown(input: {
  title: string
  summary: string
  canonical: string
  updated?: string
  body: string
  related?: { label: string; href: string }[]
}) {
  const related = input.related?.length
    ? `\n\n## Related\n${input.related.map((item) => `- [${item.label}](${item.href})`).join("\n")}`
    : ""
  const updated = input.updated ? `\nLast updated: ${input.updated}` : ""
  return `# ${input.title}\n\n> ${input.summary.replace(/\s+/g, " ").trim()}\n\nCanonical: ${input.canonical}${updated}\n\n${input.body.trim()}${related}\n`
}

const entities: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
}

export function decodeHtml(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+);/gi, (all, name: string) => entities[name.toLowerCase()] ?? all)
}

function inline(html: string, origin: string) {
  const linked = html.replace(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, text: string) => {
    const label = decodeHtml(text.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim()
    return `[${label}](${abs(origin, decodeHtml(href))})`
  })
  return decodeHtml(linked.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
}

function tableToMd(table: string, origin: string) {
  const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((cell) =>
      inline(cell[1], origin).replace(/\|/g, "\\|"),
    ),
  )
  if (!rows.length) return ""
  const width = Math.max(...rows.map((row) => row.length))
  const norm = rows.map((row) => Array.from({ length: width }, (_, i) => row[i] ?? ""))
  const [head, ...body] = norm
  const line = (row: string[]) => `| ${row.join(" | ")} |`
  return `\n\n${line(head)}\n| ${head.map(() => "---").join(" | ")} |\n${body.map(line).join("\n")}\n\n`
}

function listToMd(list: string, origin: string) {
  const items = [...list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((item) => `- ${inline(item[1], origin)}`)
  return items.length ? `\n\n${items.join("\n")}\n\n` : ""
}

/** Turn the guide HTML stored in the catalog into markdown. Not a page scrape. */
export function htmlToMarkdown(html: string, origin: string) {
  let source = html
  source = source.replace(/<table[\s\S]*?<\/table>/gi, (table) => tableToMd(table, origin))
  source = source.replace(/<[uo]l[\s\S]*?<\/[uo]l>/gi, (list) => listToMd(list, origin))
  source = source.replace(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, text: string) => {
    const marks = level === "2" ? "##" : "###"
    return `\n\n${marks} ${inline(text, origin)}\n\n`
  })
  source = source.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text: string) => `\n\n${inline(text, origin)}\n\n`)
  source = source.replace(/<[^>]+>/g, "")
  return decodeHtml(source).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
}
