import test from "node:test";
import assert from "node:assert/strict";
import { formatSidebarRelativeTime, getSidebarCutoff } from "@/lib/catalog";
import { publicOffer, updateSidebarSettings } from "@/lib/directory.server";

test("getSidebarCutoff calculates accurate millisecond cutoffs for all duration options", () => {
  const fixedNow = 1_700_000_000_000;

  // 24 hours
  const cutoff24h = getSidebarCutoff("24h", fixedNow);
  assert.equal(cutoff24h, fixedNow - 24 * 60 * 60 * 1000);

  // 7 days
  const cutoff7d = getSidebarCutoff("7d", fixedNow);
  assert.equal(cutoff7d, fixedNow - 7 * 24 * 60 * 60 * 1000);

  // 15 days
  const cutoff15d = getSidebarCutoff("15d", fixedNow);
  assert.equal(cutoff15d, fixedNow - 15 * 24 * 60 * 60 * 1000);

  // 30 days
  const cutoff30d = getSidebarCutoff("30d", fixedNow);
  assert.equal(cutoff30d, fixedNow - 30 * 24 * 60 * 60 * 1000);

  // all (no cutoff)
  const cutoffAll = getSidebarCutoff("all", fixedNow);
  assert.equal(cutoffAll, 0);
});

test("formatSidebarRelativeTime formats relative times accurately", () => {
  const fixedNow = 1_700_000_000_000;

  // 30 seconds ago -> just now
  assert.equal(formatSidebarRelativeTime(new Date(fixedNow - 30 * 1000), fixedNow), "just now");

  // 25 minutes ago -> 25m ago
  assert.equal(formatSidebarRelativeTime(new Date(fixedNow - 25 * 60 * 1000), fixedNow), "25m ago");

  // 4 hours ago -> 4h ago
  assert.equal(formatSidebarRelativeTime(new Date(fixedNow - 4 * 3600 * 1000), fixedNow), "4h ago");

  // 3 days ago -> 3d ago
  assert.equal(formatSidebarRelativeTime(new Date(fixedNow - 3 * 86400 * 1000), fixedNow), "3d ago");

  // Invalid date string -> empty string
  assert.equal(formatSidebarRelativeTime("invalid-date", fixedNow), "");
});

test("updateSidebarSettings persists and publicOffer retrieves duration and enabled state", async () => {
  // Test updating to 15d and enabled true
  await updateSidebarSettings({ duration: "15d", enabled: true });
  let offer = await publicOffer();
  assert.equal(offer.sidebarSettings?.duration, "15d");
  assert.equal(offer.sidebarSettings?.enabled, true);

  // Test updating to 7d and disabled
  await updateSidebarSettings({ duration: "7d", enabled: false });
  offer = await publicOffer();
  assert.equal(offer.sidebarSettings?.duration, "7d");
  assert.equal(offer.sidebarSettings?.enabled, false);

  // Test invalid duration safely defaults to 24h
  await updateSidebarSettings({ duration: "invalid-duration" as any, enabled: true });
  offer = await publicOffer();
  assert.equal(offer.sidebarSettings?.duration, "24h");
  assert.equal(offer.sidebarSettings?.enabled, true);

  // Reset to default 24h and enabled true
  await updateSidebarSettings({ duration: "24h", enabled: true });
  offer = await publicOffer();
  assert.equal(offer.sidebarSettings?.duration, "24h");
  assert.equal(offer.sidebarSettings?.enabled, true);
});
