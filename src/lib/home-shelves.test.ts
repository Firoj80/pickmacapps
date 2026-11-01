import assert from "node:assert/strict"
import { test } from "node:test"
import { apps, homeGroups, isEditorChoice } from "./catalog.ts"

test("editor's choice stays out of the job groups", () => {
  const { choice, groups } = homeGroups(apps, "newest")
  const expected = apps.filter(isEditorChoice).map((app) => app.slug).sort()
  assert.deepEqual(
    choice.map((app) => app.slug).sort(),
    expected,
  )
  const grouped = groups.flatMap((group) => group.apps.map((app) => app.slug))
  assert.equal(grouped.includes("helumi"), false)
  assert.equal(grouped.includes("macwhisper"), false)
  assert.equal(grouped.includes("scanmydisk"), false)
  assert.equal(new Set(grouped).size, apps.length - expected.length)
  assert.equal(grouped.length + choice.length, apps.length)
  assert.ok(groups.some((group) => group.title === "Screenshots"))
  assert.equal(groups.some((group) => group.id === "more"), false)
})
