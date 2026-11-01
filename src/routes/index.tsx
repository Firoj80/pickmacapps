import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppGrid } from "@/components/app-grid";
import { OgPreviewModal } from "@/components/og-preview-modal";
import { AppleMark } from "@/components/site-header";
import { apps, shelfApps } from "@/lib/catalog";
import { homeGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { site } from "@/lib/site";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { q?: string; cat?: string } => {
    const next: { q?: string; cat?: string } = {};
    if (typeof search.q === "string" && search.q) next.q = search.q;
    if (typeof search.cat === "string" && search.cat && search.cat !== "all") next.cat = search.cat;
    return next;
  },
  component: Home,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const search = matches.at(-1)?.search as { q?: string; cat?: string } | undefined;
    const filtered = Boolean(search?.q || (search?.cat && search.cat !== "all"));
    const seo = buildMetadata({
      title: site.title,
      description: site.description,
      path: "/",
      origin,
    });
    const directory = matches[0]?.context.directory;
    const list = directory?.apps ?? apps;
    const script = jsonLdScript(homeGraph(origin, filtered ? null : shelfApps(list), homeFaqs));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

const homeFaqs = [
  {
    q: "What makes PickMacApps different from other Mac app directories?",
    a: "PickMacApps is personally curated by indie developer Firoj Alam. Every listed app is tested on physical Apple Silicon hardware for native speed, memory efficiency, transparent pricing, and privacy without forced subscriptions or bloated tracking.",
  },
  {
    q: "Are the Mac apps listed here free or paid?",
    a: "We feature free utilities, open-source software, freemium tools, and one-time paid apps. Each listing clearly marks pricing models (Free, Freemium, Paid Once, Subscription) so you never encounter hidden paywalls.",
  },
  {
    q: "How are Editor's Choice apps selected and vetted?",
    a: "Editor's Choice spots are limited to a maximum of 3 verified utilities at any time. Apps must pass our strict performance and utility review. Sponsored slots are explicitly disclosed in accordance with our editorial integrity guidelines.",
  },
  {
    q: "How can developers submit their Mac app for review?",
    a: "Developers can submit utilities via our submit page. Free listings require adding the PickMacApps badge to verify reciprocity. All submissions are manually evaluated before approval.",
  },
  {
    q: "Does PickMacApps use affiliate links or third-party ad trackers?",
    a: "No. We do not use third-party tracking cookies or affiliate links. Links take you directly to developer websites and official download sources.",
  },
];

function Home() {
  const { q = "", cat = "all" } = Route.useSearch();
  const navigate = useNavigate();
  const { directory } = Route.useRouteContext();
  const list = directory?.apps ?? apps;
  const [ogOpen, setOgOpen] = useState(false);

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-[1400px] px-5 pt-12 pb-20 md:px-10 md:pt-20 md:pb-28">
        <h1 className="rise max-w-5xl text-[42px] leading-[1.05] font-bold tracking-[-0.035em] text-ink md:text-[76px]">
          The Best Mac Apps, Hand-Picked
        </h1>
        <p className="rise mt-6 max-w-2xl text-lg text-body md:text-xl" style={{ animationDelay: "45ms" }}>
          A curated shelf of hand-picked Mac apps. Compare alternatives side by side and find the best Mac apps for your workflow without subscription fatigue.
        </p>
        <div className="rise mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: "90ms" }}>
          <a
            href="#apps"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-canvas transition hover:opacity-90"
          >
            <AppleMark className="h-[15px] w-[15px]" />
            Browse the collection
          </a>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-5 py-3 text-sm font-medium text-ink transition hover:bg-surface-2"
          >
            Submit an app
          </Link>
          <button
            type="button"
            onClick={() => setOgOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2/80 px-5 py-3 text-sm font-medium text-ink transition hover:bg-surface-2"
          >
            Preview social cards
          </button>
        </div>
      </section>

      <OgPreviewModal open={ogOpen} onClose={() => setOgOpen(false)} appList={list} />

      <div className="mx-auto w-full max-w-[1400px] px-5 py-10 md:px-10">
        <AppGrid
          apps={list}
          query={q}
          category={cat}
          onQuery={(value) => navigate({ to: "/", search: { q: value, cat } })}
          onCategory={(value) => navigate({ to: "/", search: { q, cat: value }, hash: "apps" })}
        />

        <section className="rise mt-24 border-t border-line pt-12" style={{ animationDelay: "40ms" }}>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-accent uppercase">Buying Guides</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Guides & Comparisons</h2>
            </div>
            <Link to="/blog" className="text-sm font-medium text-accent hover:underline">
              All guides →
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted">
            In-depth comparisons and curated breakdowns to help you choose the right tools.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/blog/$slug"
              params={{ slug: "must-have-mac-apps-2026" }}
              className="group rounded-2xl border border-line bg-surface p-6 transition hover:border-ink/20"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Essential Utilities</span>
              <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-accent">
                must have mac apps
              </h3>
              <p className="mt-2 text-sm text-body">
                Essential utilities for screenshots, menu bar, clipboard, voice, writing, and disk.
              </p>
            </Link>
            <Link
              to="/blog/$slug"
              params={{ slug: "best-free-mac-apps" }}
              className="group rounded-2xl border border-line bg-surface p-6 transition hover:border-ink/20"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Free & Open</span>
              <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-accent">
                best free mac apps
              </h3>
              <p className="mt-2 text-sm text-body">
                Verified zero-cost utilities and generous tiers without forced subscriptions.
              </p>
            </Link>
            <Link
              to="/blog/$slug"
              params={{ slug: "best-clipboard-manager-mac" }}
              className="group rounded-2xl border border-line bg-surface p-6 transition hover:border-ink/20"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Clipboard</span>
              <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-accent">
                best clipboard manager for Mac
              </h3>
              <p className="mt-2 text-sm text-body">
                Compare Tucket, Clippio, and Maclip on encryption, notch access, and one-time pricing.
              </p>
            </Link>
            <Link
              to="/blog/$slug"
              params={{ slug: "best-notes-app-mac" }}
              className="group rounded-2xl border border-line bg-surface p-6 transition hover:border-ink/20"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Writing</span>
              <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-accent">
                best notes app for Mac
              </h3>
              <p className="mt-2 text-sm text-body">
                Structured knowledge bases versus focused markdown drafting with Anytype and iA Writer.
              </p>
            </Link>
            <Link
              to="/blog/$slug"
              params={{ slug: "best-mac-disk-space-analyzer" }}
              className="group rounded-2xl border border-line bg-surface p-6 transition hover:border-ink/20"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Disk Tools</span>
              <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-accent">
                mac disk space analyzer
              </h3>
              <p className="mt-2 text-sm text-body">
                ScanMyDisk, Mole, Bytesweep, and Plumby compared for visualizing disk usage.
              </p>
            </Link>
            <Link
              to="/blog/$slug"
              params={{ slug: "best-bartender-alternative-mac" }}
              className="group rounded-2xl border border-line bg-surface p-6 transition hover:border-ink/20"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Menu Bar</span>
              <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-accent">
                bartender alternative
              </h3>
              <p className="mt-2 text-sm text-body">
                ClearBar and Lounge for icon management, plus Alcove for notch alerts.
              </p>
            </Link>
            <Link
              to="/blog/$slug"
              params={{ slug: "best-notch-apps-mac" }}
              className="group rounded-2xl border border-line bg-surface p-6 transition hover:border-ink/20"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Notch Tools</span>
              <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-accent">
                notch app mac
              </h3>
              <p className="mt-2 text-sm text-body">
                Alcove, NotchDodo, Droppy, Lounge, and Tucket turning the cutout into a productivity hub.
              </p>
            </Link>
          </div>
        </section>

        {/* Visible Homepage FAQ Section */}
        <section className="rise mt-24 border-t border-line pt-12" style={{ animationDelay: "60ms" }}>
          <div>
            <p className="text-xs font-semibold tracking-wider text-accent uppercase">Answers & Transparency</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Frequently Asked Questions</h2>
            <p className="mt-2 text-sm text-muted">
              Everything you need to know about our curation methodology, business model, and app submissions.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {homeFaqs.map((faq, index) => (
              <details
                key={index}
                className="group rounded-2xl border border-line bg-surface p-6 transition-colors open:bg-surface-2"
              >
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-ink list-none">
                  <span className="text-base">{faq.q}</span>
                  <span className="ml-4 shrink-0 text-muted transition group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-body">{faq.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5 text-sm">
            <span className="text-muted">
              Have questions about how we evaluate apps? Read our full review criteria.
            </span>
            <Link to="/how-we-pick" className="font-semibold text-accent hover:underline">
              Editorial standards & policy →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
