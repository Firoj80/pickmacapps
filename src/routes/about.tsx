import { createFileRoute, Link } from "@tanstack/react-router";
import { aboutGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: pageCopy.about.title,
      description: pageCopy.about.description,
      path: "/about",
      origin,
    });
    const script = jsonLdScript(aboutGraph(origin));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/about")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
        <Link to="/" className="transition-colors hover:text-ink">
          Home
        </Link>
        <span>/</span>
        <span className="text-ink">About</span>
      </nav>

      <header className="border-b border-line pb-8">
        <p className="text-[12px] font-semibold tracking-[0.16em] text-accent uppercase">About the Curator</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">
          Firoj Alam & PickMacApps
        </h1>
        <p className="mt-4 text-lg text-body">
          Indie hacker and Mac and iOS app developer who curates Mac apps on PickMacApps.
        </p>
      </header>

      <section className="mt-8 flex flex-col sm:flex-row items-start gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <img
          src="/firoj.jpg"
          alt="Firoj Alam"
          loading="lazy"
          decoding="async"
          width={64}
          height={64}
          className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-md"
        />
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-ink">Firoj Alam</h2>
          <p className="text-sm text-accent font-medium">Curator · Indie Developer · macOS Enthusiast</p>
          <p className="mt-3 text-sm leading-relaxed text-body">
            I build Mac and iOS apps. PickMacApps is the directory I keep of other people’s Mac apps, with a short
            description and a link to each developer.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Active macOS curation
            </span>
            <span>·</span>
            <span>No affiliate links</span>
            <span>·</span>
            <a href="mailto:firojalama80@gmail.com" className="text-ink underline underline-offset-2 hover:text-accent">
              firojalama80@gmail.com
            </a>
          </div>
        </div>
      </section>

      <article className="prose prose-neutral mt-10 space-y-6 text-[16px] leading-relaxed text-body">
        <h2 className="font-display text-2xl font-semibold text-ink">What PickMacApps is</h2>
        <p>
          PickMacApps is a directory of Mac apps. I run it. A listing is a name, a description, a pricing label, and a
          link to the developer. The site is not affiliated with Apple Inc.
        </p>
        <p>
          ScanMyDisk is built by the author of this site. When that app is on a page, the page says so. Editor’s Choice
          on that listing, or any other, is a paid placement. It is not a test score. At most 3 published apps can have
          the label. The price is the one on the submit page.
        </p>

        <h2 className="font-display mt-10 text-2xl font-semibold text-ink">What a page will not claim</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>A timed test, a number of hours spent, or a reading from Activity Monitor.</li>
          <li>That every app is an Apple silicon build, or that every paid app is free of a subscription.</li>
          <li>A feature, a dollar price, or an encryption detail that the app’s own listing does not record.</li>
        </ul>

        <h2 className="font-display mt-10 text-2xl font-semibold text-ink">How the site is paid for</h2>
        <p>
          Listing links go to the developer. The site does not add an affiliate code. There are no pay-per-click
          banners on the directory.
        </p>
        <p>
          To pay for the site, Editor’s Choice is a paid placement. Read{" "}
          <Link to="/how-we-pick" className="font-medium text-ink underline underline-offset-2 hover:text-accent">
            how we pick
          </Link>
          .
        </p>

        <div className="mt-12 rounded-xl border border-line bg-surface p-6">
          <h3 className="text-base font-semibold text-ink">Get in Touch or Suggest an App</h3>
          <p className="mt-2 text-sm text-muted">
            Have a question, feedback, or a Mac utility you’d like us to evaluate? Email me directly at{" "}
            <a href="mailto:firojalama80@gmail.com" className="text-ink underline underline-offset-2">
              firojalama80@gmail.com
            </a>{" "}
            or submit via our{" "}
            <Link to="/submit" className="text-ink underline underline-offset-2">
              submission portal
            </Link>
            .
          </p>
        </div>
      </article>
    </main>
  );
}
