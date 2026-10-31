import assert from "node:assert/strict"
import { test } from "node:test"
import { apps, appsInCategory, categories, getPost, posts } from "../catalog.ts"
import { htmlToMarkdown } from "./format.ts"
import { prefersMarkdown } from "./http.ts"
import { listMarkdownRoutes, markdownSkip, renderMarkdown } from "./registry.ts"

test("every public content route has a markdown renderer", () => {
  const paths = new Set(listMarkdownRoutes().map((route) => route.htmlPath))
  for (const path of ["/", "/blog", "/submit", "/privacy"]) assert.ok(paths.has(path), path)
  for (const app of apps) assert.ok(paths.has(`/app/${app.slug}`), app.slug)
  for (const post of posts) assert.ok(paths.has(`/blog/${post.slug}`), post.slug)
  for (const category of categories) {
    if (appsInCategory(category.slug).length === 0) continue
    assert.ok(paths.has(`/category/${category.slug}`), category.slug)
  }
  for (const route of listMarkdownRoutes()) {
    const page = renderMarkdown("https://pickmacapps.test", route.htmlPath)
    assert.ok(page, route.htmlPath)
    assert.match(page.markdown, /^# /)
    assert.match(page.markdown, new RegExp(`Canonical: https://pickmacapps.test${route.htmlPath === "/" ? "/" : route.htmlPath}`))
    assert.equal(page.markdown.includes("](/"), false)
  }
})

test("machine files are skipped instead of rendered as pages", () => {
  for (const item of markdownSkip) {
    assert.equal(renderMarkdown("https://pickmacapps.test", item.path), null, item.path)
  }
})

test("unknown apps, guides, and categories are not exposed", () => {
  assert.equal(renderMarkdown("https://pickmacapps.test", "/app/not-a-real-app"), null)
  assert.equal(renderMarkdown("https://pickmacapps.test", "/blog/not-a-real-guide"), null)
  assert.equal(renderMarkdown("https://pickmacapps.test", "/category/not-a-real-category"), null)
})

test("markdown wins accept only when its q is higher than html", () => {
  assert.equal(prefersMarkdown(null), false)
  assert.equal(prefersMarkdown("*/*"), false)
  assert.equal(prefersMarkdown("text/html, */*"), false)
  assert.equal(prefersMarkdown("text/markdown, text/html"), false)
  assert.equal(prefersMarkdown("text/markdown;q=0.4, text/html;q=0.8"), false)
  assert.equal(prefersMarkdown("text/markdown;q=0.9, text/html;q=0.2"), true)
  assert.equal(prefersMarkdown("text/markdown"), true)
})

test("guide html becomes markdown without inventing a price", () => {
  const post = getPost("best-paste-alternative-mac") ?? posts[0]
  const markdown = htmlToMarkdown(post.html, "https://pickmacapps.test")
  assert.match(markdown, /^An |^A |^The |^Paste|^[A-Z]/)
  assert.match(markdown, /## /)
  assert.equal(markdown.includes("<p"), false)
  assert.equal(markdown.includes("](/app/"), false)
})
