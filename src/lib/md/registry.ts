import {
  apps,
  appsInCategory,
  categories,
  editors,
  getApp,
  getCategory,
  getPost,
  posts,
  sortApps,
} from "@/lib/catalog"
import {
  comparePairs,
  hubIntro,
  hubTitle,
  pairHeading,
  pairIntro,
  relatedPairs,
} from "@/lib/compare"
import { abs, htmlToMarkdown, markdownPath, oneSentence, pageMarkdown } from "@/lib/md/format"
import { site } from "@/lib/site"

export type MarkdownGroup = "core" | "guides" | "categories" | "apps" | "legal" | "compare"

export type MarkdownRoute = {
  htmlPath: string
  mdPath: string
  title: string
  description: string
  group: MarkdownGroup
}

export type MarkdownPage = {
  title: string
  summary: string
  htmlPath: string
  updated?: string
  markdown: string
}

/** Machine files. Not content pages, so they have no markdown renderer. */
export const markdownSkip = [
  { path: "/robots.txt", reason: "crawler policy" },
  { path: "/sitemap.xml", reason: "url list; markdown alternates stay out of it" },
  { path: "/llms.txt", reason: "agent index" },
  { path: "/llms-full.txt", reason: "agent corpus" },
  { path: "/ai.txt", reason: "usage policy" },
] as const

const usedCategories = () => categories.filter((category) => appsInCategory(category.slug).length > 0)

function linkList(items: { label: string; href: string; note?: string }[]) {
  return items
    .map((item) => `- [${item.label}](${item.href})${item.note ? ` - ${item.note}` : ""}`)
    .join("\n")
}

function appNote(app: (typeof apps)[number]) {
  const choice = editors.has(app.slug) ? " Editor’s Choice." : ""
  return `${app.tagline}${choice}`
}

function renderHome(origin: string): MarkdownPage {
  const ordered = [...sortApps(apps, "newest")].sort(
    (a, b) => Number(editors.has(b.slug)) - Number(editors.has(a.slug)),
  )
  const body = [
    "Listings link to the developer. Editor’s Choice listings are labeled Editor’s Choice.",
    "",
    "## Categories",
    linkList(
      usedCategories().map((category) => ({
        label: category.name,
        href: abs(origin, `/category/${category.slug}`),
        note: category.paragraphs[0],
      })),
    ),
    "",
    "## Guides",
    linkList(
      posts.map((post) => ({
        label: post.title,
        href: abs(origin, `/blog/${post.slug}`),
        note: post.excerpt,
      })),
    ),
    "",
    "## Apps",
    linkList(
      ordered.map((app) => ({
        label: app.name,
        href: abs(origin, `/app/${app.slug}`),
        note: appNote(app),
      })),
    ),
  ].join("\n")
  return finish(origin, {
    title: "PickMacApps",
    summary: site.description,
    htmlPath: "/",
    updated: posts[0]?.date,
    body,
    related: [
      { label: "Guides", href: abs(origin, "/blog") },
      { label: "Submit an app", href: abs(origin, "/submit") },
      { label: "Privacy", href: abs(origin, "/privacy") },
    ],
  })
}

function renderBlogIndex(origin: string): MarkdownPage {
  return finish(origin, {
    title: "Guides",
    summary: "Hand-researched guides to the best Mac apps.",
    htmlPath: "/blog",
    updated: posts[0]?.date,
    body: linkList(
      posts.map((post) => ({
        label: post.title,
        href: abs(origin, `/blog/${post.slug}`),
        note: `${post.date} · ${post.minutes} min. ${post.excerpt}`,
      })),
    ),
    related: [{ label: "Home", href: abs(origin, "/") }],
  })
}

