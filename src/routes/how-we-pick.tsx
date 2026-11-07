import { createFileRoute, Link } from "@tanstack/react-router";
import { howWePickGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";

export const Route = createFileRoute("/how-we-pick")({
  component: HowWePickPage,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: pageCopy.howWePick.title,
      description: pageCopy.howWePick.description,
      path: "/how-we-pick",
      origin,
    });
    const script = jsonLdScript(howWePickGraph(origin));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/how-we-pick")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function HowWePickPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
        <Link to="/" className="transition-colors hover:text-ink">
          Home
        </Link>
        <span>/</span>
        <span className="text-ink">Listing Guidelines</span>
      </nav>

      <header className="border-b border-line pb-8">
        <p className="text-[12px] font-semibold tracking-[0.16em] text-accent uppercase">Editorial Guidelines</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">
          How We Review & Select Mac Apps
        </h1>
        <p className="mt-4 text-lg text-body">
          How a listing gets on the shelf, and what Editor’s Choice means. This page does not describe a lab test.
        </p>
      </header>

      <article className="prose prose-neutral mt-10 space-y-8 text-[16px] leading-relaxed text-body">
        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">How a listing gets on the shelf</h2>
          <p className="mt-3">
            Apps are added by hand. A listing shows the name, a short description, a pricing label, and a link to the
            developer. This page does not claim a timed lab test, a fixed number of hours, or that every app is an Apple
            Silicon build. If a fact is not in the directory, the guide leaves it out.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="text-base font-semibold text-ink">1. What a listing contains</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">
                A published listing shows the name, a short description, a pricing label, a category, and a link to the
                developer. If a price, feature, or system requirement is not in that listing, the guides leave it out.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="text-base font-semibold text-ink">2. Pricing labels</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">
                The label is Free, Freemium, or Paid. A dollar amount is included only when the listing records one.
                The directory does not claim that every paid app is a one-time purchase. Voicera Pro, for example, was
                listed as a subscription.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="text-base font-semibold text-ink">3. Editor’s Choice is paid</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">
                The price is the one on the submit page. A published app with that label is a paid placement, capped at
                3 apps. The label is not a test score, and it is not a claim that the app was timed or audited.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="text-base font-semibold text-ink">4. Free submissions</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">
                A free listing needs the PickMacApps badge on the app’s site before it can be sent. A person then
                reviews the submission. Nothing goes live from the form alone. A free listing’s link back to the
                developer is nofollow. An Editor’s Choice link is not.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="text-base font-semibold text-ink">5. What this page does not claim</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">
                It does not claim a timed test, a fixed number of hours, an Activity Monitor reading, a permission
                audit, or that every app is an Apple silicon build. Those facts are included only when a listing says
                them.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Commercial Disclosures & Editor’s Choice</h2>
          <p className="mt-3">How the site is paid for:</p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>
              <strong>No affiliate links.</strong> Listing links go to the developer. The site does not add an affiliate
              code.
            </li>
            <li>
              <strong>Free listings</strong> are reviewed after the badge is on the app’s site. Inclusion is a published
              directory row, not a score.
            </li>
            <li>
              <strong>Editor’s Choice is paid.</strong> The price is the one on the submit page. At most 3 published apps
              can have the label. The label is not a test score.
            </li>
          </ul>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Have a Suggestion or Correction?</h2>
          <p className="mt-3">
            If a price or a feature on a listing looks wrong, email{" "}
            <Link to="/about" className="font-medium text-ink underline underline-offset-2">
              Firoj Alam
            </Link>{" "}
            at{" "}
            <a href="mailto:firojalama80@gmail.com" className="text-ink underline underline-offset-2">
              firojalama80@gmail.com
            </a>
            . Say which sentence looks wrong.
          </p>
        </section>
      </article>
    </main>
  );
}
