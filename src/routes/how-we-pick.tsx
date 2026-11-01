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
        <span className="text-ink">How we pick</span>
      </nav>

      <header className="border-b border-line pb-8">
        <p className="text-[12px] font-semibold tracking-[0.16em] text-accent uppercase">Editorial Guidelines</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">
          How We Review & Select Mac Apps
        </h1>
        <p className="mt-4 text-lg text-body">
          Our testing criteria, conflict of interest policy, and review methodology for recommending Mac software.
        </p>
      </header>

      <article className="prose prose-neutral mt-10 space-y-8 text-[16px] leading-relaxed text-body">
        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">The 5-Pillar Testing Framework</h2>
          <p className="mt-3">
            Every application featured on PickMacApps is personally downloaded, installed, and evaluated on physical Apple
            Silicon hardware (M-series MacBooks and desktop Macs) running the latest versions of macOS. We evaluate tools
            across five core criteria:
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="text-base font-semibold text-ink">1. Performance & Memory Footprint</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">
                Background utilities should feel invisible. We monitor Activity Monitor for idle RAM consumption, CPU
                spikes, and background wakeups. We heavily favor lightweight Swift/AppKit builds over multi-process
                Electron wrappers for simple status bar or clipboard tasks.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="text-base font-semibold text-ink">2. Permission Hygiene & Privacy</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">
                We inspect macOS Privacy & Security permissions (Accessibility, Screen Recording, Full Disk Access). An app
                must only request permissions strictly essential to its advertised function. Apps that send unencrypted
                clipboard or keystroke telemetry to third-party tracking servers are immediately rejected.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="text-base font-semibold text-ink">3. Transparent, Fair Pricing</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">
                We clearly label each app as <strong>Free</strong>, <strong>Freemium</strong>, <strong>Paid Once</strong>,
                or <strong>Subscription</strong>. We highlight tools with lifetime licenses and transparent trial terms,
                and flag aggressive recurring paywalls.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="text-base font-semibold text-ink">4. macOS Ergonomics & Design Craft</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">
                We look for craftsmanship: seamless notch integration, respectful menu bar overflow management, native
                dark mode support, responsive keyboard shortcuts, and clean settings panels that follow Apple Human
                Interface Guidelines.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="text-base font-semibold text-ink">5. Maintenance & Compatibility</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">
                We verify that developers actively maintain their software for recent macOS releases (Sonoma, Sequoia, and
                beyond), with clear change logs and responsive support channels.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Commercial Disclosures & Editor’s Choice</h2>
          <p className="mt-3">
            Independence and reader trust are paramount. Here is exactly how PickMacApps operates financially:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>
              <strong>Zero Affiliate Links:</strong> We do not use Amazon, Setapp, or third-party affiliate networks. Every
              link points directly to the developer’s official website or App Store page.
            </li>
            <li>
              <strong>Free Listings:</strong> Indie developers can submit their tools for free review. Inclusion is based
              purely on quality and utility.
            </li>
            <li>
              <strong>Editor’s Choice Policy:</strong> Developers may purchase an Editor’s Choice placement ($99 one-time).
              However, <em>payment does not guarantee inclusion</em>. An app must first pass our complete 5-pillar editorial
              review. If an app fails our performance or privacy review, the fee is refunded and the app is not featured.
            </li>
            <li>
              <strong>Strict Slot Caps:</strong> Editor’s Choice placements are capped at a maximum of 3 active spots to
              prevent directory pollution and maintain genuine curation value.
            </li>
          </ul>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Have a Suggestion or Correction?</h2>
          <p className="mt-3">
            If you notice an app has changed its pricing model, added unwanted telemetry, or stopped receiving updates,
            please reach out to curator{" "}
            <Link to="/about" className="font-medium text-ink underline underline-offset-2">
              Firoj Alam
            </Link>{" "}
            at{" "}
            <a href="mailto:firojalama80@gmail.com" className="text-ink underline underline-offset-2">
              firojalama80@gmail.com
            </a>
            . We update listings and buying guides promptly to maintain accurate recommendations.
          </p>
        </section>
      </article>
    </main>
  );
}
