import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { crumbGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";

const featured = [
  "Premium featured badge",
  "Approved within 24 hours",
  "Hero spot on the homepage",
  "Social mention",
];

const story = [...featured, "Special article on my Medium profile"];

export const Route = createFileRoute("/sponsor")({
  component: SponsorPage,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: pageCopy.sponsor.title,
      description: pageCopy.sponsor.description,
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
  return (
    <main>
      <section className="mx-auto grid max-w-[1100px] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div>
          <p className="text-[13px] font-medium text-muted">Sponsor</p>
          <h1 className="mt-3 max-w-[16ch] text-[40px] leading-[1.05] font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
            Feature your app
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-7 text-body">
            PickMacApps is a hand-picked shelf of Mac apps. A sponsorship puts your app in a hero spot on the homepage,
            with a premium featured badge, after it is reviewed.
          </p>
          <dl className="mt-10 space-y-6">
            <Included title="Premium featured badge" body="The listing is marked as a paid featured placement, not a test score." />
            <Included title="Approved within 24 hours" body="A submitted app is reviewed by hand. A listing that is accepted is published within 24 hours." />
            <Included title="Hero spot on the homepage" body="Featured apps are the icons and cards at the top of the shelf. At most 3 published apps hold that spot." />
            <Included title="Social mention" body="A mention from @hiii_firoj on X when the app is published." />
            <Included title="Medium article" body="The $120 package also includes a special article on Firoj’s Medium profile." />
          </dl>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Plan
            name="Featured"
            price={99}
            items={featured}
            tier="featured"
            note="One-time. No subscription."
          />
          <Plan
            name="Featured + article"
            price={120}
            items={story}
            tier="article"
            highlighted
            note="One-time. Includes the Medium article."
          />
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1100px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">How it works</h2>
            <ol className="mt-6 space-y-4 text-[15px] leading-6 text-body">
              <li>1. Choose a package and continue to the submit page.</li>
              <li>2. Send the app details. You can also submit first, then come back to this page.</li>
              <li>3. The app is reviewed by hand. An accepted listing is published within 24 hours.</li>
              <li>4. The app keeps the featured badge and a hero spot, then stays listed.</li>
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">Questions</h2>
            <div className="mt-6 space-y-3">
              <Faq q="What is the difference between the two prices?">
                $99 includes the premium badge, 24-hour review, a hero spot, and a social mention. $120 includes those and a special article on Firoj’s Medium profile.
              </Faq>
              <Faq q="What if my app isn’t a good fit?">
                Every app is reviewed by hand. If it is not accepted, it is not published. The listing rules are on{" "}
                <Link to="/how-we-pick" className="text-ink underline underline-offset-2">
                  How we pick
                </Link>
                .
              </Faq>
              <Faq q="Do I need to submit the app first?">
                Either order works. Start here, or{" "}
                <Link to="/submit" className="text-ink underline underline-offset-2">
                  submit the app
                </Link>{" "}
                and choose the package after.
              </Faq>
              <Faq q="What happens after the featured spot?">
                The app stays in the directory. The premium badge and hero spot are the paid placement, capped at 3 published apps.
              </Faq>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-4 py-14 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">Ready to get featured?</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-6 text-body">
              Premium badge, hero spot, and a social mention. Add a Medium article for $120.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/submit"
              search={{ tier: "featured" }}
              className="inline-flex items-center justify-center rounded-full border border-line px-5 py-3 text-sm font-medium text-ink hover:bg-surface-2"
            >
              Continue — $99
            </Link>
            <Link
              to="/submit"
              search={{ tier: "article" }}
              className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-canvas hover:opacity-90"
            >
              Continue — $120
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Plan({
  name,
  price,
  items,
  tier,
  note,
  highlighted = false,
}: {
  name: string;
  price: number;
  items: string[];
  tier: "featured" | "article";
  note: string;
  highlighted?: boolean;
}) {
  return (
    <article className={`rounded-3xl border p-6 ${highlighted ? "border-ink bg-ink text-canvas" : "border-line bg-canvas text-ink"}`}>
      <p className={`text-[13px] font-medium ${highlighted ? "text-white/70" : "text-muted"}`}>{name}</p>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-[-0.04em]">${price}</span>
        <span className={`text-sm ${highlighted ? "text-white/70" : "text-muted"}`}>one-time</span>
      </p>
      <p className={`mt-2 text-[13px] ${highlighted ? "text-white/70" : "text-muted"}`}>{note}</p>
      <ul className="mt-6 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[14px] leading-5">
            <span aria-hidden="true">✓</span>
            {item}
          </li>
        ))}
      </ul>
      <Link
        to="/submit"
        search={{ tier }}
        className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-medium ${
          highlighted ? "bg-white text-[#1d1d1f]" : "bg-ink text-canvas"
        }`}
      >
        Continue — ${price}
      </Link>
    </article>
  );
}

function Included({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <dt className="text-[15px] font-medium text-ink">{title}</dt>
      <dd className="mt-1 text-[14px] leading-6 text-body">{body}</dd>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="rounded-2xl border border-line px-4 py-3">
      <summary className="cursor-pointer text-[15px] font-medium text-ink">{q}</summary>
      <p className="mt-2 text-[14px] leading-6 text-body">{children}</p>
    </details>
  );
}
