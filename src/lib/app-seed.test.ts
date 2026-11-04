import assert from "node:assert/strict";
import { test } from "node:test";
import { publishedApps, shouldSeedCatalogApps } from "./app-seed.ts";

test("catalog apps are copied only into an empty database", () => {
  assert.equal(shouldSeedCatalogApps(null, 0), true);
  assert.equal(shouldSeedCatalogApps(undefined, 0, false), true);
  assert.equal(shouldSeedCatalogApps(null, 12), false);
  assert.equal(shouldSeedCatalogApps("1", 0), false);
  assert.equal(shouldSeedCatalogApps("1", 4), false);
  assert.equal(shouldSeedCatalogApps(null, Number.NaN), false);
  assert.equal(shouldSeedCatalogApps(null, 0, true), false);
});

test("public pages do not fall back to a local app list", () => {
  assert.deepEqual(publishedApps(null), []);
  assert.deepEqual(publishedApps(undefined), []);
  assert.deepEqual(publishedApps({ apps: [{ slug: "kept" }] }), [{ slug: "kept" }]);
});
