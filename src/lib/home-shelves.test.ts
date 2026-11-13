import assert from "node:assert/strict"
import { test } from "node:test"
import { apps, homeGroups, isEditorChoice, shelfApps, sortApps, type AppItem } from "./catalog.ts"

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
