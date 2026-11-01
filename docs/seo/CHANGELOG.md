# Changelog

## 2026-10-31 — Social share card and app OG metadata fixes

Redesigned `/public/og.jpg` (1200×630, ~100 KB JPEG) to align with the latest PickMacApps UI (`Inter Tight` display headline `"A curated shelf of hand-picked  Mac apps."`, `Pick [P] MacApps` lockup, soft blue/indigo/violet/blush radial aura, frosted Editor’s Choice showcase card, and fanned macOS app squircles). Updated `src/routes/app/$slug.tsx` and `src/lib/seo.ts` so individual app pages use their `1200×630` cover screenshot (`app.demo`, when not an `.mp4` video) for `og:image` and `twitter:image`. Improved `fitDescription()` to strip trailing dangling articles/conjunctions (such as `"and a"` on `/app/shottr`) and expanded the default site description to 136 characters.

## 2026-10-18 — Crawl and honesty fixes

Added robots.txt and a sitemap, self-referencing canonicals, and real 404s for missing apps, categories, guides, and comparisons. App meta descriptions are a single line. Fake “Added” dates are no longer shown. Editor’s Choice is labeled as a paid placement. Unverified traffic promises, the October scarcity line, the Medium follower claim, and copied testimonials were removed from the submit page. Guides and category pages now link into the directory. A short privacy page covers the submit form.

Search Console was not submitted. The sitemap is ready for that later.

## 2026-10-18 — Full SEO audit, no page edits

Ran the SEOO pack. Findings and the decision to fix crawl and honesty issues before title polish are in `docs/seo/DECISIONS.md`. Search Console and Bing were not connected.
