import assert from "node:assert/strict";
import test from "node:test";
import { hasPickMacAppsBadge, publicUrl } from "./badge.ts";
import {
  createAdminApp,
  generateAppDashboardToken,
  getAppRow,
  normalizeWebsiteDomain,
  regenerateAppDashboardToken,
  saveApp,
} from "./directory.server.ts";

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

test("normalizeWebsiteDomain strips protocol, www, and paths to match root domains", () => {
  assert.equal(normalizeWebsiteDomain("https://hardebell.app/"), "hardebell.app");
  assert.equal(normalizeWebsiteDomain("http://www.hardebell.app/download"), "hardebell.app");
  assert.equal(normalizeWebsiteDomain("hardebell.app"), "hardebell.app");
  assert.equal(normalizeWebsiteDomain("https://WWW.Hardebell.App/"), "hardebell.app");
});

test("admin can create app with x_handle, check_badge, and automated dashboard token", async () => {
  const result = await createAdminApp({
    name: "Test Admin App",
    tagline: "A test admin app with badge check and x handle",
    description: "Detailed description",
    website: "https://testadminapp.example.com",
    pricing: "free",
    category: "utility",
    checkBadge: true,
    xHandle: "@macdev_test",
  });

  assert.ok(result.id, "App ID generated");
  assert.ok(result.dashboardToken, "Dashboard token generated automatically");

  const app = await getAppRow(result.id);
  assert.ok(app, "App row retrieved");
  assert.equal(app.checkBadge, true, "checkBadge is true");
  assert.equal(app.xHandle, "macdev_test", "xHandle is stored cleanly without leading @");
  assert.equal(app.dashboardToken, result.dashboardToken, "dashboardToken matches");

  // Update app with new x_handle and check_badge = false
  await saveApp({
    id: result.id,
    name: "Test Admin App Updated",
    slug: app.slug,
    tagline: "Updated tagline",
    description: "Updated description",
    icon: "",
    demo: "",
    website: "https://testadminapp.example.com",
    pricing: "freemium",
    category: "utility",
    editorChoice: false,
    status: "published",
    checkBadge: false,
    xHandle: "new_handle",
  });

  const updated = await getAppRow(result.id);
  assert.ok(updated);
  assert.equal(updated.checkBadge, false, "checkBadge updated to false");
  assert.equal(updated.xHandle, "new_handle", "xHandle updated to new_handle");
});

test("admin can generate and regenerate secret dashboard tokens for apps", async () => {
  const result = await createAdminApp({
    name: "Dashboard Token Test App",
    tagline: "Testing token generation",
    description: "Testing token generation description",
    website: "https://tokentest.example.com",
    pricing: "free",
    category: "productivity",
  });

  const initialToken = await generateAppDashboardToken(result.id);
  assert.ok(initialToken, "Initial token retrieved");

  // Calling generate again returns existing token
  const secondCall = await generateAppDashboardToken(result.id);
  assert.equal(secondCall, initialToken, "Calling generateAppDashboardToken returns existing token if present");

  // Regenerate creates a fresh new token
  const freshToken = await regenerateAppDashboardToken(result.id);
  assert.ok(freshToken);
  assert.notEqual(freshToken, initialToken, "Regenerate creates a distinct new token");

  const app = await getAppRow(result.id);
  assert.equal(app?.dashboardToken, freshToken, "Database updated with fresh token");
});
