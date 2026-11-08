/** Facts shared by the HTML head, markdown, llms.txt, and ai.txt. */
export const site = {
  name: "PickMacApps",
  title: "PickMacApps — Beautifully designed macOS apps, curated",
  description:
    "A hand-picked shelf of beautifully designed macOS apps. Discover thoughtfully crafted tools, utilities, and indie software for your Mac.",
  logoPath: "/favicon.svg",
  ogImage: "/og-v2.jpg",
  ogImageAlt: "PickMacApps — Beautifully designed macOS apps, curated",
  ogImageWidth: "1200",
  ogImageHeight: "630",
  policyUpdated: "2026-10-27",
} as const;

export const pageCopy = {
  guides: {
    title: "Guides — PickMacApps",
    description:
      "Short guides that name apps already in this directory. Each one compares a popular Mac app with the apps on this shelf.",
  },
  submit: {
    title: "Submit an app — PickMacApps",
    description:
      "Submit your beautifully designed macOS app to PickMacApps. Hand-reviewed directory for indie developers and tools.",
  },
  privacy: {
    title: "Privacy — PickMacApps",
    description:
      "What the PickMacApps submit form collects, and what it does not. It is used only to reply about a listing and it is not sold.",
  },
  about: {
    title: "About PickMacApps & Firoj Alam",
    description: "Indie hacker and Mac and iOS app developer who curates Mac apps on PickMacApps.",
  },
  howWePick: {
    title: "Listing Guidelines — PickMacApps",
    description:
      "PickMacApps is a curated directory of beautifully designed macOS apps. Review our editorial policy, review criteria, and listing guidelines.",
  },
  sponsor: {
    title: "Sponsor — PickMacApps",
    description:
      "Feature your macOS app on PickMacApps for 30 days. Reach thousands of active Mac power users, developers, and creators.",
  },
  categories: {
    title: "Browse by category — PickMacApps",
    description:
      "Browse by category. Every macOS app on the shelf, sorted into Productivity, Utility, Video, AI, Dev, and Design.",
  },
  notFound: {
    title: "Page not found",
    description:
      "That page isn't part of the PickMacApps directory. The link may be old, or the app or guide was never listed.",
  },
} as const;
