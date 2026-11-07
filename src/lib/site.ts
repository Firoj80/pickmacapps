/** Facts shared by the HTML head, markdown, llms.txt, and ai.txt. */
export const site = {
  name: "PickMacApps",
  title: "PickMacApps — Mac apps worth installing",
  description: "A curated shelf of Mac apps. Browse by category, compare alternatives, and read short guides.",
  logoPath: "/favicon.svg",
  ogImage: "/og-v2.jpg",
  ogImageAlt: "PickMacApps — Mac apps worth installing",
  ogImageWidth: "1200",
  ogImageHeight: "630",
  policyUpdated: "2026-10-27",
} as const

export const pageCopy = {
  guides: {
    title: "Guides",
    description:
      "Short guides that name apps already in this directory. Each one compares a popular Mac app with the apps on this shelf.",
  },
  submit: {
    title: "Submit Your Mac App",
    description: "Submit your Mac app to the PickMacApps directory. Editor’s Choice is labeled on the listing.",
  },
  privacy: {
    title: "Privacy",
    description:
      "What the PickMacApps submit form collects, and what it does not. It is used only to reply about a listing and it is not sold.",
  },
  about: {
    title: "About PickMacApps & Firoj Alam",
    description: "Indie hacker and Mac and iOS app developer who curates Mac apps on PickMacApps.",
  },
  howWePick: {
    title: "How We Pick Mac Apps — Editorial Policy",
    description:
      "Apps are added by hand. Editor’s Choice is a paid placement, not a test score. Listings link to the developer.",
  },
  sponsor: {
    title: "Sponsor a Mac App Listing | PickMacApps",
    description:
      "Feature a Mac app on PickMacApps. Two one-time placements: $99, or $120 with a special Medium article.",
  },
  notFound: {
    title: "Page not found",
    description:
      "That page isn't part of the PickMacApps directory. The link may be old, or the app or guide was never listed.",
  },
} as const
