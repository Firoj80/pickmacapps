import { createFileRoute, Link } from "@tanstack/react-router";
import { fetchOffer } from "@/lib/directory.fn";
import { crumbGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";

export const Route = createFileRoute("/sponsor")({
  loader: () => fetchOffer(),
  component: SponsorPage,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: pageCopy.sponsor.title,
      description: pageCopy.sponsor.description,
      ogTitle: "Feature Your Mac App on PickMacApps (7 Days)",
      ogDescription: pageCopy.sponsor.description,
      twitterTitle: "Feature Your Mac App on PickMacApps (7 Days)",
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

function BadgeCheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" fill="none" />
    </svg>
  );
}

function SponsorPage() {
  const offer = Route.useLoaderData();

  const rawDollars = Math.round((offer.articlePriceCents ?? 12000) / 100);
  const saleDollars = Math.round(rawDollars * 0.5);
  const salePrice = `$${saleDollars}`;
  const originalPrice = `$${rawDollars}`;

  return (
    <div className="mx-auto w-full max-w-[880px] px-6 md:px-10">
      <main className="pt-12 pb-8 md:pt-20">
        {/* Header / Intro matching macapp.supply */}
        <div className="max-w-[640px]">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5 text-[15px] font-semibold text-amber-500">
            <span className="inline-flex">
              <BadgeCheckIcon className="h-5 w-5 shrink-0 fill-amber-500 text-stone-950" />
            </span>
            Get featured
          </span>

          <h1 className="mt-5 font-display text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-ink md:text-[52px]">
            Feature your app for 7 days
          </h1>

          <p className="mt-5 text-[15px] leading-relaxed text-muted md:text-[16px]">
            PickMacApps is a hand-curated directory of{" "}
            <span className="text-ink">beautifully designed macOS apps</span>. A sponsorship puts your app in the
            hero spot at the top of the collection for a full 7 days — seen by designers, developers and Mac power users
            who come here specifically to find new software.
          </p>
        </div>

        {/* Main Placement Card matching macapp.supply */}
        <section className="mt-12 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 md:p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-stretch md:justify-between">
            <div className="flex-1">
              <h3 className="font-display text-[20px] font-bold tracking-tight text-ink md:text-[22px]">
                7-day featured placement
              </h3>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-[48px] font-bold leading-none tracking-tight text-ink md:text-[60px]">
                  {salePrice}
                </span>
                <span className="text-[18px] text-muted line-through font-medium">{originalPrice}</span>
                <span className="text-[16px] text-muted">/ 7 days</span>
              </div>

              <p className="mt-2 text-[14px] text-muted">One-time payment. No subscription, no hidden fees.</p>

              <ul className="mt-5 space-y-2">
                <li className="flex items-center gap-2 text-[14px]">
                  <span className="inline-flex">
                    <BadgeCheckIcon className="h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
                  </span>
                  <span className="text-ink">Premium Gold featured badge</span>
                </li>
                <li className="flex items-center gap-2 text-[14px]">
                  <span className="inline-flex">
                    <BadgeCheckIcon className="h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
                  </span>
                  <span className="text-ink">Approved within 2 hours</span>
                </li>
                <li className="flex items-center gap-2 text-[14px]">
                  <span className="inline-flex">
                    <BadgeCheckIcon className="h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
                  </span>
                  <span className="text-ink">Hero spot on the homepage</span>
                </li>
                <li className="flex items-center gap-2 text-[14px]">
                  <span className="inline-flex">
                    <BadgeCheckIcon className="h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
                  </span>
                  <span className="text-ink">Dedicated Medium review article & SEO backlink</span>
                </li>
                <li className="flex items-center gap-2 text-[14px]">
                  <span className="inline-flex">
                    <BadgeCheckIcon className="h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
                  </span>
                  <span className="text-ink">Newsletter & social mention on X</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col justify-center md:w-[280px]">
              <Link
                to="/submit"
                search={{ tier: "article", coupon: "BFCM50" }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3.5 text-[15px] font-semibold text-stone-950 transition hover:bg-amber-400 shadow-sm cursor-pointer"
              >
                Pay now — {salePrice}
                <span aria-hidden="true">↗</span>
              </Link>
              <p className="mt-3 text-center text-[12px] leading-relaxed text-muted">
                Secure checkout via Dodo Payments — USD, international cards & Apple Pay.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-line bg-surface/70 px-4 py-3 text-[13px] leading-relaxed text-ink">
            <span className="font-semibold text-amber-500">Black Friday 50% OFF applied.</span> {salePrice} is our special rate with code{" "}
            <strong className="font-mono text-amber-400">BFCM50</strong> (regular {originalPrice}). As directory traffic keeps climbing, the price goes up — lock in the current rate today and it applies to your full 7-day placement.
          </div>
        </section>

        {/* What's Included 2x2 Grid matching macapp.supply */}
        <section className="mt-14">
          <h2 className="font-display text-[22px] font-bold tracking-tight text-ink md:text-[26px]">
            What's included
          </h2>

          <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="flex gap-3">
              <span className="inline-flex">
                <BadgeCheckIcon className="mt-0.5 h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-ink">Premium featured badge</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">
                  Your listing carries the Gold verified badge everywhere it appears — homepage, category pages, search and the footer.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="inline-flex">
                <BadgeCheckIcon className="mt-0.5 h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-ink">Approved within 2 hours</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">
                  Skip the review queue entirely. We check your submission and put it live within 2 hours, usually much sooner.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="inline-flex">
                <BadgeCheckIcon className="mt-0.5 h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-ink">Hero spot & top placement</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">
                  Your app sits in the priority card at the top of the homepage and at the front of every list for the full 7 days.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="inline-flex">
                <BadgeCheckIcon className="mt-0.5 h-4 w-4 shrink-0 fill-amber-500 text-stone-950" />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-ink">Newsletter & social mention</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">
                  Featured apps are included in our subscriber update, reviewed in a dedicated Medium article, and shared on X when they go live.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works Section matching macapp.supply */}
        <section className="mt-14">
          <h2 className="font-display text-[22px] font-bold tracking-tight text-ink md:text-[26px]">
            How it works
          </h2>

          <ol className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted">
            <li className="flex gap-3.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-canvas">
                1
              </span>
              <span>Pay the {salePrice} sponsorship through secure checkout or submit your app directly.</span>
            </li>
            <li className="flex gap-3.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-canvas">
                2
              </span>
              <span>
                Send us your app details — or{" "}
                <Link className="text-ink underline underline-offset-4" to="/submit" search={{ tier: "article", coupon: "BFCM50" }}>
                  submit the app
                </Link>{" "}
                with the same email address you paid with.
              </span>
            </li>
            <li className="flex gap-3.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-canvas">
                3
              </span>
              <span>We review it by hand and publish it as featured within 2 hours.</span>
            </li>
            <li className="flex gap-3.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-canvas">
                4
              </span>
              <span>Your app keeps the hero spot and badge for 7 days, then stays listed permanently.</span>
            </li>
          </ol>
        </section>

        {/* Questions Section matching macapp.supply */}
        <section className="mt-14">
          <h2 className="font-display text-[22px] font-bold tracking-tight text-ink md:text-[26px]">
            Questions
          </h2>

          <div className="mt-6 divide-y divide-line border-y border-line">
            <div className="py-5">
              <h3 className="text-[15px] font-semibold text-ink">What exactly do I get for {salePrice}?</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
                A 7-day featured placement: the premium Gold badge, #1 priority hero spot on the homepage, top-of-list placement, a dedicated in-depth Medium review article, and social mentions on X. One-time payment, no subscription.
              </p>
            </div>

            <div className="py-5">
              <h3 className="text-[15px] font-semibold text-ink">What if my app isn't a good fit?</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
                We review every app by hand. If it doesn't meet our guidelines, you get a full refund — no questions asked.
              </p>
            </div>

            <div className="py-5">
              <h3 className="text-[15px] font-semibold text-ink">Do I need to submit the app first?</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
                Either order works. You can{" "}
                <Link className="text-ink underline underline-offset-4" to="/submit" search={{ tier: "article", coupon: "BFCM50" }}>
                  submit your app
                </Link>{" "}
                and complete checkout directly, or pay now and send details — we'll match them by email.
              </p>
            </div>

            <div className="py-5">
              <h3 className="text-[15px] font-semibold text-ink">What happens after 7 days?</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
                Your app stays listed in the directory forever. Only the featured placement and badge expire — you can renew any time at the then-current rate.
              </p>
            </div>
          </div>
        </section>

        {/* Ready to get featured CTA matching macapp.supply */}
        <section className="mt-14 rounded-2xl border border-line bg-surface-2/40 p-6 text-center md:p-8">
          <h2 className="font-display text-[22px] font-bold tracking-tight text-ink md:text-[26px]">
            Ready to get featured?
          </h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[14px] leading-relaxed text-muted">
            7 days in the hero spot, premium badge and 2-hour approval — for {salePrice} while the Black Friday rate lasts.
          </p>
          <Link
            to="/submit"
            search={{ tier: "article", coupon: "BFCM50" }}
            className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0071e3] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 shadow-sm cursor-pointer"
          >
            Pay now — {salePrice} for 7 days
            <span aria-hidden="true">↗</span>
          </Link>
          <p className="mt-3 text-[11px] text-muted">
            Questions first?{" "}
            <a className="text-ink underline underline-offset-4" href="https://x.com/hiii_firoj" target="_blank" rel="noopener noreferrer">
              Get in touch on X
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
