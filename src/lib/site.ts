/** Facts shared by the HTML head, markdown, llms.txt, and ai.txt. */
export const site = {
  name: "PickMacApps",
  title: "Best Mac Apps (2026): Hand-Picked Utilities | PickMacApps",
  description:
    "Hand-picked best Mac apps for 2026. Browse utilities by job, compare alternatives side by side, and read short buying guides.",
  logoPath: "/favicon.svg",
  ogImage: "/og-v2.jpg",
  ogImageAlt: "PickMacApps: Best Mac Apps, Hand-Picked",
  ogImageWidth: "1200",
  ogImageHeight: "630",
  policyUpdated: "2026-10-27",
} as const

export const pageCopy = {
  guides: {
    title: "Guides",
    description:
      "Hand-researched guides to the best Mac apps. Each one compares a popular Mac app with the apps on this shelf.",
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
      "Our testing criteria, conflict of interest policy, and review methodology for recommending Mac software.",
  },
  notFound: {
    title: "Page not found",
    description:
      "That page isn't part of the PickMacApps directory. The link may be old, or the app or guide was never listed.",
  },
} as const
