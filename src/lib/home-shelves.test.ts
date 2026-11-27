import assert from "node:assert/strict"
import { test } from "node:test"
import { apps, getHeroAppIcons, getPriorityTimestamp, homeGroups, isEditorChoice, normalizeYouTubeUrl, parseYouTubeVideoId, sanitizeGalleryImages, shelfApps, sortApps, type AppItem } from "./catalog.ts"

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

test("new apps precede the starter shelf, newest first", () => {
  const sample = apps[0]
  const newer = { ...sample, id: "brand-new", slug: "brand-new", name: "Brand New", editorChoice: false, isSeed: false, createdAt: "2026-11-01" } as AppItem
  const older = { ...sample, id: "older-new", slug: "older-new", name: "Older New", editorChoice: false, isSeed: false, createdAt: "2026-01-01" } as AppItem
  const slugs = shelfApps([...apps, newer, older], "", "all", "newest").map((app) => app.slug)
  const shelf = apps.map((app) => app.slug)
  assert.deepEqual(slugs.slice(0, 2), ["brand-new", "older-new"])
  assert.deepEqual(slugs.slice(2), shelf)
})

test("sortApps with oldest orders apps from oldest to newest", () => {
  const sample = apps[0]
  const older = { ...sample, id: "app-old", slug: "app-old", name: "Older App", isSeed: false, createdAt: "2024-01-01" } as AppItem
  const newer = { ...sample, id: "app-new", slug: "app-new", name: "Newer App", isSeed: false, createdAt: "2026-05-01" } as AppItem
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

test("by default, user submitted apps are ordered oldest first above seed apps (hardebell -> shedi -> photosy)", () => {
  const sample = apps[0]
  const hardebell = { ...sample, id: "hardebell", slug: "hardebell", name: "Hardebell", editorChoice: false, isSeed: false, createdAt: "2026-11-01" } as AppItem
  const shedi = { ...sample, id: "shedi", slug: "shedi", name: "Shedi", editorChoice: false, isSeed: false, createdAt: "2026-11-02" } as AppItem
  const photosy = { ...sample, id: "photosy", slug: "photosy", name: "Photosy", editorChoice: false, isSeed: false, createdAt: "2026-11-03" } as AppItem

  const results = shelfApps([...apps, photosy, hardebell, shedi], "", "all")
  const userAppSlugs = results.slice(0, 3).map((a) => a.slug)
  assert.deepEqual(userAppSlugs, ["hardebell", "shedi", "photosy"])
  const remainingSlugs = results.slice(3).map((a) => a.slug)
  assert.deepEqual(remainingSlugs, apps.map((a) => a.slug))
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

test("strict FIFO seniority: earlier featured app (Shotbase) stays 1st and newly featured app (Notchy) is 2nd regardless of createdAt", () => {
  const sample = apps[0];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  // Notchy was created earlier but featured later
  const notchy = {
    ...sample,
    id: "notchy",
    slug: "notchy",
    name: "Notchy",
    editorChoice: true,
    featuredTier: "article",
    createdAt: new Date(now - 12 * dayMs).toISOString(),
    featuredUntil: new Date(now + 5 * dayMs).toISOString(),
    featuredAt: new Date(now - 2 * dayMs).toISOString(),
  } as AppItem;

  // Shotbase was created later but featured earlier
  const shotbase = {
    ...sample,
    id: "shotbase",
    slug: "shotbase",
    name: "Shotbase",
    editorChoice: true,
    featuredTier: "article",
    createdAt: new Date(now - 10 * dayMs).toISOString(),
    featuredUntil: new Date(now + 3 * dayMs).toISOString(),
    featuredAt: new Date(now - 4 * dayMs).toISOString(),
  } as AppItem;

  // Third app featured even later
  const cleanApp = {
    ...sample,
    id: "cleanapp",
    slug: "cleanapp",
    name: "CleanApp",
    editorChoice: true,
    featuredTier: "article",
    createdAt: new Date(now - 20 * dayMs).toISOString(),
    featuredUntil: new Date(now + 6 * dayMs).toISOString(),
    featuredAt: new Date(now - 1 * dayMs).toISOString(),
  } as AppItem;

  // In default feed, Shotbase MUST be 1st, Notchy 2nd, CleanApp 3rd
  const results = shelfApps([notchy, cleanApp, shotbase], "", "all");
  assert.deepEqual(results.map((a) => a.slug), ["shotbase", "notchy", "cleanapp"]);

  // In hero icons, Shotbase MUST be 1st, Notchy 2nd, CleanApp 3rd
  const heroIcons = getHeroAppIcons([notchy, cleanApp, shotbase], 6);
  assert.deepEqual(heroIcons.map((a) => a.slug), ["shotbase", "notchy", "cleanapp"]);
});

test("when earlier featured app expires, the 2nd featured app immediately takes 1st place", () => {
  const sample = apps[0];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  // Shotbase whose featuredUntil is in the past (expired)
  const expiredShotbase = {
    ...sample,
    id: "shotbase",
    slug: "shotbase",
    name: "Shotbase",
    editorChoice: true,
    featuredTier: "article",
    createdAt: new Date(now - 10 * dayMs).toISOString(),
    featuredUntil: new Date(now - 1 * dayMs).toISOString(), // Past!
    featuredAt: new Date(now - 8 * dayMs).toISOString(),
  } as AppItem;

  // Notchy whose featuredUntil is still active (future)
  const activeNotchy = {
    ...sample,
    id: "notchy",
    slug: "notchy",
    name: "Notchy",
    editorChoice: true,
    featuredTier: "article",
    createdAt: new Date(now - 12 * dayMs).toISOString(),
    featuredUntil: new Date(now + 5 * dayMs).toISOString(),
    featuredAt: new Date(now - 2 * dayMs).toISOString(),
  } as AppItem;

  // Notchy must take 1st place because Shotbase has expired
  const results = shelfApps([expiredShotbase, activeNotchy], "", "all");
  assert.equal(results[0]?.slug, "notchy");

  const heroIcons = getHeroAppIcons([expiredShotbase, activeNotchy], 6);
  assert.equal(heroIcons[0]?.slug, "notchy");
});

test("FIFO seniority queue sorts earlier featured app ahead even if created later", () => {
  const sample = apps[0];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const shotbase = {
    ...sample,
    id: "shotbase",
    slug: "shotbase",
    name: "Shotbase",
    editorChoice: true,
    featuredTier: "article",
    createdAt: new Date(now - 10 * dayMs).toISOString(),
    featuredUntil: new Date(now + 3 * dayMs).toISOString(),
    featuredAt: new Date(now - 4 * dayMs).toISOString(),
  } as AppItem;

  const notchy = {
    ...sample,
    id: "notchy",
    slug: "notchy",
    name: "Notchy",
    editorChoice: true,
    featuredTier: "article",
    createdAt: new Date(now - 12 * dayMs).toISOString(),
    featuredUntil: new Date(now + 5 * dayMs).toISOString(),
    featuredAt: new Date(now - 2 * dayMs).toISOString(),
  } as AppItem;

  const byPriorityQueue = (a: AppItem, b: AppItem) => {
    return getPriorityTimestamp(a) - getPriorityTimestamp(b) || a.name.localeCompare(b.name);
  };

  const goldList = [notchy, shotbase].sort(byPriorityQueue);
  assert.equal(goldList[0]?.slug, "shotbase");
  assert.equal(goldList[1]?.slug, "notchy");
});

test("parseYouTubeVideoId and sanitizeGalleryImages enforce YouTube parsing and max 6 image cap", () => {
  assert.equal(parseYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=10"), "dQw4w9WgXcQ");
  assert.equal(parseYouTubeVideoId("https://youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(parseYouTubeVideoId("https://example.com/not-youtube"), null);
  assert.equal(normalizeYouTubeUrl("https://youtu.be/dQw4w9WgXcQ"), "https://www.youtube.com/watch?v=dQw4w9WgXcQ");

  const rawImages = [
    "https://cdn.example.com/1.webp",
    "https://cdn.example.com/2.webp",
    "https://cdn.example.com/2.webp", // duplicate
    "https://cdn.example.com/3.webp",
    "javascript:alert(1)", // invalid protocol
    "https://cdn.example.com/4.webp",
    "https://cdn.example.com/5.webp",
    "https://cdn.example.com/6.webp",
    "https://cdn.example.com/7.webp", // over limit
  ];
  const sanitized = sanitizeGalleryImages(rawImages);
  assert.equal(sanitized.length, 6);
  assert.deepEqual(sanitized, [
    "https://cdn.example.com/1.webp",
    "https://cdn.example.com/2.webp",
    "https://cdn.example.com/3.webp",
    "https://cdn.example.com/4.webp",
    "https://cdn.example.com/5.webp",
    "https://cdn.example.com/6.webp",
  ]);
});
