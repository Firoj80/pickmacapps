import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { fetchOffer } from "@/lib/directory.fn";
import { crumbGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";

const featured = [
  "Blue verified featured badge 🔹",
  "Approved within 24 hours",
  "Top hero spot for 30 days",
  "Permanent listing in directory",
  "Social shoutout to Mac enthusiasts",
];

const story = [
  "Golden verified choice badge 🌟",
  "⚡ Approved within 2 hours (Express)",
  "#1 priority hero spot for 30 days",
  "Dedicated in-depth Medium review article",
  "High-authority SEO backlink to your app",
  "Permanent listing in directory",
  "Social shoutout to Mac enthusiasts",
  "Priority placement across alternative tables",
];

export const Route = createFileRoute("/sponsor")({
  loader: () => fetchOffer(),
  component: SponsorPage,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: pageCopy.sponsor.title,
      description: pageCopy.sponsor.description,
      ogTitle: "Feature Your Mac App on PickMacApps (30 Days)",
      ogDescription: pageCopy.sponsor.description,
      twitterTitle: "Feature Your Mac App on PickMacApps (30 Days)",
      twitterDescription: pageCopy.sponsor.description,
      path: "/sponsor",
      origin,
    });
    const script = jsonLdScript(crumbGraph(origin, "/sponsor", "Sponsor"));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/sponsor")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function SponsorPage() {
  const offer = Route.useLoaderData();
  const featuredPrice = ((offer.featuredPriceCents ?? offer.priceCents) / 100).toFixed(0);
  const articlePrice = ((offer.articlePriceCents ?? 12000) / 100).toFixed(0);

  return (
    <main className="relative overflow-hidden">
      {/* Background ambient colorful glowing orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[550px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-violet-600/20 via-fuchsia-500/20 to-amber-400/20 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 -z-10 h-[450px] w-[500px] rounded-full bg-gradient-to-bl from-cyan-500/15 via-indigo-500/15 to-transparent blur-[120px]" />

      {/* Hero Header Section */}
      <section className="mx-auto max-w-[1240px] px-4 pt-12 pb-6 text-center sm:px-6 md:pt-16 md:pb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
          Reach 15,000+ Mac Enthusiasts & Power Users
        </div>

        <h1 className="mt-5 text-[38px] font-bold tracking-tight text-ink sm:text-[56px] md:text-[64px] leading-[1.08]">
          Put your Mac app in the{" "}
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
            Spotlight
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-body sm:text-[18px]">
          Get immediate visibility, high-intent traffic, and trusted editorial placement on PickMacApps. 
          Limited to only 6 featured hero slots at a time.
        </p>

        {/* Live Metrics Bar */}
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3 rounded-2xl border border-line bg-surface/80 p-3 sm:p-4 backdrop-blur-xl shadow-sm text-center">
          <div>
            <p className="text-lg sm:text-2xl font-bold text-ink tracking-tight">2h – 24h</p>
            <p className="text-[11px] sm:text-[12px] text-muted">Review turnaround</p>
          </div>
          <div className="border-x border-line px-1 sm:px-2">
            <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent tracking-tight">Top 6</p>
            <p className="text-[11px] sm:text-[12px] text-muted">Hero spots capped</p>
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-bold text-ink tracking-tight">100%</p>
            <p className="text-[11px] sm:text-[12px] text-muted">Curated guarantee</p>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-8 max-w-4xl mx-auto">
          {/* Card 1: Featured */}
          <div className="relative flex flex-col justify-between rounded-3xl border border-line bg-surface/90 p-7 sm:p-9 shadow-lg backdrop-blur-xl transition hover:border-violet-500/40 hover:shadow-xl">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-ink">Featured Placement</h3>
                  <p className="text-sm text-muted mt-0.5">Homepage hero and featured badge</p>
                </div>
                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
                  Popular
                </span>
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight text-ink">${featuredPrice}</span>
                <span className="text-sm font-medium text-muted">one-time payment</span>
              </div>

              <p className="mt-2 text-xs text-muted">No recurring fees. App stays listed permanently.</p>

              <hr className="my-6 border-line" />

              <ul className="space-y-3.5 text-sm">
                {featured.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-body">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 text-xs font-bold">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/submit"
              search={{ tier: "featured" }}
              className="mt-8 flex w-full items-center justify-center rounded-2xl border border-line-2 bg-surface hover:bg-surface-2 py-3.5 text-sm font-semibold text-ink shadow-sm transition-all hover:scale-[1.01]"
            >
              Get Featured — ${featuredPrice}
            </Link>
          </div>

          {/* Card 2: Featured + Article (Vibrant Gradient Card) */}
          <div className="relative flex flex-col justify-between rounded-3xl border-2 border-fuchsia-500/70 bg-gradient-to-b from-[#181228] to-[#110e1c] p-7 sm:p-9 text-white shadow-2xl transition hover:shadow-fuchsia-500/20">
            {/* Glowing Accent Ribbon */}
            <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-4 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-md">
              Best Exposure 🔥
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Featured + Medium Article</h3>
                  <p className="text-sm text-fuchsia-200/80 mt-0.5">Maximum reach & organic SEO backlinks</p>
                </div>
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight text-white">${articlePrice}</span>
                <span className="text-sm font-medium text-fuchsia-200/70">one-time payment</span>
              </div>

              <p className="mt-2 text-xs text-fuchsia-200/60">Complete package with full editorial story.</p>

              <hr className="my-6 border-white/10" />

              <ul className="space-y-3.5 text-sm">
                {story.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white/90">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-amber-400 text-white text-xs font-bold shadow-xs">
                      ✓
                    </span>
                    <span className={item.includes("Medium") || item.includes("2 hours") ? "font-semibold text-amber-300" : ""}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/submit"
              search={{ tier: "article" }}
              className="mt-8 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-95 hover:scale-[1.01]"
            >
              Claim Spot + Article — ${articlePrice} 🚀
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Breakdown Grid */}
      <section className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">What is included with sponsorship</h2>
          <p className="mt-2 text-sm text-muted">Everything designed to drive qualified Mac users to your product</p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          <FeatureCard
            icon="🏆"
            title="Editor's Choice Badge"
            description="Your card receives the verified Editor's Choice badge, establishing instant trust with high-intent buyers."
          />
          <FeatureCard
            icon="⚡"
            title="Fast Review (2h - 24h)"
            description="Skip the general queue. Featured listings are evaluated in 24 hours, and the Featured + Medium package is approved within 2 hours."
          />
          <FeatureCard
            icon="🌟"
            title="Homepage Hero Carousel"
            description="Your app icon appears in the curved hero arc at the very top of the homepage, seen by every visitor."
          />
          <FeatureCard
            icon="📣"
            title="Social Media Broadcast"
            description="Shoutout from @hiii_firoj on X (Twitter) directly reaching an audience of founders, builders, and developers."
          />
          <FeatureCard
            icon="✍️"
            title="Medium Profile Deep-Dive"
            description="With the $120 tier, receive a comprehensive dedicated review article published on Firoj's Medium profile."
          />
          <FeatureCard
            icon="🔗"
            title="Permanent Listing & SEO"
            description="Even after the hero spotlight rotation, your dedicated app review page stays live permanently with dofollow link."
          />
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="border-t border-line/60 bg-surface/40 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink text-center">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-3">
            <Faq q="What is the difference between the packages?">
              The ${featuredPrice} tier gives you the Blue featured badge, 24h review, top hero placement for 30 days, and a social shoutout. The ${articlePrice} tier gives you the Golden Editor's Choice badge, express approval within 2 hours, top priority #1 hero spot for 30 days, plus a dedicated in-depth editorial article on Firoj’s Medium profile, generating enduring search traffic and high-authority backlinks.
            </Faq>
            <Faq q="What if my app isn't accepted?">
              All apps are inspected manually to ensure quality standards. If for any reason an app is not a fit for our directory, you will not be charged or will be refunded promptly.
            </Faq>
            <Faq q="Do I need to submit the app first or pay first?">
              You can start right from the packages above. You will be guided through entering your app name, URL, screenshot, and details before checkout.
            </Faq>
            <Faq q="How long does the hero spotlight last?">
              Featured apps hold the top hero spot and featured placement across the directory for a full 30 days, capped at 6 active apps to ensure each sponsor receives prime visibility. After 30 days, your app stays listed permanently in the directory.
            </Faq>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs transition hover:border-line-2 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-xl">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-body">{description}</p>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface p-5 transition open:bg-surface-2">
      <summary className="flex cursor-pointer items-center justify-between font-medium text-ink list-none">
        <span className="text-[15px]">{q}</span>
        <span className="ml-4 shrink-0 text-muted transition-transform group-open:rotate-180">
          ↓
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-body">{children}</p>
    </details>
  );
}