function renderPost(origin: string, slug: string): MarkdownPage | null {
  const post = getPost(slug)
  if (!post) return null
  const haystack = `${post.title} ${post.excerpt} ${post.html}`.toLowerCase()
  const mentioned = apps.filter((app) => haystack.includes(app.name.toLowerCase())).slice(0, 8)
  const more = post.more
    .map((item) => posts.find((entry) => entry.slug === item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  const body = [
    `Published: ${post.date}`,
    `Read: ${post.minutes} min`,
    post.tags.length ? `Tags: ${post.tags.join(", ")}` : "",
    "",
    htmlToMarkdown(post.html, origin),
    mentioned.length ? `\n\n## From the directory\n${linkList(mentioned.map((app) => ({ label: app.name, href: abs(origin, `/app/${app.slug}`) })))}` : "",
    more.length
      ? `\n\n## Keep reading\n${linkList(more.map((item) => ({ label: item.title, href: abs(origin, `/blog/${item.slug}`), note: item.excerpt })))}`
      : "",
  ]
    .filter(Boolean)
    .join("\n")
  return finish(origin, {
    title: post.title,
    summary: post.excerpt,
    htmlPath: `/blog/${post.slug}`,
    updated: post.date,
    body,
    related: [{ label: "All guides", href: abs(origin, "/blog") }],
  })
}

function renderApp(origin: string, slug: string): MarkdownPage | null {
  const app = getApp(slug)
  if (!app) return null
  const choice = editors.has(app.slug)
  const related = app.related
    .map((item) => getApp(item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  const lines = [
    app.demo ? `![${app.name}](${abs(origin, app.demo)})` : "",
    "",
    `- Price model: ${app.pricing === "free" ? "Free" : app.pricing === "paid" ? "Paid" : "Freemium"}`,
    `- Category: [${app.categoryName}](${abs(origin, `/category/${app.category}`)})`,
    choice ? "- Editor’s Choice" : "",
    `- Added: ${app.createdAt.slice(0, 10)}`,
    "",
    app.description.trim(),
    "",
    `[Visit website](${app.website})`,
  ].filter((line) => line !== "")
  const tagline = app.tagline.trim()
  const joiner = /[.!?]$/.test(tagline) ? " " : ". "
  return finish(origin, {
    title: app.name,
    summary: `${app.name}: ${tagline}${joiner}${app.description}`,
    htmlPath: `/app/${app.slug}`,
    updated: app.createdAt.slice(0, 10),
    body: lines.join("\n"),
    related: [
      { label: app.categoryName, href: abs(origin, `/category/${app.category}`) },
      ...related.map((item) => ({ label: item.name, href: abs(origin, `/app/${item.slug}`) })),
    ],
  })
}

function renderCategory(origin: string, slug: string): MarkdownPage | null {
  const category = getCategory(slug)
  const listed = appsInCategory(slug)
  if (!category || listed.length === 0) return null
  const body = [
    ...category.paragraphs,
    "",
    "## What to look for",
    category.tips.map((tip) => `- ${tip}`).join("\n"),
    "",
    `## ${listed.length} ${category.name.toLowerCase()} apps`,
    linkList(
      listed.map((app) => ({
        label: app.name,
        href: abs(origin, `/app/${app.slug}`),
        note: appNote(app),
      })),
    ),
  ].join("\n")
  return finish(origin, {
    title: `${category.name} Mac Apps`,
    summary: category.paragraphs[0] ?? `${category.name} apps for Mac.`,
    htmlPath: `/category/${category.slug}`,
    body,
    related: [{ label: "All apps", href: abs(origin, "/") }],
  })
}

function renderSubmit(origin: string): MarkdownPage {
  const body = [
    "Listings are reviewed by hand. Nothing goes live from the form alone.",
    "",
    "## Free listing",
    "Free, after review. The form asks for the same details as a listing: name, website, tagline, description, icon, category, the app’s own price model, and an email.",
    "",
    "- Add the PickMacApps badge on the app’s site, then the listing is reviewed.",
    "- The link from the listing back to the app is nofollow.",
    "- No visitor count is promised.",
    "",
    "## Editor’s Choice",
    "Editor’s Choice is a one-time payment. The current price is on the submit page. Those listings are labeled Editor’s Choice.",
    "",
    "- No badge is required.",
    "- Editor’s Choice label on the directory.",
    "- A follow link from the listing to the app’s site.",
    "",
    "## Checklist",
    "- Your app is functional",
    "- It delivers what it promises",
    "- Is not an infoproduct",
    "",
    "A free listing needs the badge on the app’s site before the form can be sent. An Editor’s Choice listing does not. Email is used only to reply about the submission.",
  ].join("\n")
  return finish(origin, {
    title: "Submit your Mac app",
    summary: "Submit your Mac app to the PickMacApps directory. Editor’s Choice is labeled on the listing.",
    htmlPath: "/submit",
    body,
    related: [{ label: "Privacy", href: abs(origin, "/privacy") }],
  })
}

function renderPrivacy(origin: string): MarkdownPage {
  const body = [
    "The submit form asks for an app name, website, tagline, description, icon, category, price model, and email so a listing can be reviewed. That information is used only to reply about the submission. It is not sold.",
    "",
    "The site does not ask you to create an account. Theme preference is stored in this browser. Fonts are loaded from Google Fonts, which means your browser requests them from Google.",
    "",
    "Editor’s Choice listings are labeled Editor’s Choice. This page describes the site’s own practices. It is not legal advice.",
  ].join("\n")
  return finish(origin, {
    title: "Privacy",
    summary: "What the PickMacApps submit form collects, and what it does not.",
    htmlPath: "/privacy",
    body,
    related: [{ label: "Submit an app", href: abs(origin, "/submit") }],
  })
}

function renderAbout(origin: string): MarkdownPage {
  const body = [
    "Firoj Alam is an indie hacker and Mac and iOS app developer who curates Mac apps on PickMacApps.",
    "",
    "## Mission",
    "PickMacApps is built to help macOS users discover native, fast, and respectful Mac utilities without subscription fatigue, bloated Electron wrappers, or hidden telemetry.",
    "",
    "## Author & Curator",
    "- Name: Firoj Alam",
    "- Role: Indie Developer & Curator",
    "- Contact: firojalama80@gmail.com",
    "",
    "## Principles",
    "- Native performance and memory footprint audited on physical Apple Silicon hardware",
    "- Zero affiliate links or third-party ad networks",
    "- Transparent pricing models: Free, Freemium, or Lifetime Paid Once",
  ].join("\n")
  return finish(origin, {
    title: "About PickMacApps & Firoj Alam",
    summary: "Indie hacker and Mac and iOS app developer who curates Mac apps on PickMacApps.",
    htmlPath: "/about",
    body,
    related: [
      { label: "Home", href: abs(origin, "/") },
      { label: "How we pick", href: abs(origin, "/how-we-pick") },
    ],
  })
}

function renderHowWePick(origin: string): MarkdownPage {
  const body = [
    "Our testing criteria, conflict of interest policy, and review methodology for recommending Mac software.",
    "",
    "## The 5-Pillar Evaluation Framework",
    "1. **Performance & Memory**: Low idle RAM, zero background wakeups, native Swift/AppKit over Electron.",
    "2. **Privacy & Security**: Minimal permissions, zero tracking, strict adherence to macOS Gatekeeper.",
    "3. **Transparent Pricing**: Honest free tiers and one-time purchases over recurring subscriptions.",
    "4. **macOS Ergonomics**: Thoughtful notch integration, respectful menu bar usage, and native UI.",
    "5. **Active Maintenance**: Regular updates and compatibility with macOS Sonoma, Sequoia, and Apple Silicon.",
    "",
    "## Commercial Transparency",
    "- Zero affiliate links or advertising trackers.",
    "- Free listings for quality indie software.",
    "- Editor's Choice is capped at 3 active spots and requires passing all editorial tests.",
  ].join("\n")
  return finish(origin, {
    title: "How We Pick Mac Apps — Editorial Policy",
    summary: "Our testing criteria, conflict of interest policy, and review methodology for recommending Mac software.",
    htmlPath: "/how-we-pick",
    body,
    related: [
      { label: "Home", href: abs(origin, "/") },
      { label: "About the curator", href: abs(origin, "/about") },
    ],
  })
}

function finish(
  origin: string,
  input: {
    title: string
    summary: string
    htmlPath: string
    updated?: string
    body: string
    related?: { label: string; href: string }[]
  },
): MarkdownPage {
  const summary = oneSentence(input.summary)
  return {
    title: input.title,
    summary,
    htmlPath: input.htmlPath,
    updated: input.updated,
    markdown: pageMarkdown({
      title: input.title,
      summary,
      canonical: abs(origin, input.htmlPath),
      updated: input.updated,
      body: input.body,
      related: input.related,
    }),
  }
}

function renderCompareHub(origin: string): MarkdownPage {
  const pairs = comparePairs()
  return finish(origin, {
    title: hubTitle(pairs.length),
    summary: hubIntro(pairs),
    htmlPath: "/compare",
    body: linkList(
      pairs.map((pair) => ({
        label: pairHeading(pair),
        href: abs(origin, `/compare/${pair.slug}`),
        note: `${pair.left.name} is ${pair.left.pricing}. ${pair.right.name} is ${pair.right.pricing}.`,
      })),
    ),
    related: [{ label: "Home", href: abs(origin, "/") }],
  })
}

function renderCompare(origin: string, slug: string): MarkdownPage | null {
  const pair = comparePairs().find((item) => item.slug === slug)
  if (!pair) return null
  const body = [
    pairIntro(pair),
    "",
    `- [${pair.left.name}](${abs(origin, `/app/${pair.left.slug}`)}) — ${pair.left.tagline}`,
    `- [${pair.right.name}](${abs(origin, `/app/${pair.right.slug}`)}) — ${pair.right.tagline}`,
    "",
    pair.guides
      .map((guide) => `- Guide: [${guide.title}](${abs(origin, `/blog/${guide.slug}`)})`)
      .join("\n"),
  ].join("\n")
  return finish(origin, {
    title: pairHeading(pair),
    summary: pairIntro(pair),
    htmlPath: `/compare/${pair.slug}`,
    updated: (pair.guides[0]?.date ?? pair.left.createdAt).slice(0, 10),
    body,
    related: relatedPairs(pair).map((item) => ({
      label: pairHeading(item),
      href: abs(origin, `/compare/${item.slug}`),
    })),
  })
}

const staticRenderers: Record<string, (origin: string) => MarkdownPage> = {
  "/": renderHome,
  "/blog": renderBlogIndex,
  "/about": renderAbout,
  "/how-we-pick": renderHowWePick,
  "/submit": renderSubmit,
  "/privacy": renderPrivacy,
  "/compare": renderCompareHub,
}

export function renderMarkdown(origin: string, htmlPath: string): MarkdownPage | null {
  const path = htmlPath.length > 1 ? htmlPath.replace(/\/$/, "") : htmlPath
  const fixed = staticRenderers[path]
  if (fixed) return fixed(origin)
  const app = /^\/app\/([^/]+)$/.exec(path)
  if (app) return renderApp(origin, decodeURIComponent(app[1]))
  const post = /^\/blog\/([^/]+)$/.exec(path)
  if (post) return renderPost(origin, decodeURIComponent(post[1]))
  const category = /^\/category\/([^/]+)$/.exec(path)
  if (category) return renderCategory(origin, decodeURIComponent(category[1]))
  const compare = /^\/compare\/([^/]+)$/.exec(path)
  if (compare) return renderCompare(origin, decodeURIComponent(compare[1]))
  return null
}

export function contentPathFromMarkdown(pathname: string) {
  if (pathname === "/index.md") return "/"
  if (!pathname.endsWith(".md")) return null
  const stripped = pathname.slice(0, -3)
  if (!stripped.startsWith("/")) return null
  return stripped || "/"
}

export function isContentPath(pathname: string) {
  if (staticRenderers[pathname]) return true
  if (/^\/(?:app|blog|category)\/[^/]+$/.test(pathname)) return true
  if (pathname === "/compare") return true
  const compare = /^\/compare\/([^/]+)$/.exec(pathname)
  return Boolean(compare && comparePairs().some((pair) => pair.slug === decodeURIComponent(compare[1])))
}

export function listMarkdownRoutes(): MarkdownRoute[] {
  const core: MarkdownRoute[] = [
    { htmlPath: "/", mdPath: "/index.md", title: "Home", description: site.description, group: "core" },
    {
      htmlPath: "/blog",
      mdPath: "/blog.md",
      title: "Guides",
      description: "Hand-researched guides to the best Mac apps.",
      group: "core",
    },
    {
      htmlPath: "/about",
      mdPath: "/about.md",
      title: "About",
      description: "Indie hacker and Mac and iOS app developer who curates Mac apps on PickMacApps.",
      group: "core",
    },
    {
      htmlPath: "/how-we-pick",
      mdPath: "/how-we-pick.md",
      title: "How we pick",
      description: "Our testing criteria, conflict of interest policy, and review methodology for recommending Mac software.",
      group: "core",
    },
    {
      htmlPath: "/submit",
      mdPath: "/submit.md",
      title: "Submit an app",
      description: "Send a Mac app for review. Editor’s Choice is labeled on the listing and costs $99, marked down from $199.",
      group: "core",
    },
  ]
  const guides: MarkdownRoute[] = posts.map((post) => ({
    htmlPath: `/blog/${post.slug}`,
    mdPath: markdownPath(`/blog/${post.slug}`),
    title: post.title,
    description: post.excerpt,
    group: "guides",
  }))
  const categoryRoutes: MarkdownRoute[] = usedCategories().map((category) => ({
    htmlPath: `/category/${category.slug}`,
    mdPath: markdownPath(`/category/${category.slug}`),
    title: `${category.name} Mac Apps`,
    description: category.paragraphs[0] ?? category.name,
    group: "categories",
  }))
  const appRoutes: MarkdownRoute[] = [...sortApps(apps, "newest")]
    .sort((a, b) => Number(editors.has(b.slug)) - Number(editors.has(a.slug)))
    .map((app) => ({
      htmlPath: `/app/${app.slug}`,
      mdPath: markdownPath(`/app/${app.slug}`),
      title: app.name,
      description: appNote(app),
      group: "apps",
    }))
  const comparisons: MarkdownRoute[] = [
    {
      htmlPath: "/compare",
      mdPath: "/compare.md",
      title: hubTitle(),
      description: hubIntro(),
      group: "compare",
    },
    ...comparePairs().map((pair) => ({
      htmlPath: `/compare/${pair.slug}`,
      mdPath: markdownPath(`/compare/${pair.slug}`),
      title: pairHeading(pair),
      description: pairIntro(pair),
      group: "compare" as const,
    })),
  ]
  const legal: MarkdownRoute[] = [
    {
      htmlPath: "/privacy",
      mdPath: "/privacy.md",
      title: "Privacy",
      description: "What the submit form collects, and what it does not.",
      group: "legal",
    },
  ]
  return [...core, ...guides, ...categoryRoutes, ...appRoutes, ...comparisons, ...legal]
}
