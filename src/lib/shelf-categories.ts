export type ShelfCategory = {
  slug: string;
  name: string;
  emoji: string;
  paragraphs: string[];
  tips: string[];
};

function category(slug: string, name: string, emoji: string): ShelfCategory {
  return {
    slug,
    name,
    emoji,
    paragraphs: [
      `${name} apps for Mac that are listed on PickMacApps. Each card is the app name, a short description, a pricing label, and a link to the developer.`,
    ],
    tips: ["Open the listing. The directory does not add claims that are not written on that card."],
  };
}

/** Same category shelf as the reference directory, in chip order. Stored on the server. */
export const shelfCategories: ShelfCategory[] = [
  category("productivity", "Productivity", "⚡"),
  category("video", "Video", "🎬"),
  category("utility", "Utility", "🔧"),
  category("ai", "AI", "✦"),
  category("writing", "Writing", "✍️"),
  category("dev", "Dev", "🛠️"),
  category("design", "Design", "🎨"),
  category("audio", "Audio", "🎧"),
  category("marketing", "Marketing", "📣"),
  category("photography", "Photography", "📷"),
  category("finance", "Finance", "💵"),
  category("lifestyle", "Lifestyle", "🌿"),
  category("business", "Business", "💼"),
  category("entertainment", "Entertainment", "🎮"),
  category("communication", "Communication", "💬"),
  category("analytics", "Analytics", "📊"),
];

export function normalizeCategorySlug(slug: string) {
  if (slug === "utilities") return "utility";
  if (slug === "developer-tools") return "dev";
  return slug;
}

export function findShelfCategory(slug: string) {
  const key = normalizeCategorySlug(slug);
  return shelfCategories.find((item) => item.slug === key);
}
