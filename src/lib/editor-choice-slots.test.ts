import assert from "node:assert/strict";
import { test } from "node:test";
import { getNextCycleLabel, MAX_EDITOR_CHOICE_SLOTS } from "./directory.server.ts";
import { featuredTierWeight, type AppItem } from "./catalog.ts";

test("getNextCycleLabel returns the 30-day rollover date", () => {
  // 2026-10-31 + 30 days is Nov 30
  const oct31 = new Date(Date.UTC(2026, 9, 31, 12, 0, 0));
  const labelOct = getNextCycleLabel(oct31);
  assert.equal(labelOct, "30 Nov");

  // 2026-11-01 + 30 days is Dec 1
  const nov1 = new Date(Date.UTC(2026, 10, 1, 12, 0, 0));
  const labelNov = getNextCycleLabel(nov1);
  assert.equal(labelNov, "1 Dec");
});

test("MAX_EDITOR_CHOICE_SLOTS is strictly 6", () => {
  assert.equal(MAX_EDITOR_CHOICE_SLOTS, 6);
});

test("featuredTierWeight prioritizes Gold (article) over Blue (featured) over standard", () => {
  const goldApp = { editorChoice: true, featuredTier: "article" } as AppItem;
  const blueApp = { editorChoice: true, featuredTier: "featured" } as AppItem;
  const standardApp = { editorChoice: false } as AppItem;

  assert.equal(featuredTierWeight(goldApp), 2);
  assert.equal(featuredTierWeight(blueApp), 1);
  assert.equal(featuredTierWeight(standardApp), 0);
  assert.ok(featuredTierWeight(goldApp) > featuredTierWeight(blueApp));
  assert.ok(featuredTierWeight(blueApp) > featuredTierWeight(standardApp));
});
