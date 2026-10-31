import assert from "node:assert/strict"
import { test } from "node:test"
import { apps, homeGroups } from "./catalog.ts"

test("editor's choice stays out of the job groups", () => {
  const { choice, groups } = homeGroups(apps, "newest")
  assert.deepEqual(
    choice.map((app) => app.slug).sort(),
    ["helumi", "macwhisper"],
  )
  const grouped = groups.flatMap((group) => group.apps.map((app) => app.slug))
  assert.equal(grouped.includes("helumi"), false)
  assert.equal(grouped.includes("macwhisper"), false)
  assert.equal(new Set(grouped).size, apps.length - choice.length)
  assert.equal(grouped.length + choice.length, apps.length)
  assert.ok(groups.some((group) => group.title === "Screenshots"))
  assert.equal(groups.some((group) => group.id === "more"), false)
})
