import { publicUrl } from "@/lib/badge";

export type FetchedMetadata = {
  name: string;
  website: string;
  tagline: string;
  description: string;
  icon: string;
  demo: string;
  pricing: "free" | "freemium" | "paid";
  category: "design" | "developer-tools" | "productivity" | "utilities";
  xHandle?: string;
};

export type FetchMetadataResult =
  | { ok: true; data: FetchedMetadata; message?: string }
  | { ok: false; error: string };

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&bull;/g, "•")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(Number(dec));
      } catch {
        return _;
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return _;
      }
    });
}

function getAttr(tag: string, attr: string): string | null {
  const regex = new RegExp(`\\b${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(regex);
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3] ?? null;
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

function cleanText(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function parseAppMetadataFromHtml(html: string, pageUrl: string): FetchedMetadata {
  const metaTags: Array<{ name?: string; property?: string; content: string }> = [];
  const metaRegex = /<meta\s+([^>]*?)>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRegex.exec(html)) !== null) {
    const tag = match[1] || "";
    const name = getAttr(tag, "name")?.toLowerCase();
    const property = getAttr(tag, "property")?.toLowerCase();
    const content = getAttr(tag, "content");
    if (content !== null && content !== undefined) {
      metaTags.push({ name, property, content: decodeHtmlEntities(content.trim()) });
    }
  }

  const linkTags: Array<{ rel: string; href: string; sizes?: string }> = [];
  const linkRegex = /<link\s+([^>]*?)>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    const tag = match[1] || "";
    const rel = getAttr(tag, "rel")?.toLowerCase();
    const href = getAttr(tag, "href");
    const sizes = getAttr(tag, "sizes")?.toLowerCase();
    if (rel && href) {
      linkTags.push({ rel, href: href.trim(), sizes });
    }
  }

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = titleMatch ? cleanText(decodeHtmlEntities(titleMatch[1])) : "";

  // Extract JSON-LD
  const jsonLdObjects: any[] = [];
  const jsonLdRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) jsonLdObjects.push(...parsed);
      else if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed["@graph"])) jsonLdObjects.push(...parsed["@graph"]);
        else jsonLdObjects.push(parsed);
      }
    } catch {
      // Ignore JSON parse errors in third-party scripts
    }
  }

  const appLd = jsonLdObjects.find(
    (o) =>
      o &&
      typeof o === "object" &&
      typeof o["@type"] === "string" &&
      /softwareapplication|webapplication|product|organization/i.test(o["@type"])
  );

  // Meta helpers
  const getMeta = (keys: string[]) => {
    for (const key of keys) {
      const found = metaTags.find((m) => m.property === key.toLowerCase() || m.name === key.toLowerCase());
      if (found && found.content) return found.content;
    }
    return "";
  };

  const ogSiteName = getMeta(["og:site_name"]);
  const appNameMeta = getMeta(["application-name", "apple-mobile-web-app-title"]);
  const ogTitle = getMeta(["og:title", "twitter:title"]);
  const ogDesc = getMeta(["og:description", "description", "twitter:description"]);
  const ogImage = getMeta(["og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"]);

  // 1. Resolve Name & Tagline
  let name = "";
  let extractedTagline = "";

  const titleSource = ogTitle || rawTitle;

  // Check if title has separator like "AppName - The Short Tagline" or "AppName | Tagline" or "AppName: Tagline"
  const titleDelimMatch = titleSource.match(/^([^—–|:•-]+?)\s*[—–|:•-]\s*(.+)$/);
  if (titleDelimMatch && titleDelimMatch[1] && titleDelimMatch[2]) {
    const part1 = titleDelimMatch[1].trim();
    const part2 = titleDelimMatch[2].trim();
    if (part1.length <= 40 && part1.length >= 2) {
      name = part1;
      extractedTagline = part2;
    } else if (part2.length <= 40 && part2.length >= 2) {
      name = part2;
      extractedTagline = part1;
    }
  }

  if (ogSiteName && ogSiteName.length <= 40 && ogSiteName.length >= 2) {
    name = ogSiteName;
  } else if (appNameMeta && appNameMeta.length <= 40 && appNameMeta.length >= 2) {
    name = appNameMeta;
  } else if (appLd && typeof appLd.name === "string" && appLd.name.length <= 40) {
    name = appLd.name;
  } else if (!name) {
    if (titleSource && titleSource.length <= 40) {
      name = titleSource;
    } else {
      try {
        const u = new URL(pageUrl);
        const hostBase = u.hostname.replace(/^www\./, "").split(".")[0] || "App";
        name = hostBase.charAt(0).toUpperCase() + hostBase.slice(1);
      } catch {
        name = "App";
      }
    }
  }

  // Clean trailing branding like "Helumi for Mac" -> "Helumi" if site name is cleaner
  name = name.replace(/\s+for\s+mac(os)?/i, "").trim();

  // 2. Tagline
  let tagline = extractedTagline;
  if (!tagline) {
    if (ogDesc) {
      // Use first sentence up to period/exclamation
      const firstSentence = ogDesc.split(/[.!?]\s+/)[0];
      tagline = firstSentence ? firstSentence.trim() : ogDesc.slice(0, 140);
    } else if (titleSource && titleSource !== name) {
      tagline = titleSource;
    }
  }
  if (tagline.length > 160) {
    tagline = tagline.slice(0, 157).trim() + "…";
  }

  // 3. Description
  let description = ogDesc || (appLd && typeof appLd.description === "string" ? appLd.description : "");
  if (!description) {
    // Look for first substantial paragraph in body
    const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (pMatch) {
      for (const p of pMatch) {
        const cleaned = cleanText(decodeHtmlEntities(p));
        if (cleaned.length >= 40 && !cleaned.toLowerCase().includes("cookie")) {
          description = cleaned;
          break;
        }
      }
    }
  }
  description = cleanText(description).slice(0, 4000);

  // 4. Icon
  let icon = "";
  // Check apple-touch-icon first (best high-res icon for Mac apps)
  const appleIcon = linkTags.find(
    (l) => l.rel.includes("apple-touch-icon") || l.rel.includes("apple-touch-icon-precomposed")
  );
  if (appleIcon) {
    icon = resolveUrl(appleIcon.href, pageUrl);
  } else {
    // Check sizes for large png icons
    const largeIcon = linkTags.find(
      (l) => l.rel.includes("icon") && l.sizes && /(180|192|128|96|64|512|256)/.test(l.sizes)
    );
    if (largeIcon) {
      icon = resolveUrl(largeIcon.href, pageUrl);
    } else {
      const anyIcon = linkTags.find((l) => l.rel.includes("icon"));
      if (anyIcon) {
        icon = resolveUrl(anyIcon.href, pageUrl);
      } else if (appLd && typeof appLd.logo === "string") {
        icon = resolveUrl(appLd.logo, pageUrl);
      }
    }
  }
  if (!icon) {
    try {
      const u = new URL(pageUrl);
      icon = `${u.origin}/apple-touch-icon.png`;
    } catch {
      icon = "";
    }
  }

  // 5. Demo screenshot
  let demo = "";
  if (ogImage) {
    demo = resolveUrl(ogImage, pageUrl);
  } else if (appLd && typeof appLd.image === "string") {
    demo = resolveUrl(appLd.image, pageUrl);
  }

  // 6. Pricing heuristic
  const fullText = (rawTitle + " " + ogDesc + " " + html.slice(0, 300_000)).toLowerCase();
  let pricing: "free" | "freemium" | "paid" = "free";

  const hasFreeSignals =
    /\b(freemium|free\s*trial|free\s*plan|free\s*tier|try\s*(for\s*)?free|free\s*to\s*(start|use|try)|free\s*download|download(\s*for)?\s*free|free\s*version|start\s*for\s*free|free)\b/i.test(
      fullText
    );

  const hasPaidSignals =
    fullText.includes("$") ||
    fullText.includes("€") ||
    fullText.includes("£") ||
    fullText.includes("pricing") ||
    fullText.includes("purchase") ||
    fullText.includes("buy now") ||
    fullText.includes("lifetime license") ||
    fullText.includes("/month") ||
    fullText.includes("/year") ||
    fullText.includes("subscription");

  if (hasFreeSignals && hasPaidSignals) {
    pricing = "freemium";
  } else if (hasPaidSignals && !fullText.includes("100% free") && !fullText.includes("open source")) {
    pricing = "paid";
  } else {
    pricing = "free";
  }

  // 7. Category heuristic
  // Available slugs: "developer-tools" | "design" | "productivity" | "utilities"
  const catScores: Record<"developer-tools" | "design" | "productivity" | "utilities", number> = {
    "developer-tools": 0,
    design: 0,
    productivity: 0,
    utilities: 0,
  };

  const scoreText = (titleSource + " " + ogDesc + " " + description).toLowerCase();

  const keywords: Record<"developer-tools" | "design" | "productivity" | "utilities", string[]> = {
    "developer-tools": [
      "developer",
      "devtools",
      "code",
      "git",
      "github",
      "terminal",
      "api",
      "cli",
      "sdk",
      "database",
      "sql",
      "docker",
      "programming",
      "regex",
      "localhost",
      "webhook",
      "json",
      "debugger",
      "compiler",
      "ide",
    ],
    design: [
      "design",
      "ui",
      "ux",
      "figma",
      "sketch",
      "vector",
      "canvas",
      "icon",
      "illustration",
      "palette",
      "color",
      "font",
      "typography",
      "photo",
      "mockup",
      "svg",
      "graphics",
    ],
    productivity: [
      "productivity",
      "notes",
      "writing",
      "markdown",
      "task",
      "tasks",
      "todo",
      "calendar",
      "planner",
      "focus",
      "knowledge",
      "document",
      "journal",
      "inbox",
      "email",
      "pkm",
      "time tracking",
    ],
    utilities: [
      "utility",
      "utilities",
      "menu bar",
      "notch",
      "clipboard",
      "screenshot",
      "recorder",
      "screen recorder",
      "cleaner",
      "disk",
      "uninstaller",
      "audio",
      "whisper",
      "transcribe",
      "transcription",
      "battery",
      "window manager",
      "shortcut",
      "system",
      "storage",
      "finder",
    ],
  };

  for (const [cat, words] of Object.entries(keywords) as Array<
    ["developer-tools" | "design" | "productivity" | "utilities", string[]]
  >) {
    for (const w of words) {
      const regex = new RegExp(`\\b${w}\\b`, "gi");
      const matches = scoreText.match(regex);
      if (matches) {
        catScores[cat] += matches.length;
      }
    }
  }

  let bestCategory: "developer-tools" | "design" | "productivity" | "utilities" = "utilities";
  let maxScore = 0;
  for (const [cat, score] of Object.entries(catScores) as Array<
    ["developer-tools" | "design" | "productivity" | "utilities", number]
  >) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }

  // 8. X / Twitter handle extraction
  let xHandle = "";
  const twitterCreator = getMeta(["twitter:creator", "twitter:creator:id", "twitter:site", "twitter:site:id"]);
  if (twitterCreator) {
    xHandle = cleanXHandle(twitterCreator);
  }
  if (!xHandle) {
    const twitterLinkMatch = html.match(/href=["']https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]{1,30})["']/i);
    if (twitterLinkMatch && twitterLinkMatch[1]) {
      const candidate = twitterLinkMatch[1];
      const excluded = new Set(["home", "intent", "share", "search", "explore", "settings", "i", "hashtag", "privacy", "tos"]);
      if (!excluded.has(candidate.toLowerCase())) {
        xHandle = `@${candidate}`;
      }
    }
  }

  return {
    name: name.slice(0, 100),
    website: pageUrl,
    tagline: tagline.slice(0, 160),
    description: description.slice(0, 3000),
    icon: icon.slice(0, 400),
    demo: demo.slice(0, 400),
    pricing,
    category: bestCategory,
    ...(xHandle ? { xHandle } : {}),
  };
}

export function cleanXHandle(raw: string): string {
  let handle = raw.trim();
  if (!handle) return "";
  handle = handle.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, "");
  handle = handle.replace(/[/?#].*$/, "");
  handle = handle.replace(/^@+/, "");
  return handle ? `@${handle}` : "";
}

export async function fetchAppMetadata(rawUrl: string): Promise<FetchMetadataResult> {
  let targetUrl = rawUrl.trim();
  if (!targetUrl) {
    return { ok: false, error: "Please enter your app's website URL." };
  }

  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`;
  }

  const validatedUrl = publicUrl(targetUrl);
  if (!validatedUrl) {
    return {
      ok: false,
      error: "Please enter a valid, public website URL (e.g. https://yourapp.com). Local and internal IPs are not permitted.",
    };
  }

  try {
    const response = await fetch(validatedUrl.href, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 PickMacApps/1.0 (Metadata Fetcher)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Could not reach ${validatedUrl.hostname} (HTTP ${response.status}). Please check the URL or fill in details manually.`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return {
        ok: false,
        error: "The provided URL does not appear to return an HTML web page.",
      };
    }

    const rawHtml = await response.text();
    // Cap at 1.5MB to protect memory
    const html = rawHtml.slice(0, 1_500_000);

    const parsed = parseAppMetadataFromHtml(html, response.url || validatedUrl.href);

    return {
      ok: true,
      data: parsed,
      message: "App details successfully fetched from website! Please review and customize before submitting.",
    };
  } catch (err: unknown) {
    const isTimeout =
      (err && typeof err === "object" && "name" in err && err.name === "TimeoutError") ||
      (err instanceof Error && err.message.includes("timeout"));
    if (isTimeout) {
      return {
        ok: false,
        error: "Connecting to the website timed out (8 seconds). You can try again or enter details manually.",
      };
    }
    return {
      ok: false,
      error: "We couldn't connect to that website. Check the URL and try again, or enter details manually.",
    };
  }
}
