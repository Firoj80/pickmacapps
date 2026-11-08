import { site } from "@/lib/site";
import type { AppItem, Post } from "@/lib/catalog";
import type { ComparePair } from "@/lib/compare";

type Json = string | number | boolean | Json[] | { [key: string]: Json };

function clean(value: unknown): Json | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) {
    const items = value.map(clean).filter((item): item is Json => item !== undefined);
    return items.length > 0 ? items : undefined;
  }
  if (typeof value === "object") {
    const out: { [key: string]: Json } = {};
    for (const [key, item] of Object.entries(value)) {
      const next = clean(item);
      if (next !== undefined) out[key] = next;
    }
    return out;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return undefined;
}

export function absoluteUrl(origin: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const base = origin.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function orgId(origin: string) {
  return `${origin.replace(/\/$/, "")}/#organization`;
}

function siteId(origin: string) {
  return `${origin.replace(/\/$/, "")}/#website`;
}

function organizationNode(origin: string) {
  return {
    "@type": "Organization",
    "@id": orgId(origin),
    name: site.name,
    url: absoluteUrl(origin, "/"),
    logo: absoluteUrl(origin, site.logoPath),
  };
}

function websiteNode(origin: string, withSearch: boolean, description?: string) {
  return {
    "@type": "WebSite",
    "@id": siteId(origin),
    name: site.name,
    url: absoluteUrl(origin, "/"),
    description: description || site.description,
    publisher: { "@id": orgId(origin) },
    hasPart: [
      {
        "@type": "SiteNavigationElement",
        name: "Sponsor",
        description: "Feature your macOS app on PickMacApps for 30 days",
        url: absoluteUrl(origin, "/sponsor"),
      },
      {
        "@type": "SiteNavigationElement",
        name: "Submit an app",
        description: "Submit your beautifully designed macOS app to PickMacApps",
        url: absoluteUrl(origin, "/submit"),
      },
      {
        "@type": "SiteNavigationElement",
        name: "Browse by category",
        description: "Browse every macOS app on the shelf, sorted into categories",
        url: absoluteUrl(origin, "/category"),
      },
      {
        "@type": "SiteNavigationElement",
        name: "Listing Guidelines",
        description: "PickMacApps is a curated directory of beautifully designed macOS apps",
        url: absoluteUrl(origin, "/how-we-pick"),
      },
      {
        "@type": "SiteNavigationElement",
        name: "Productivity",
        description: "Discover the best productivity apps for Mac",
        url: absoluteUrl(origin, "/category/productivity"),
      },
    ],
    ...(withSearch
      ? {
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${absoluteUrl(origin, "/")}?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }
      : {}),
  };
}

function breadcrumbNode(origin: string, pagePath: string, crumbs: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(origin, pagePath)}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(origin, crumb.path),
    })),
  };
}

function itemListNode(origin: string, pagePath: string, items: { name: string; path: string }[]) {
  return {
    "@type": "ItemList",
    "@id": `${absoluteUrl(origin, pagePath)}#list`,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(origin, item.path),
    })),
  };
}

function graph(origin: string, nodes: unknown[]) {
  if (!origin) return null;
  const data = clean({ "@context": "https://schema.org", "@graph": nodes });
  return data && typeof data === "object" && !Array.isArray(data) ? data : null;
}

export function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function jsonLdScript(data: object | null) {
  if (!data) return null;
  return { type: "application/ld+json" as const, children: serializeJsonLd(data) };
}

export function homeGraph(
  origin: string,
  apps: { name: string; slug: string }[] | null,
  faqs?: { q: string; a: string }[],
  copy?: { name: string; description: string },
) {
  const pageName = copy?.name ?? "The Best Mac Apps, Hand-Picked";
  const nodes: unknown[] = [
    organizationNode(origin),
    websiteNode(origin, true, copy?.description),
    breadcrumbNode(origin, "/", [{ name: "Home", path: "/" }]),
  ];
  if (apps) {
    const items = apps.map((app) => ({ name: app.name, path: `/app/${app.slug}` }));
    nodes.push(
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl(origin, "/")}#page`,
        name: pageName,
        url: absoluteUrl(origin, "/"),
        isPartOf: { "@id": siteId(origin) },
        mainEntity: { "@id": `${absoluteUrl(origin, "/")}#list` },
      },
      itemListNode(origin, "/", items),
    );
  }
  if (faqs && faqs.length > 0) {
    nodes.push(faqNode(origin, "/", faqs));
  }
  return graph(origin, nodes);
}

