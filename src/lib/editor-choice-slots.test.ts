import assert from "node:assert/strict";
import { test } from "node:test";
import { getNextCycleLabel, MAX_EDITOR_CHOICE_SLOTS, MAX_TIER_SLOTS } from "./directory.server.ts";
import { appPriorityWeight, featuredTierWeight, getHeroAppIcons, type AppItem } from "./catalog.ts";

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

test("MAX_EDITOR_CHOICE_SLOTS is strictly 6 and MAX_TIER_SLOTS is strictly 3 per tier", () => {
  assert.equal(MAX_EDITOR_CHOICE_SLOTS, 6);
  assert.equal(MAX_TIER_SLOTS, 3);
  assert.equal(MAX_TIER_SLOTS * 2, MAX_EDITOR_CHOICE_SLOTS);
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

test("appPriorityWeight places Hot apps directly below Gold and Blue featured apps", () => {
  const goldApp = { editorChoice: true, featuredTier: "article", isHot: false } as AppItem;
  const blueApp = { editorChoice: true, featuredTier: "featured", isHot: false } as AppItem;
  const hotApp = { editorChoice: false, isHot: true } as AppItem;
  const standardApp = { editorChoice: false, isHot: false } as AppItem;

  assert.equal(appPriorityWeight(goldApp), 3);
  assert.equal(appPriorityWeight(blueApp), 2);
  assert.equal(appPriorityWeight(hotApp), 1);
  assert.equal(appPriorityWeight(standardApp), 0);

  assert.ok(appPriorityWeight(goldApp) > appPriorityWeight(blueApp));
  assert.ok(appPriorityWeight(blueApp) > appPriorityWeight(hotApp));
  assert.ok(appPriorityWeight(hotApp) > appPriorityWeight(standardApp));
});

test("getHeroAppIcons returns strictly paid apps when 6 or more are available", () => {
  const paidApps: AppItem[] = Array.from({ length: 7 }, (_, i) => ({
    id: `paid-${i}`,
    slug: `paid-${i}`,
    name: `Paid App ${i}`,
    editorChoice: true,
    featuredTier: i < 3 ? "article" : "featured",
    isHot: false,
    createdAt: "2026-11-01",
  } as AppItem));
  const hotApps: AppItem[] = Array.from({ length: 5 }, (_, i) => ({
    id: `hot-${i}`,
    slug: `hot-${i}`,
    name: `Hot App ${i}`,
    editorChoice: false,
    isHot: true,
    views7d: 100 - i,
    createdAt: "2026-11-02",
  } as AppItem));

  const result = getHeroAppIcons([...hotApps, ...paidApps], 6);
  assert.equal(result.length, 6);
  assert.ok(result.every((app) => app.editorChoice));
  // Hot apps must NOT be toggled when 6 paid apps are available
  assert.ok(result.every((app) => !app.slug.startsWith("hot-")));
});

test("getHeroAppIcons toggles on top hot apps when fewer than 6 paid apps are available", () => {
  const paidApps: AppItem[] = [
    { id: "paid-1", slug: "paid-1", name: "Paid Gold", editorChoice: true, featuredTier: "article", createdAt: "2026-10-01" } as AppItem,
    { id: "paid-2", slug: "paid-2", name: "Paid Blue", editorChoice: true, featuredTier: "featured", createdAt: "2026-10-02" } as AppItem,
  ];
  const hotApps: AppItem[] = [
    { id: "hot-1", slug: "hot-1", name: "Hot 1", editorChoice: false, isHot: true, views7d: 100, createdAt: "2026-10-01" } as AppItem,
    { id: "hot-2", slug: "hot-2", name: "Hot 2", editorChoice: false, isHot: true, views7d: 50, createdAt: "2026-10-02" } as AppItem,
    { id: "hot-4", slug: "hot-4", name: "Hot 4", editorChoice: false, isHot: true, views7d: 10, createdAt: "2026-10-03" } as AppItem,
    { id: "hot-5", slug: "hot-5", name: "Hot 5", editorChoice: false, isHot: true, views7d: 5, createdAt: "2026-10-04" } as AppItem,
    { id: "hot-3", slug: "hot-3", name: "Hot Newer", editorChoice: false, isHot: true, views7d: 10, createdAt: "2026-11-01" } as AppItem,
  ];
  const standardApp = { id: "std-1", slug: "std-1", name: "Standard", editorChoice: false, isHot: false, views7d: 999 } as AppItem;

  const result = getHeroAppIcons([...hotApps, standardApp, ...paidApps], 6);
  assert.equal(result.length, 6);
  // Paid apps first: Gold tier then Blue tier
  assert.equal(result[0].slug, "paid-1");
  assert.equal(result[1].slug, "paid-2");
  // Remaining 4 are hot apps ordered oldest first (hot-1, hot-2, hot-4, hot-5)
  assert.equal(result[2].slug, "hot-1");
  assert.equal(result[3].slug, "hot-2");
  assert.equal(result[4].slug, "hot-4");
  assert.equal(result[5].slug, "hot-5");
  // hot-3 (newer) and standardApp must NOT be in the hero
  assert.equal(result.some((a) => a.slug === "hot-3"), false);
  assert.equal(result.some((a) => a.slug === "std-1"), false);
});

test("getHeroAppIcons avoids duplicating apps if an app is both paid and hot", () => {
  const dualApp = { id: "p1", slug: "p1", name: "Paid and Hot", editorChoice: true, featuredTier: "article", isHot: true } as AppItem;
  const hot1 = { id: "h1", slug: "h1", name: "Hot 1", editorChoice: false, isHot: true, views7d: 20 } as AppItem;

  const result = getHeroAppIcons([dualApp, hot1], 6);
  assert.equal(result.length, 2);
  assert.equal(result[0].slug, "p1");
  assert.equal(result[1].slug, "h1");
});
