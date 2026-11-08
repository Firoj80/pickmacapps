export type TrafficSource =
  | "google"
  | "bing"
  | "x"
  | "threads"
  | "reddit"
  | "producthunt"
  | "hacker_news"
  | "direct"
  | "bot"
  | "other";

export function isBotUserAgent(ua: string): boolean {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  const botKeywords = [
    "bot",
    "crawl",
    "spider",
    "slurp",
    "mediapartners",
    "headless",
    "lighthouse",
    "pagespeed",
    "ptst",
    "chrome-lighthouse",
    "inspection",
    "facebookexternalhit",
    "twitterbot",
    "telegrambot",
    "whatsapp",
    "discordbot",
    "slackbot",
    "applebot",
    "bingbot",
    "googlebot",
    "duckduckbot",
    "yandex",
    "baiduspider",
    "bytespider",
    "gptbot",
    "chatgpt",
    "anthropic",
    "claude",
  ];
  return botKeywords.some((keyword) => lower.includes(keyword));
}

export function classifyReferrer(refUrl: string, ua = ""): TrafficSource {
  if (isBotUserAgent(ua)) {
    return "bot";
  }

  const clean = refUrl.trim().toLowerCase();
  if (!clean) return "direct";

  let host = "";
  try {
    host = new URL(clean).hostname.replace(/^www\./, "");
  } catch {
    return "direct";
  }

  // Internal navigation from own domains
  if (
    host.includes("pickmacapps") ||
    host.includes("picmacapps") ||
    host.includes("localhost") ||
    host.includes("127.0.0.1")
  ) {
    return "direct";
  }

  if (host.includes("google.")) return "google";
  if (host.includes("bing.") || host.includes("msn.")) return "bing";
  if (host.includes("t.co") || host.includes("twitter.com") || host.includes("x.com")) return "x";
  if (host.includes("threads.net") || host.includes("instagram.com")) return "threads";
  if (host.includes("reddit.com") || host.includes("redd.it")) return "reddit";
  if (host.includes("producthunt.com")) return "producthunt";
  if (host.includes("news.ycombinator.com")) return "hacker_news";

  return "other";
}

export const TRAFFIC_SOURCE_LABELS: Record<TrafficSource, { label: string; icon: string }> = {
  direct: { label: "Direct / Internal", icon: "🔗" },
  google: { label: "Google Search", icon: "🔍" },
  bing: { label: "Bing Search", icon: "🌐" },
  x: { label: "X (Twitter)", icon: "🐦" },
  threads: { label: "Threads / Instagram", icon: "🧵" },
  reddit: { label: "Reddit", icon: "💬" },
  producthunt: { label: "Product Hunt", icon: "🐱" },
  hacker_news: { label: "Hacker News", icon: "🔶" },
  bot: { label: "Bot / Crawler (Lighthouse/GSC)", icon: "🤖" },
  other: { label: "Other Referral", icon: "🌍" },
};
