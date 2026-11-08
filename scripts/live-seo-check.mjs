async function check() {
  const host = "http://127.0.0.1:3000";
  const urls = [
    "/",
    "/category",
    "/category/productivity",
    "/blog",
    "/blog/must-have-mac-apps-2026",
    "/app/shottr",
    "/sponsor",
    "/submit",
    "/how-we-pick",
    "/compare",
    "/categories"
  ];

  console.log(`Starting Live Site Audit on ${host}...\n`);

  for (const path of urls) {
    try {
      const res = await fetch(host + path, { redirect: "manual" });
      const status = res.status;
      const location = res.headers.get("location");

      if (status >= 300 && status < 400) {
        console.log(`=== ${path} (Status: ${status} Redirect) ===`);
        console.log(`  Redirect To: ${location}`);
        console.log("");
        continue;
      }

      const text = await res.text();
      
      const titleMatch = text.match(/<title>([^<]*)<\/title>/i);
      const descMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
      const ogTitleMatch = text.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
      const ogDescMatch = text.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
      const ogImageMatch = text.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
      const twCardMatch = text.match(/<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']*)["']/i);
      const twSiteMatch = text.match(/<meta[^>]*name=["']twitter:site["'][^>]*content=["']([^"']*)["']/i);
      const twCreatorMatch = text.match(/<meta[^>]*name=["']twitter:creator["'][^>]*content=["']([^"']*)["']/i);
      const jsonLdMatch = text.match(/<script type=["']application\/ld\+json["']>([^<]*)<\/script>/i);

      console.log(`=== ${path} (Status: ${status}) ===`);
      console.log(`  Title:           ${titleMatch ? titleMatch[1] : "MISSING"}`);
      console.log(`  Meta Desc:       ${descMatch ? descMatch[1].slice(0, 75) + "..." : "MISSING"}`);
      console.log(`  og:title:        ${ogTitleMatch ? ogTitleMatch[1] : "MISSING"}`);
      console.log(`  og:description:  ${ogDescMatch ? ogDescMatch[1].slice(0, 75) + "..." : "MISSING"}`);
      console.log(`  og:image:        ${ogImageMatch ? ogImageMatch[1] : "MISSING"}`);
      console.log(`  twitter:card:    ${twCardMatch ? twCardMatch[1] : "MISSING"}`);
      console.log(`  twitter:site:    ${twSiteMatch ? twSiteMatch[1] : "MISSING"} (creator: ${twCreatorMatch ? twCreatorMatch[1] : "MISSING"})`);

      if (jsonLdMatch) {
        try {
          const ld = JSON.parse(jsonLdMatch[1]);
          const types = ld["@graph"] ? ld["@graph"].map(n => n["@type"]).join(", ") : ld["@type"];
          console.log(`  JSON-LD Schemas: ${types}`);
        } catch(e) {
          console.log(`  JSON-LD:         PARSE ERROR`);
        }
      } else {
        console.log(`  JSON-LD:         NONE`);
      }

      // Feature specific checks
      if (path === "/") {
        const h1Match = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const cleanH1 = h1Match ? h1Match[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "NONE";
        const hasGuideStrip = text.includes("Guides to the best Mac apps");
        const hasCategoryEmojis = /<option[^>]*>[\s]*[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(text);
        console.log(`  [Homepage Check] H1: "${cleanH1}"`);
        console.log(`  [Homepage Check] GuideStrip Grid: ${hasGuideStrip ? "YES (rendered)" : "NO"}`);
        console.log(`  [Homepage Check] Category Dropdown Emojis: ${hasCategoryEmojis ? "FOUND (FAIL)" : "CLEAN (PASS)"}`);
      } else if (path === "/category") {
        const hasCategoryEmojis = /class=["'][^"']*text-2xl[^"']*["'][^>]*>[\s]*[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(text);
        const hasShelfPreviews = text.includes("Featured on shelf:");
        console.log(`  [Category Hub] Emojis in cards: ${hasCategoryEmojis ? "FOUND (FAIL)" : "CLEAN (PASS)"}`);
        console.log(`  [Category Hub] App icon strips: ${hasShelfPreviews ? "FOUND" : "REMOVED (PASS)"}`);
      } else if (path === "/category/productivity") {
        const hasTitleEmoji = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(titleMatch ? titleMatch[1] : "");
        const hasFaqPage = text.includes("FAQPage");
        const hasBuyerChecklist = text.includes("What to look for in Mac Productivity apps");
        console.log(`  [Category Page] Title Emoji: ${hasTitleEmoji ? "FOUND (FAIL)" : "CLEAN (PASS)"}`);
        console.log(`  [Category Page] FAQPage Schema: ${hasFaqPage ? "YES" : "NO"}`);
        console.log(`  [Category Page] Buyer Checklist: ${hasBuyerChecklist ? "YES" : "NO"}`);
      } else if (path === "/app/shottr") {
        const hasComparisons = text.includes("Alternatives &amp; Comparisons") || text.includes("Alternatives & Comparisons");
        console.log(`  [App Detail] Alternatives & Comparisons Widget: ${hasComparisons ? "YES" : "NO"}`);
      }

      console.log("");
    } catch (err) {
      console.error(`Error on ${path}:`, err.message);
    }
  }
}

check();
