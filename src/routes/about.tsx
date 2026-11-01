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

      <section className="mt-8 flex items-start gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ink text-xl font-bold text-canvas shadow-md">
          FA
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-ink">Firoj Alam</h2>
          <p className="text-sm text-accent font-medium">Curator · Indie Developer · macOS Enthusiast</p>
          <p className="mt-3 text-sm leading-relaxed text-body">
            I build native macOS and iOS software and spend dozens of hours every month testing third-party utilities.
            PickMacApps is my personal workbench: a shelf of genuinely useful, high-craft Mac apps that respect user
            privacy and system resources.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Active macOS curation
            </span>
            <span>·</span>
            <span>Zero affiliate links</span>
            <span>·</span>
            <a href="mailto:firojalama80@gmail.com" className="text-ink underline underline-offset-2 hover:text-accent">
              firojalama80@gmail.com
            </a>
          </div>
        </div>
      </section>

      <article className="prose prose-neutral mt-10 space-y-6 text-[16px] leading-relaxed text-body">
        <h2 className="font-display text-2xl font-semibold text-ink">Why I Built PickMacApps</h2>
        <p>
          Searching for Mac apps has become deeply frustrating. Search results are dominated by sponsored listicles,
          bloated SEO content farms, and recurring subscription traps charging $50/year for basic menu bar toggles.
        </p>
        <p>
          Meanwhile, brilliant solo developers and indie studios build fast, focused macOS utilities with zero telemetry
          and transparent pricing—yet they struggle to get discovered.
        </p>
        <p>
          I started <strong>PickMacApps</strong> to provide an honest, clutter-free directory for Mac power users. Every
          app listed here is verified to run smoothly on Apple Silicon, respect system battery life, and solve a genuine
          everyday problem.
        </p>

        <h2 className="font-display mt-10 text-2xl font-semibold text-ink">What We Value in Mac Software</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Native Craft & Speed:</strong> Swift, AppKit, or lightweight SwiftUI that opens instantly, uses
            negligible idle CPU, and doesn’t spawn multiple Chromium helper processes.
          </li>
          <li>
            <strong>Fair Business Models:</strong> Open-source, generous free tiers, and honest one-time lifetime
            licenses. We actively celebrate developers who don’t rent their software.
          </li>
          <li>
            <strong>System Respect:</strong> Minimal permissions. A clipboard manager doesn’t need network access, and
            a menu bar utility shouldn’t ask for screen recording unless that is its core function.
          </li>
          <li>
            <strong>Notch & Menu Bar Ergonomics:</strong> Thoughtful integration with modern MacBook displays and
            external monitor setups.
          </li>
        </ul>

        <h2 className="font-display mt-10 text-2xl font-semibold text-ink">Editorial Integrity & Funding</h2>
        <p>
          PickMacApps does <strong>not</strong> use affiliate tracking links, third-party advertising networks, or
          pay-per-click banners.
        </p>
        <p>
          To cover hosting and continuous review hardware costs, we offer a strictly capped <strong>Editor’s Choice</strong>{" "}
          badge (limited to 3 slots max). An app cannot buy an Editor’s Choice placement unless it has already passed our
          rigorous editorial testing. You can read our complete review criteria in our{" "}
          <Link to="/how-we-pick" className="font-medium text-ink underline underline-offset-2 hover:text-accent">
            How We Pick methodology
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
