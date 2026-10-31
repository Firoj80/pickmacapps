import assert from "node:assert/strict"
import { test } from "node:test"
import { appsInCategory, getApp, getCategory, getPost, posts, shelfApps } from "./catalog.ts"
import {
  appGraph,
  categoryGraph,
  crumbGraph,
  guideGraph,
  guidesGraph,
  homeGraph,
  serializeJsonLd,
} from "./jsonld.ts"

const origin = "https://pickmacapps.test"

function parse(data: object | null) {
  assert.ok(data)
  const text = serializeJsonLd(data)
  assert.equal(text.includes("</"), false)
  const json = JSON.parse(text) as {
    "@context": string
    "@graph": Array<Record<string, unknown>>
  }
  assert.equal(json["@context"], "https://schema.org")
  walk(json)
  return json
}

function walk(value: unknown) {
  assert.notEqual(value, undefined)
  assert.notEqual(value, null)
  if (Array.isArray(value)) {
    for (const item of value) walk(item)
    return
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      walk(item)
      if (["@id", "url", "item", "logo", "mainEntityOfPage"].includes(key) && typeof item === "string") {
        assert.match(item, /^https:\/\//, key)
      }
      if (key === "image" && typeof item === "string") assert.match(item, /^https:\/\//)
      if (key === "image" && Array.isArray(item)) {
        for (const image of item) assert.match(String(image), /^https:\/\//)
      }
    }
  }
}

function types(json: { "@graph": Array<Record<string, unknown>> }) {
  return json["@graph"].map((node) => node["@type"])
}

function node(json: { "@graph": Array<Record<string, unknown>> }, type: string) {
  const found = json["@graph"].find((item) => item["@type"] === type)
  assert.ok(found, type)
  return found
}

test("each public page type builds a self-contained graph", () => {
  const home = parse(homeGraph(origin, shelfApps()))
  assert.deepEqual(types(home), ["Organization", "WebSite", "BreadcrumbList", "CollectionPage", "ItemList"])
  const website = node(home, "WebSite")
  assert.equal((website.potentialAction as { "@type": string })["@type"], "SearchAction")
  assert.equal((node(home, "Organization") as { name: string }).name, "PickMacApps")
  const homeList = node(home, "ItemList")
  assert.equal(homeList.numberOfItems, shelfApps().length)

  const free = getApp("better-shot")
  assert.ok(free)
  const freeJson = parse(appGraph(origin, free))
  const freeApp = node(freeJson, "SoftwareApplication")
  assert.equal(freeApp.operatingSystem, "macOS")
  assert.equal((freeApp.offers as { price: number; priceCurrency: string }).price, 0)
  assert.equal((freeApp.offers as { priceCurrency: string }).priceCurrency, "USD")
  assert.equal(JSON.stringify(freeJson).includes("aggregateRating"), false)

  const paid = getApp("screen-charm")
  assert.ok(paid)
  const paidJson = parse(appGraph(origin, paid))
  const paidApp = node(paidJson, "SoftwareApplication")
  assert.equal(paidApp.offers, undefined)
  assert.equal(JSON.stringify(paidApp.image).includes(".mp4"), false)

  const post = getPost("best-paste-alternative-mac")
  assert.ok(post)
  const guide = parse(guideGraph(origin, post))
  const article = node(guide, "BlogPosting")
  assert.equal(article.headline, post.title)
  assert.equal(article.datePublished, post.date)
  assert.equal(article.dateModified, undefined)
  assert.equal((article.author as { "@id": string })["@id"], `${origin}/#organization`)
  const crumbs = node(guide, "BreadcrumbList").itemListElement as Array<{ name: string }>
  assert.deepEqual(crumbs.map((crumb) => crumb.name), ["Home", "Blog", post.title])

  const guides = parse(guidesGraph(origin, posts))
  assert.equal(node(guides, "ItemList").numberOfItems, posts.length)
  assert.equal(node(guides, "WebSite").potentialAction, undefined)

  const category = getCategory("utilities")
  assert.ok(category)
  const listed = appsInCategory(category.slug)
  const categoryJson = parse(categoryGraph(origin, category, listed))
  assert.equal(node(categoryJson, "ItemList").numberOfItems, listed.length)
  assert.equal(node(categoryJson, "CollectionPage").name, "Utilities Mac Apps")

  const submit = parse(crumbGraph(origin, "/submit", "Submit your Mac app"))
  assert.deepEqual(types(submit), ["BreadcrumbList"])
  assert.equal(homeGraph("", shelfApps()), null)
})