function appImages(app: AppItem) {
  const images = [app.icon];
  if (app.demo && !app.demo.endsWith(".mp4")) images.push(app.demo);
  return images;
}

export function appGraph(origin: string, app: AppItem) {
  const path = `/app/${app.slug}`;
  return graph(origin, [
    organizationNode(origin),
    breadcrumbNode(origin, path, [
      { name: "Home", path: "/" },
      { name: app.categoryName, path: `/category/${app.category}` },
      { name: app.name, path },
    ]),
    {
      "@type": "SoftwareApplication",
      "@id": `${absoluteUrl(origin, path)}#app`,
      name: app.name,
      description: app.description.replace(/\s+/g, " ").trim(),
      applicationCategory: app.categoryName,
      operatingSystem: "macOS",
      image: appImages(app),
      url: absoluteUrl(origin, path),
      ...(app.pricing === "free" ? { offers: { "@type": "Offer", price: 0, priceCurrency: "USD" } } : {}),
    },
  ]);
}

export function guideGraph(origin: string, post: Post, faqs?: { q: string; a: string }[]) {
  const path = `/blog/${post.slug}`;
  const nodes: unknown[] = [
    organizationNode(origin),
    breadcrumbNode(origin, path, [
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: post.title, path },
    ]),
    {
      "@type": "Article",
      "@id": `${absoluteUrl(origin, path)}#article`,
      headline: post.title,
      description: post.excerpt,
      image: [absoluteUrl(origin, site.ogImage)],
      datePublished: post.date,
      dateModified: post.date,
      inLanguage: "en",
      url: absoluteUrl(origin, path),
      mainEntityOfPage: absoluteUrl(origin, path),
      author: {
        "@type": "Person",
        name: "Firoj Alam",
        url: absoluteUrl(origin, "/about"),
        jobTitle: "Indie Hacker & Mac/iOS App Developer",
        description: "Indie hacker and Mac and iOS app developer who curates Mac apps on PickMacApps.",
      },
      publisher: {
        "@type": "Organization",
        name: site.name,
        url: absoluteUrl(origin, "/"),
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl(origin, site.logoPath),
        },
      },
    },
  ];
  if (faqs && faqs.length > 0) {
    nodes.push(faqNode(origin, path, faqs));
  }
  return graph(origin, nodes);
}

export function guidesGraph(origin: string, posts: Post[]) {
  const path = "/blog";
  return graph(origin, [
    organizationNode(origin),
    websiteNode(origin, false),
    breadcrumbNode(origin, path, [
      { name: "Home", path: "/" },
      { name: "Guides", path },
    ]),
    {
      "@type": "CollectionPage",
      "@id": `${absoluteUrl(origin, path)}#page`,
      name: "Guides",
      url: absoluteUrl(origin, path),
      isPartOf: { "@id": siteId(origin) },
      mainEntity: { "@id": `${absoluteUrl(origin, path)}#list` },
    },
    itemListNode(
      origin,
      path,
      posts.map((post) => ({ name: post.title, path: `/blog/${post.slug}` })),
    ),
  ]);
}

export function categoriesHubGraph(
  origin: string,
  categories: { slug: string; name: string }[],
) {
  const path = "/category";
  return graph(origin, [
    organizationNode(origin),
    websiteNode(origin, false),
    breadcrumbNode(origin, path, [
      { name: "Home", path: "/" },
      { name: "Browse by category", path },
    ]),
    {
      "@type": "CollectionPage",
      "@id": `${absoluteUrl(origin, path)}#page`,
      name: "Browse macOS Apps by Category",
      url: absoluteUrl(origin, path),
      isPartOf: { "@id": siteId(origin) },
      mainEntity: { "@id": `${absoluteUrl(origin, path)}#list` },
    },
    itemListNode(
      origin,
      path,
      categories.map((c) => ({ name: `${c.name} Mac Apps`, path: `/category/${c.slug}` })),
    ),
  ]);
}

