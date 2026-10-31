import assert from "node:assert/strict"
import { test } from "node:test"
import { asLastmod, indexLocs, sectionUrls, SITEMAP_SECTIONS, SHARD, sitemapIndex, urlSet } from "./sitemap.ts"

const origin = "https://pickmacapps.test"
const today = "2026-10-31"

test("sitemap sections are absolute, unique, and dated only when we know", () => {
  const seen = new Set<string>()
  let total = 0
  for (const section of SITEMAP_SECTIONS) {
    const urls = sectionUrls(section, origin, today)
    assert.ok(urls.length > 0, section)
    assert.ok(urls.length < SHARD, section)
    const xml = urlSet(urls)
    assert.match(xml, /^<\?xml/)
    assert.equal(xml.includes("<changefreq>"), false)
    assert.equal(xml.includes("<priority>"), false)
    for (const url of urls) {
      assert.match(url.loc, /^https:\/\/pickmacapps\.test\//)
      assert.equal(url.loc.includes("?"), false)
      assert.equal(url.loc.endsWith(".md"), false)
      assert.equal(seen.has(url.loc), false, url.loc)
      seen.add(url.loc)
      if (url.lastmod) {
        assert.match(url.lastmod, /^\d{4}-\d{2}-\d{2}$/)
        assert.ok(url.lastmod <= today, url.lastmod)
      }
      total += 1
    }
  }
  assert.equal(sectionUrls("pages", origin, today).length, 4)
  assert.equal(sectionUrls("apps", origin, today).length, 24)
  assert.equal(sectionUrls("guides", origin, today).length, 9)
  assert.equal(sectionUrls("categories", origin, today).length, 4)
  assert.equal(total, 41)
  const index = sitemapIndex(indexLocs(origin, today))
  assert.match(index, /<sitemapindex/)
  assert.equal(index.split("<loc>").length - 1, 4)
  assert.equal(asLastmod("2099-01-01", today), undefined)
  assert.equal(asLastmod("not-a-date", today), undefined)
})
