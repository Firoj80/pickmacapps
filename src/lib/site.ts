/** Facts shared by the HTML head, markdown, llms.txt, and ai.txt. */
export const site = {
  name: "PickMacApps",
  title: "PickMacApps — Mac apps worth installing",
  description: "A curated shelf of Mac apps. Browse by category, compare alternatives, and read short guides.",
  logoPath: "/favicon.svg",
  ogImage: "/og.jpg",
  ogImageAlt: "PickMacApps, a curated shelf of Mac apps",
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
  notFound: {
    title: "Page not found",
    description:
      "That page isn't part of the PickMacApps directory. The link may be old, or the app or guide was never listed.",
  },
} as const
