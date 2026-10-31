import assert from "node:assert/strict"
import { test } from "node:test"
import { apps, appsInCategory, categories, posts } from "./catalog.ts"
import { buildMetadata, fitDescription, fitTitle } from "./seo.ts"
import { pageCopy, site } from "./site.ts"

const origin = "https://pickmacapps.test"

function meta(tags: ReadonlyArray<{ title?: string; name?: string; content?: string; property?: string }>, key: string) {
  const named = tags.find((tag) => tag.name === key || tag.property === key)
  return named?.content
}

function check(label: string, result: ReturnType<typeof buildMetadata>, path: string) {
  assert.ok(result.title, `${label} title`)
  assert.ok(result.description, `${label} description`)
  assert.ok(result.title.length <= 60, `${label} title ${result.title.length}: ${result.title}`)
  assert.ok(!result.title.endsWith("...") && !result.title.endsWith("…"), `${label} title ellipsis`)
  assert.ok(
    result.description.length >= 70 && result.description.length <= 160,
    `${label} description ${result.description.length}: ${result.description}`,
  )
  const canonical = result.links[0]?.href ?? ""
  assert.equal(canonical, `${origin}${path}`, `${label} canonical ${canonical}`)
  assert.equal(canonical.includes("?"), false)
  assert.equal(meta(result.meta, "og:image"), `${origin}${site.ogImage}`)
  assert.equal(meta(result.meta, "og:url"), canonical)
  assert.equal(meta(result.meta, "twitter:card"), "summary_large_image")
  return result.description
}

test("static pages and every catalog record have unique metadata in range", () => {
  const descriptions = new Map<string, string>()
  const remember = (label: string, description: string) => {
    const previous = descriptions.get(description)
    assert.equal(previous, undefined, `${label} repeats ${previous}`)
    descriptions.set(description, label)
  }

  const pages = [
    ["home", site.title, site.description, "/"],
    ["guides", pageCopy.guides.title, pageCopy.guides.description, "/blog"],
    ["submit", pageCopy.submit.title, pageCopy.submit.description, "/submit"],
    ["privacy", pageCopy.privacy.title, pageCopy.privacy.description, "/privacy"],
  ] as const
  for (const [label, title, description, path] of pages) {
    remember(label, check(label, buildMetadata({ title, description, path, origin }), path))
  }

  for (const app of apps) {
    const tagline = app.tagline.trim()
    const joiner = /[.!?]$/.test(tagline) ? " " : ". "
    const result = buildMetadata({
      title: `${app.name} — ${tagline}`,
      description: `${app.name}: ${tagline}${joiner}${app.description}`,
      path: `/app/${app.slug}`,
      origin,
    })
    remember(app.slug, check(app.slug, result, `/app/${app.slug}`))
    if (result.title.length < `${app.name} — ${tagline}`.length) {
      assert.equal(`${app.name} — ${tagline}`.startsWith(result.title), true, app.slug)
    }
  }

  for (const post of posts) {
    const result = buildMetadata({
      title: post.title,
      description: post.excerpt,
      path: `/blog/${post.slug}`,
      origin,
      type: "article",
      publishedTime: post.date,
    })
    remember(post.slug, check(post.slug, result, `/blog/${post.slug}`))
    assert.equal(meta(result.meta, "og:type"), "article")
    assert.equal(meta(result.meta, "article:published_time"), post.date)
  }

  for (const category of categories) {
    if (appsInCategory(category.slug).length === 0) continue
    const result = buildMetadata({
      title: `${category.name} Mac Apps`,
      description: category.paragraphs[0] ?? "",
      path: `/category/${category.slug}`,
      origin,
    })
    remember(category.slug, check(category.slug, result, `/category/${category.slug}`))
  }
})

test("missing pages are noindex and filters do not change the canonical", () => {
  const missing = buildMetadata({
    title: pageCopy.notFound.title,
    description: pageCopy.notFound.description,
    path: "/missing",
    origin,
    noindex: true,
  })
  check("404", missing, "/missing")
  assert.equal(meta(missing.meta, "robots"), "noindex, follow")

  const filtered = buildMetadata({
    title: site.title,
    description: site.description,
    path: "/?q=mole&cat=utilities",
    origin,
  })
  assert.equal(filtered.links[0]?.href, `${origin}/`)
})

test("titles and descriptions are not cut mid-word", () => {
  const long = "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen"
  const title = fitTitle(long)
  assert.equal(title.endsWith(" "), false)
  assert.equal(long.startsWith(title), true)
  assert.ok(title.length <= 60)
  const description = fitDescription(`${long} ${long} ${long}`)
  assert.ok(description.length <= 160)
  assert.equal(description.endsWith("…"), false)
})
