import { site } from "@/lib/site"
import { abs } from "@/lib/md/format"
import { listMarkdownRoutes, renderMarkdown, type MarkdownGroup, type MarkdownRoute } from "@/lib/md/registry"

const FULL_CHAR_LIMIT = 500_000
const APP_CAP = 50

const searchBots = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User"]
const trainingBots = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot", "Bytespider"]

function section(title: string, routes: MarkdownRoute[], origin: string) {
  if (!routes.length) return ""
  return [`## ${title}`, ...routes.map((route) => `- [${route.title}](${abs(origin, route.mdPath)}): ${oneLine(route.description)}`), ""].join("\n")
}

function oneLine(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function grouped(group: MarkdownGroup) {
  return listMarkdownRoutes().filter((route) => route.group === group)
}

export function llmsText(origin: string) {
  const apps = grouped("apps")
  const shown = apps.slice(0, APP_CAP)
  const hidden = apps.length - shown.length
  const appNote = hidden > 0 ? `\n\n${hidden} more apps are on the [full shelf](${abs(origin, "/index.md")}).` : ""
  return [
    `# ${site.name}`,
    "",
    `> ${site.description} Listings link to the developer. A guide says when the popular app is still the better fit.`,
    "",
    "The directory is for people choosing Mac software. A free listing is reviewed by hand. Editor’s Choice is a one-time $99 placement, marked down from $199, and the listing is labeled Editor’s Choice. There is no public contact email; the submit form is the contact.",
    "",
    "# keep in sync with /robots.txt and /ai.txt",
    "",
    section("Core pages", grouped("core"), origin),
    section("Guides", grouped("guides"), origin),
    section("Categories", grouped("categories"), origin),
    section("Apps", shown, origin).replace(/\n$/, "") + appNote,
    "",
    "## Machine-readable",
    `- [Full content](${abs(origin, "/llms-full.txt")}): every public page in one file`,
    `- [Markdown catalog](${abs(origin, "/api/md/_catalog")}): path, title, and markdown URL`,
    `- [Sitemap](${abs(origin, "/sitemap.xml")}): HTML URLs only`,
    `- [AI usage policy](${abs(origin, "/ai.txt")}): what an answer engine may do with these pages`,
    "",
    section("Optional", grouped("legal"), origin),
  ].join("\n")
}

export function llmsFullText(origin: string) {
  const routes = listMarkdownRoutes()
  const apps = routes.filter((route) => route.group === "apps")
  const shownApps = apps.slice(0, APP_CAP)
  const selected = [
    ...routes.filter((route) => route.group === "core"),
    ...routes.filter((route) => route.group === "guides"),
    ...routes.filter((route) => route.group === "categories"),
    ...shownApps,
    ...routes.filter((route) => route.group === "legal"),
  ]
  const parts = selected.map((route) => {
    const page = renderMarkdown(origin, route.htmlPath)
    const body = page?.markdown ?? `# ${route.title}\n\nMissing renderer for ${route.htmlPath}\n`
    return `---\n<!-- source: ${abs(origin, route.htmlPath)} -->\n${body.trim()}\n`
  })
  const omitted = apps.length - shownApps.length
  const note = omitted > 0 ? `\n${omitted} more apps are listed at ${abs(origin, "/index.md")}.\n` : ""
  const text = [
    `# ${site.name} - full content`,
    `> ${site.description}`,
    `Generated: ${site.policyUpdated}`,
    "",
    ...parts,
    note,
  ].join("\n")
  if (text.length > FULL_CHAR_LIMIT) {
    console.warn(`[llms-full] ${text.length} chars exceeds ${FULL_CHAR_LIMIT}`)
  }
  return text
}

export function aiText(origin: string) {
  const url = origin || ""
  return [
    "# ai.txt v1.1.1",
    "# keep in sync with /robots.txt and /llms.txt",
    "",
    "[identity]",
    `name: ${site.name}`,
    `url: ${url}`,
    `description: ${site.description}`,
    `contact: ${abs(origin, "/submit")}`,
    `logo: ${abs(origin, site.logoPath)}`,
    "",
    "[permissions]",
    "allowed: summarise",
    "allowed: quote with attribution",
    "allowed: cite",
    "allowed: index for search and answers",
    "",
    "[restrictions]",
    "disallow: fabricated quotes",
    "disallow: fake reviews or ratings",
    "disallow: presenting this site's content as the model's own",
    "disallow: training on private submission data",
    "",
    "[attribution]",
    `cite: ${site.name} and the canonical HTML URL of the page`,
    "",
    "[scope]",
    "include: /",
    "include: /app/",
    "include: /blog/",
    "include: /category/",
    "include: /submit",
    "include: /privacy",
    "include: /api/md/",
    "exclude: /api/auth",
    "exclude: /auth",
    "",
    "[contact]",
    `url: ${abs(origin, "/submit")}`,
    "note: no public email address",
    "",
    `Last updated: ${site.policyUpdated}`,
    "",
  ].join("\n")
}

function botBlock(name: string) {
  return [`User-agent: ${name}`, "Allow: /", "Disallow: /api/auth", "Disallow: /auth", "Disallow: /admin", "Disallow: /api/admin", "Disallow: /api/cron", ""].join("\n")
}

export function robotsText(origin: string) {
  return [
    "# keep in sync with /llms.txt and /ai.txt",
    `# ${abs(origin, "/llms.txt")}`,
    `# ${abs(origin, "/ai.txt")}`,
    "",
    ...searchBots.map(botBlock),
    ...trainingBots.map(botBlock),
    "User-agent: *",
    "Allow: /",
    "Allow: /api/md",
    "Disallow: /api/auth",
    "Disallow: /auth",
    "Disallow: /admin",
    "Disallow: /api/admin",
    "Disallow: /api/cron",
    "",
    `Sitemap: ${abs(origin, "/sitemap.xml")}`,
    "",
  ].join("\n")
}

export function catalogJson(origin: string) {
  return JSON.stringify({
    site: site.name,
    routes: listMarkdownRoutes().map((route) => ({
      path: route.htmlPath,
      markdown: abs(origin, route.mdPath),
      title: route.title,
      description: oneLine(route.description),
    })),
  })
}
