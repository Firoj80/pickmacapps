import assert from "node:assert/strict"
import { test } from "node:test"
import {
  comparePairs,
  hubTitle,
  pairIntro,
  pairTitle,
  relatedPairs,
  resolveCompareSlug,
} from "./compare.ts"
import { compareGraph, compareHubGraph, serializeJsonLd } from "./jsonld.ts"
import { buildMetadata } from "./seo.ts"
import { sectionUrls } from "./sitemap.ts"

const origin = "https://pickmacapps.test"

test("the comparison gate is the only source for pages, sitemap, and chips", () => {
  const pairs = comparePairs()
  assert.equal(pairs.length, 30)
  const slugs = pairs.map((pair) => pair.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  assert.equal(slugs.includes("better-shot-vs-boom"), true)
  assert.equal(slugs.includes("holdspeak-vs-precis"), true)
  assert.equal(slugs.includes("notchdodo-vs-tucket"), true)
  assert.equal(slugs.includes("better-shot-vs-shottr"), true)
  assert.equal(slugs.filter((slug) => slug.includes("anytype") && slug.includes("ia-writer")).length, 1)
  const counts = new Map<string, number>()
  for (const pair of pairs) {
    counts.set(pair.left.slug, (counts.get(pair.left.slug) ?? 0) + 1)
    counts.set(pair.right.slug, (counts.get(pair.right.slug) ?? 0) + 1)
  }
  for (const count of counts.values()) assert.ok(count <= 3)

  const canonical = resolveCompareSlug("tucket-vs-clippio")
  const flipped = resolveCompareSlug("clippio-vs-tucket")
  assert.equal(canonical.status === "ok" || flipped.status === "ok", true)
  const ok = canonical.status === "ok" ? canonical : flipped
  assert.equal(ok.status, "ok")
  if (ok.status !== "ok") return
  const alias = ok.pair.slug === "tucket-vs-clippio" ? "clippio-vs-tucket" : "tucket-vs-clippio"
  const reversed = resolveCompareSlug(alias)
  assert.equal(reversed.status, "redirect")
  if (reversed.status === "redirect") assert.equal(reversed.to, `/compare/${ok.pair.slug}`)

  const below = resolveCompareSlug("helumi-vs-macwhisper")
  assert.equal(below.status, "hub")
  assert.equal(resolveCompareSlug("better-shot-vs-screen-charm").status, "hub")
  assert.equal(resolveCompareSlug("not-a-pair").status, "missing")

  for (const pair of pairs) {
    assert.equal(pair.slug.includes("/"), false)
    assert.equal(pairIntro(pair).includes("2 Mac apps"), true)
    const meta = buildMetadata({
      title: pairTitle(pair),
      description: pairIntro(pair),
      path: `/compare/${pair.slug}`,
      origin,
    })
    assert.ok(meta.title.length <= 60, meta.title)
    assert.ok(meta.description.length >= 70 && meta.description.length <= 160, meta.description)
    for (const related of relatedPairs(pair)) {
      assert.equal(pairs.some((item) => item.slug === related.slug), true)
    }
    const json = JSON.parse(serializeJsonLd(compareGraph(origin, pair, []) ?? {}))
    assert.equal(JSON.stringify(json).includes("aggregateRating"), false)
  }

  const listed = sectionUrls("compare", origin, "2026-10-31").map((url) => url.loc)
  assert.deepEqual(
    listed,
    [`${origin}/compare`, ...pairs.map((pair) => `${origin}/compare/${pair.slug}`)],
  )
  assert.equal(hubTitle().startsWith(`${pairs.length} `), true)
  const hub = JSON.parse(serializeJsonLd(compareHubGraph(origin, pairs.map((pair) => ({ name: pair.left.name, slug: pair.slug })), []) ?? {}))
  assert.equal(JSON.stringify(hub).includes("aggregateRating"), false)
})
