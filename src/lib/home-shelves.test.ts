import assert from "node:assert/strict"
import { test } from "node:test"
import { apps, getHeroAppIcons, homeGroups, isEditorChoice, shelfApps, sortApps, type AppItem } from "./catalog.ts"

test("editor's choice comes only from the saved flag", () => {
  const { choice, groups } = homeGroups(apps, "newest")
  const expected = apps.filter(isEditorChoice).map((app) => app.slug).sort()
  assert.deepEqual(expected, [])
  assert.deepEqual(
    choice.map((app) => app.slug).sort(),
    expected,
  )
  const grouped = groups.flatMap((group) => group.apps.map((app) => app.slug))
  assert.equal(grouped.includes("scanmydisk"), false)
  assert.equal(grouped.includes("helumi"), true)
  assert.equal(grouped.includes("macwhisper"), true)
  assert.equal(new Set(grouped).size, apps.length - expected.length)
  assert.equal(grouped.length + choice.length, apps.length)
})

test("new apps follow the original shelf, newest first", () => {
  const sample = apps[0]
  const newer = { ...sample, id: "brand-new", slug: "brand-new", name: "Brand New", editorChoice: false, createdAt: "2026-11-01" } as AppItem
  const older = { ...sample, id: "older-new", slug: "older-new", name: "Older New", editorChoice: false, createdAt: "2026-01-01" } as AppItem
  const slugs = shelfApps([...apps, newer, older], "", "all", "newest").map((app) => app.slug)
  const shelf = apps.map((app) => app.slug)
  assert.equal(slugs[0], shelf[0])
  assert.deepEqual(slugs.slice(0, shelf.length), shelf)
  assert.deepEqual(slugs.slice(-2), ["brand-new", "older-new"])
})

test("sortApps with oldest orders apps from oldest to newest", () => {
  const sample = apps[0]
  const older = { ...sample, id: "app-old", slug: "app-old", name: "Older App", createdAt: "2024-01-01" } as AppItem
  const newer = { ...sample, id: "app-new", slug: "app-new", name: "Newer App", createdAt: "2026-05-01" } as AppItem
  const sorted = sortApps([newer, older], "oldest")
  assert.deepEqual(sorted.map((a) => a.slug), ["app-old", "app-new"])
})

test("shelfApps orders featured and hot apps from oldest to newest", () => {
  const sample = apps[0]
  const oldHot = { ...sample, id: "hot-old", slug: "hot-old", name: "Old Hot", isHot: true, createdAt: "2024-01-01" } as AppItem
  const newHot = { ...sample, id: "hot-new", slug: "hot-new", name: "New Hot", isHot: true, createdAt: "2026-05-01" } as AppItem
  const standard = { ...sample, id: "standard-1", slug: "standard-1", name: "Standard", isHot: false, createdAt: "2025-01-01" } as AppItem

  const results = shelfApps([newHot, standard, oldHot], "", "all", "newest")
  const hotSlugs = results.filter((a) => a.isHot).map((a) => a.slug)
  assert.deepEqual(hotSlugs, ["hot-old", "hot-new"])
})

test("by default, user submitted apps are ordered oldest first (hardebell -> shedi -> photosy)", () => {
  const sample = apps[0]
  const hardebell = { ...sample, id: "hardebell", slug: "hardebell", name: "Hardebell", editorChoice: false, createdAt: "2026-11-01" } as AppItem
  const shedi = { ...sample, id: "shedi", slug: "shedi", name: "Shedi", editorChoice: false, createdAt: "2026-11-02" } as AppItem
  const photosy = { ...sample, id: "photosy", slug: "photosy", name: "Photosy", editorChoice: false, createdAt: "2026-11-03" } as AppItem

  const results = shelfApps([...apps, photosy, hardebell, shedi], "", "all")
  const userAppSlugs = results.slice(-3).map((a) => a.slug)
  assert.deepEqual(userAppSlugs, ["hardebell", "shedi", "photosy"])
})

test("hot tier and hero section icons order hot apps oldest first (hardebell -> photosy)", () => {
  const sample = apps[0]
  const hardebell = { ...sample, id: "hardebell", slug: "hardebell", name: "Hardebell", isHot: true, createdAt: "2026-11-01" } as AppItem
  const photosy = { ...sample, id: "photosy", slug: "photosy", name: "Photosy", isHot: true, createdAt: "2026-11-03" } as AppItem

  const cards = shelfApps([photosy, hardebell], "", "all")
  assert.deepEqual(cards.map((a) => a.slug), ["hardebell", "photosy"])

  const heroIcons = getHeroAppIcons([photosy, hardebell], 6)
  assert.deepEqual(heroIcons.map((a) => a.slug), ["hardebell", "photosy"])
})

test("gold and blue featured badges are also ordered oldest first", () => {
  const sample = apps[0]
  const goldOld = { ...sample, id: "gold-old", slug: "gold-old", name: "Gold Old", editorChoice: true, featuredTier: "article", createdAt: "2026-10-01" } as AppItem
  const goldNew = { ...sample, id: "gold-new", slug: "gold-new", name: "Gold New", editorChoice: true, featuredTier: "article", createdAt: "2026-11-01" } as AppItem
  const blueOld = { ...sample, id: "blue-old", slug: "blue-old", name: "Blue Old", editorChoice: true, featuredTier: "featured", createdAt: "2026-10-05" } as AppItem
  const blueNew = { ...sample, id: "blue-new", slug: "blue-new", name: "Blue New", editorChoice: true, featuredTier: "featured", createdAt: "2026-11-05" } as AppItem

  const results = shelfApps([blueNew, goldNew, blueOld, goldOld], "", "all")
  assert.deepEqual(results.map((a) => a.slug), ["gold-old", "gold-new", "blue-old", "blue-new"])

  const hero = getHeroAppIcons([blueNew, goldNew, blueOld, goldOld], 6)
  assert.deepEqual(hero.map((a) => a.slug), ["gold-old", "gold-new", "blue-old", "blue-new"])
})
