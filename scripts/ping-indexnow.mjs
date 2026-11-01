import { sectionUrls, SITEMAP_SECTIONS } from "../src/lib/sitemap.ts";
import { indexNowKey } from "../src/lib/indexnow.ts";

const origin = "https://www.picmacapps.store";
const key = indexNowKey() || "e4d7a8c392f1b0a56e8d2c1f9b3a7e50";

const urls = [];
for (const section of SITEMAP_SECTIONS) {
  for (const item of sectionUrls(section, origin)) {
    urls.push(item.loc);
  }
}

const payload = {
  host: "www.picmacapps.store",
  key,
  keyLocation: `${origin}/${key}.txt`,
  urlList: [...new Set(urls)],
};

console.log(`[IndexNow] Prepared ${payload.urlList.length} URLs for key ${key}`);

if (process.env.INDEXNOW_SUBMIT === "1" || process.env.NODE_ENV === "production") {
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    console.log(`[IndexNow] Submitted ${payload.urlList.length} URLs. Status: ${res.status}`);
  } catch (err) {
    console.warn(`[IndexNow] Submission skipped or failed: ${err.message}`);
  }
} else {
  console.log(`[IndexNow] Dry-run ping completed successfully. (Set INDEXNOW_SUBMIT=1 to send live POST).`);
}
