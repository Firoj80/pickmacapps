import assert from "node:assert/strict";
import test from "node:test";
import { hasPickMacAppsBadge, publicUrl } from "./badge.ts";

test("hasPickMacAppsBadge rejects third-party badge assets without PickMacApps", () => {
  // Scenario matching shedi.app (which links to TryMacApps with badge.png)
  const shediHtml = `
    <footer>
      <a href="https://www.trymacapps.com" target="_blank" rel="noopener">
        <img src="https://www.trymacapps.com/badge.png" alt="Featured on TryMacApps" width="162" height="54" />
      </a>
      <a href="https://macnative.io/apps/shedi" target="_blank">
        <img src="https://macnative.io/badge?kind=listed" alt="Listed on MacNative" />
      </a>
    </footer>
  `;
  assert.equal(hasPickMacAppsBadge(shediHtml), false, "Must reject third-party badge.png");

  const productHuntHtml = `
    <div>
      <a href="https://www.producthunt.com/posts/example">
        <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=123" alt="Product Hunt" />
      </a>
    </div>
  `;
  assert.equal(hasPickMacAppsBadge(productHuntHtml), false, "Must reject Product Hunt badge");
});

test("hasPickMacAppsBadge accepts authentic PickMacApps badges and backlinks", () => {
  // Official standard badge snippet
  const standardBadge = `
    <a href="https://pickmacapps.store" target="_blank" rel="noopener">
      <img src="https://pickmacapps.store/badge.svg" alt="Featured on PickMacApps" width="200" height="54" />
    </a>
  `;
  assert.equal(hasPickMacAppsBadge(standardBadge), true, "Must accept standard badge snippet");

  // Dark variant
  const darkBadge = `
    <a href="https://pickmacapps.store" target="_blank">
      <img src="https://pickmacapps.store/badge-dark.svg" alt="Featured on PickMacApps" />
    </a>
  `;
  assert.equal(hasPickMacAppsBadge(darkBadge), true, "Must accept dark badge variant");

  // Classic variant
  const classicBadge = `
    <a href="https://pickmacapps.store">
      <img src="https://pickmacapps.store/badge-classic.svg" alt="Featured on PickMacApps" />
    </a>
  `;
  assert.equal(hasPickMacAppsBadge(classicBadge), true, "Must accept classic badge variant");

  // Reciprocal text backlink
  const textLink = `<p>Featured on <a href="https://pickmacapps.store">PickMacApps</a> directory</p>`;
  assert.equal(hasPickMacAppsBadge(textLink), true, "Must accept reciprocal text link to pickmacapps.store");
});

test("publicUrl rejects private or invalid addresses", () => {
  assert.equal(publicUrl("http://localhost:3000"), null);
  assert.equal(publicUrl("http://127.0.0.1"), null);
  assert.equal(publicUrl("http://192.168.1.1"), null);
  assert.equal(publicUrl("not-a-url"), null);
  assert.notEqual(publicUrl("https://example.com"), null);
});
