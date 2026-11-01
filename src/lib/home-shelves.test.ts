import assert from "node:assert/strict"
import { test } from "node:test"
import { apps, homeGroups, isEditorChoice, shelfApps, type AppItem } from "./catalog.ts"

test("editor's choice comes only from the saved flag", () => {
  const { choice, groups } = homeGroups(apps, "newest")
  const expected = apps.filter(isEditorChoice).map((app) => app.slug).sort()
  assert.deepEqual(expected, ["scanmydisk"])
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
  const shelf = apps.map((app) => app.slug).filter((slug) => slug !== "scanmydisk")
  assert.equal(slugs[0], "scanmydisk")
  assert.deepEqual(slugs.slice(1, 1 + shelf.length), shelf)
  assert.deepEqual(slugs.slice(-2), ["brand-new", "older-new"])
})