export function categoryGraph(
  origin: string,
  category: { name: string; slug: string },
  apps: { name: string; slug: string }[],
  faqs?: { q: string; a: string }[],
) {
  const path = `/category/${category.slug}`;
  const name = `${category.name} Mac Apps`;
  const nodes: unknown[] = [
    organizationNode(origin),
    websiteNode(origin, false),
    breadcrumbNode(origin, path, [
      { name: "Home", path: "/" },
      { name, path },
    ]),
    {
      "@type": "CollectionPage",
      "@id": `${absoluteUrl(origin, path)}#page`,
      name,
      url: absoluteUrl(origin, path),
      isPartOf: { "@id": siteId(origin) },
      mainEntity: { "@id": `${absoluteUrl(origin, path)}#list` },
    },
    itemListNode(
      origin,
      path,
      apps.map((app) => ({ name: app.name, path: `/app/${app.slug}` })),
    ),
  ];
  if (faqs && faqs.length > 0) {
    nodes.push(faqNode(origin, path, faqs));
  }
  return graph(origin, nodes);
}

function faqNode(origin: string, path: string, faqs: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(origin, path)}#faq`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

export function compareHubGraph(
  origin: string,
  pairs: { name: string; slug: string }[],
  faqs: { q: string; a: string }[],
) {
  const path = "/compare";
  return graph(origin, [
    organizationNode(origin),
    breadcrumbNode(origin, path, [
      { name: "Home", path: "/" },
      { name: "Comparisons", path },
    ]),
    {
      "@type": "CollectionPage",
      "@id": `${absoluteUrl(origin, path)}#page`,
      name: "Mac app comparisons",
      url: absoluteUrl(origin, path),
      mainEntity: { "@id": `${absoluteUrl(origin, path)}#list` },
    },
    itemListNode(
      origin,
      path,
      pairs.map((pair) => ({ name: pair.name, path: `/compare/${pair.slug}` })),
    ),
    faqNode(origin, path, faqs),
  ]);
}

export function compareGraph(
  origin: string,
  pair: ComparePair,
  faqs: { q: string; a: string }[],
) {
  const path = `/compare/${pair.slug}`;
  const name = `${pair.left.name} vs ${pair.right.name}`;
  return graph(origin, [
    organizationNode(origin),
    breadcrumbNode(origin, path, [
      { name: "Home", path: "/" },
      { name: "Comparisons", path: "/compare" },
      { name, path },
    ]),
    {
      "@type": "CollectionPage",
      "@id": `${absoluteUrl(origin, path)}#page`,
      name,
      url: absoluteUrl(origin, path),
      mainEntity: { "@id": `${absoluteUrl(origin, path)}#list` },
    },
    itemListNode(origin, path, [
      { name: pair.left.name, path: `/app/${pair.left.slug}` },
      { name: pair.right.name, path: `/app/${pair.right.slug}` },
    ]),
    faqNode(origin, path, faqs),
  ]);
}

export function crumbGraph(origin: string, path: string, name: string) {
  return graph(origin, [
    breadcrumbNode(origin, path, [
      { name: "Home", path: "/" },
      { name, path },
    ]),
  ]);
}

export function aboutGraph(origin: string) {
  const path = "/about";
  return graph(origin, [
    organizationNode(origin),
    breadcrumbNode(origin, path, [
      { name: "Home", path: "/" },
      { name: "About", path },
    ]),
    {
      "@type": "AboutPage",
      "@id": `${absoluteUrl(origin, path)}#page`,
      name: "About PickMacApps & Curator Firoj Alam",
      url: absoluteUrl(origin, path),
      description: "Indie hacker and Mac and iOS app developer who curates Mac apps on PickMacApps.",
      mainEntity: {
        "@type": "Person",
        "@id": `${absoluteUrl(origin, path)}#author`,
        name: "Firoj Alam",
        url: absoluteUrl(origin, path),
        jobTitle: "Indie Hacker & Mac/iOS App Developer",
        description: "Indie hacker and Mac and iOS app developer who curates Mac apps on PickMacApps.",
        email: "mailto:firojalama80@gmail.com",
        worksFor: { "@id": orgId(origin) },
      },
    },
  ]);
}

export function howWePickGraph(origin: string) {
  const path = "/how-we-pick";
  return graph(origin, [
    organizationNode(origin),
    breadcrumbNode(origin, path, [
      { name: "Home", path: "/" },
      { name: "Listing Guidelines", path },
    ]),
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl(origin, path)}#page`,
      name: "Listing Guidelines & Editorial Policy | PickMacApps",
      url: absoluteUrl(origin, path),
      description:
        "PickMacApps is a curated directory of beautifully designed macOS apps. Review our editorial policy, review criteria, and listing guidelines.",
    },
  ]);
}

