import assert from "node:assert/strict";
import { test } from "node:test";
import { getNextCycleLabel, MAX_EDITOR_CHOICE_SLOTS } from "./directory.server.ts";

test("getNextCycleLabel returns the next upcoming Sunday rollover date", () => {
  // 2026-10-31 is Saturday (getDay() === 6). Next Sunday is Nov 1.
  const saturday = new Date(Date.UTC(2026, 9, 31, 12, 0, 0));
  const labelSat = getNextCycleLabel(saturday);
  assert.equal(labelSat, "1 Nov");

  // 2026-11-01 is Sunday (getDay() === 0). Next Sunday cycle is Nov 8.
  const sunday = new Date(Date.UTC(2026, 10, 1, 12, 0, 0));
  const labelSun = getNextCycleLabel(sunday);
  assert.equal(labelSun, "8 Nov");
});

test("MAX_EDITOR_CHOICE_SLOTS is strictly 3", () => {
  assert.equal(MAX_EDITOR_CHOICE_SLOTS, 3);
});
