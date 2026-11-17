import assert from "node:assert/strict";
import { test } from "node:test";
import { getAppTotalClicks } from "./click-tracking.ts";
import { recordAppClick } from "./directory.server.ts";

test("getAppTotalClicks returns strictly authentic click counts without fake inflation", () => {
  // 0 clicks must return 0, not synthetic charCodeAt values
  assert.equal(getAppTotalClicks({ clickCount: 0, tryCount: 0 }), 0);
  assert.equal(getAppTotalClicks({}), 0);
  assert.equal(getAppTotalClicks(null), 0);
  assert.equal(getAppTotalClicks(undefined), 0);

  // Exact sum of card clicks and outbound referrals
  assert.equal(getAppTotalClicks({ clickCount: 5, tryCount: 12 }), 17);
  assert.equal(getAppTotalClicks({ clickCount: 1, tryCount: 0 }), 1);
  assert.equal(getAppTotalClicks({ clickCount: 0, tryCount: 42 }), 42);

  // Coerces string numbers accurately
  assert.equal(getAppTotalClicks({ clickCount: "10" as unknown as number, tryCount: "25" as unknown as number }), 35);
});

test("recordAppClick validates input and rejects empty target", async () => {
  const res1 = await recordAppClick("", "click");
  assert.equal(res1.ok, false);

  const res2 = await recordAppClick("   ", "try");
  assert.equal(res2.ok, false);
});

test("recordAppClick increments try and click counts accurately in database", async () => {
  // Use a known seed app from catalog
  const { publishedDirectory } = await import("./directory.server.ts");
  const directory = await publishedDirectory();
  const testApp = directory.apps[0];
  assert.ok(testApp, "Directory must have at least one app");

  const initialTotal = (testApp.clickCount ?? 0) + (testApp.tryCount ?? 0);

  // Record a referral try click by app ID
  const result1 = await recordAppClick(testApp.id, "try");
  assert.equal(result1.ok, true);
  assert.ok(result1.tryCount >= (testApp.tryCount ?? 0) + 1);

  // Record a browsing card click by app SLUG
  const result2 = await recordAppClick(testApp.slug, "click");
  assert.equal(result2.ok, true);
  assert.ok(result2.clickCount >= (testApp.clickCount ?? 0) + 1);
  assert.ok(result2.totalClicks > initialTotal);
});
