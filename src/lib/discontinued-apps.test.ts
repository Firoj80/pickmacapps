import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getDiscontinuedAppInfo } from "./discontinued-apps.ts";

describe("getDiscontinuedAppInfo", () => {
  it("resolves earlier deleted apps accurately from dictionary", () => {
    const scan = getDiscontinuedAppInfo("scanmydisk");
    assert.equal(scan.name, "ScanMyDisk");
    assert.equal(scan.category, "utility");
    assert.equal(scan.categoryName, "Utility");
    assert.equal(scan.isKnown, true);

    const shedi = getDiscontinuedAppInfo("shedi");
    assert.equal(shedi.name, "Shedi");
    assert.equal(shedi.category, "dev");
    assert.equal(shedi.categoryName, "Dev");
    assert.equal(shedi.isKnown, true);

    const photsy = getDiscontinuedAppInfo("photsy");
    assert.equal(photsy.name, "Photsy");
    assert.equal(photsy.category, "photography");
    assert.equal(photsy.isKnown, true);

    const herdbell = getDiscontinuedAppInfo("herdbell");
    assert.equal(herdbell.name, "Herdbell");
    assert.equal(herdbell.isKnown, true);

    const toast = getDiscontinuedAppInfo("screentoast");
    assert.equal(toast.name, "ScreenToast");
    assert.equal(toast.isKnown, true);
  });

  it("prioritizes live tombstones from database", () => {
    const tombstones = [
      { slug: "custom-app", name: "Custom Pro App", category: "audio" },
    ];
    const info = getDiscontinuedAppInfo("custom-app", tombstones);
    assert.equal(info.name, "Custom Pro App");
    assert.equal(info.category, "audio");
    assert.equal(info.categoryName, "Audio");
    assert.equal(info.isKnown, true);
  });

  it("gracefully falls back for unknown deleted slugs", () => {
    const unknown = getDiscontinuedAppInfo("my-awesome-tool");
    assert.equal(unknown.name, "My Awesome Tool");
    assert.equal(unknown.category, "utility");
    assert.equal(unknown.isKnown, false);

    const shotApp = getDiscontinuedAppInfo("super-shot-tool");
    assert.equal(shotApp.name, "Super Shot Tool");
    assert.equal(shotApp.category, "photography");
    assert.equal(shotApp.isKnown, false);
  });
});
