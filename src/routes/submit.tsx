import { useEffect, useState } from "react";
import { CheckIcon, ChevronIcon, QuoteIcon, SparklesIcon, SpinnerIcon } from "@/components/icons";
import { verifyBadge } from "@/lib/badge";
import { shelfCategories } from "@/lib/shelf-categories";
import { fetchAppMetadataFn, fetchOffer, submitListingFn } from "@/lib/directory.fn";
import { trackGoal, identifyUser, getAttribution, appendAttributionToUrl } from "@/lib/analytics";
import { crumbGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";
import { createFileRoute, Link } from "@tanstack/react-router";

export type SubmitSearch = {
  tier?: "featured" | "article";
  submitted?: string;
  payment_id?: string;
  subscription_id?: string;
  status?: string;
};

export const Route = createFileRoute("/submit")({
  validateSearch: (search: Record<string, unknown>): SubmitSearch => ({
    tier: search.tier === "featured" || search.tier === "article" ? search.tier : undefined,
    submitted: search.submitted ? String(search.submitted) : undefined,
    payment_id: search.payment_id ? String(search.payment_id) : undefined,
    subscription_id: search.subscription_id ? String(search.subscription_id) : undefined,
    status: search.status ? String(search.status) : undefined,
  }),
  loader: () => fetchOffer(),
  component: SubmitPage,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: pageCopy.submit.title,
      description: pageCopy.submit.description,
      ogTitle: "Submit Your macOS App — PickMacApps Directory",
      ogDescription: pageCopy.submit.description,
      twitterTitle: "Submit Your macOS App — PickMacApps Directory",
      twitterDescription: pageCopy.submit.description,
      path: "/submit",
      origin,
    });
    const script = jsonLdScript(crumbGraph(origin, "/submit", "Submit an app"));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/submit")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

const checks = [
  { label: "Your app is functional", desc: "Runs reliably on modern macOS (Sonoma & Sequoia)" },
  { label: "It delivers what it promises", desc: "Real utility built for Mac users, not a web wrapper" },
  { label: "Is not an infoproduct", desc: "Software apps only (no courses, ebooks, or spam)" },
];

const testimonials = [
  {
    quote: "I liked this idea of sharing Mac Apps made by indie hackers so I've submitted my one to be listed here 😊",
    name: "Paweł Karniej",
    role: "Indie Mac App Developer",
    initials: "PK",
    avatarBg: "bg-indigo-600",
  },
  {
    quote: "Looks solid! Thanks for including LocalCan 💜",
    name: "Jarek",
    role: "Founder, LocalCan",
    initials: "JK",
    avatarBg: "bg-purple-600",
  },
  {
    quote: "Thanks for including both Klack and Alcove!",
    name: "Henrik",
    role: "Founder, Klack & Alcove",
    initials: "HA",
    avatarBg: "bg-emerald-600",
  },
  {
    quote: "great to see lookaway in the list! thank you for including it",
    name: "kush",
    role: "Founder, Lookaway",
    initials: "KL",
    avatarBg: "bg-amber-600",
  },
];

const faqs = [
  {
    q: "Do I need to put a badge on my site if I buy a featured spot?",
    a: "No! Featured ($99) and Article ($120) sponsor tiers do NOT require any badge. Badges are strictly required for 100% free community listings.",
  },
  {
    q: "Is this a recurring subscription or a one-time payment?",
    a: "100% one-time. After your 30-day top rotation on the directory, your app remains listed in the catalog permanently at no ongoing charge.",
  },
  {
    q: "How fast will my app be reviewed and live?",
    a: "Gold Article tier submissions are reviewed within 2 hours. Blue Featured tier submissions are approved within 24 hours. Free community submissions are reviewed in 3–5 business days.",
  },
  {
    q: "Can I update my app details, screenshots, or tagline later?",
    a: "Yes! Every developer receives a private submitter dashboard link after submission to edit their listing details anytime.",
  },
];

const field =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-muted focus:border-accent focus:outline-none";

function Radio({ selected }: { selected: boolean }) {
  return (
    <div
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected ? "border-ink bg-ink" : "border-stone-300 bg-white"
      }`}
    >
      {selected ? <div className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
    </div>
  );
}

function SubmitPage() {
  const offer = Route.useLoaderData();
  const search = Route.useSearch();
  const { tier, payment_id, submitted } = search;

  const featuredPrice = ((offer.featuredPriceCents ?? offer.priceCents) / 100).toFixed(0);
  const featuredCompare = ((offer.featuredCompareCents ?? offer.compareCents) / 100).toFixed(0);
  const articlePrice = ((offer.articlePriceCents ?? 12000) / 100).toFixed(0);
  const articleCompare = ((offer.articleCompareCents ?? 24900) / 100).toFixed(0);

  const featuredSlots = offer.featuredSlots ?? {
    total: 3,
    active: 0,
    remaining: 3,
    isFull: false,
    nextDate: offer.slots?.nextDate ?? "30 days",
  };
  const articleSlots = offer.articleSlots ?? {
    total: 3,
    active: 0,
    remaining: 3,
    isFull: false,
    nextDate: offer.slots?.nextDate ?? "30 days",
  };

  // Free plan is default selected unless a specific paid tier is explicitly requested in search params
  const [selectedPlan, setSelectedPlan] = useState<"free" | "featured" | "article">(() => {
    if (tier === "article" && !articleSlots.isFull) return "article";
    if (tier === "featured" && !featuredSlots.isFull) return "featured";
    return "free";
  });

  const isPaid = selectedPlan === "featured" || selectedPlan === "article";
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [copied, setCopied] = useState(false);
  const [badgeVariant, setBadgeVariant] = useState<"logo" | "classic" | "dark">("logo");
  const [badge, setBadge] = useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [badgeMessage, setBadgeMessage] = useState("");
  const [sent, setSent] = useState(() => Boolean(submitted || payment_id));
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (payment_id) {
      trackGoal("payment_completed", { payment_id, status: search.status ?? "success" });
      setSent(true);
    }
  }, [payment_id, search.status]);

  // App details form state (editable & populated by auto-fetch)
  const [website, setWebsite] = useState("");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [demo, setDemo] = useState("");
  const [pricing, setPricing] = useState<"free" | "freemium" | "paid">("free");
  const [category, setCategory] = useState("productivity");
  const [email, setEmail] = useState("");
  const [xHandle, setXHandle] = useState("");

  // Auto-fetch status
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<"idle" | "success" | "error">("idle");
  const [fetchMessage, setFetchMessage] = useState("");
  const [alreadyListed, setAlreadyListed] = useState<{
    id: string;
    name: string;
    slug: string;
    isPaid?: boolean;
    tier?: string | null;
  } | null>(null);

  const currentPrice = selectedPlan === "article" ? articlePrice : featuredPrice;
  const isSelectedTierFull =
    (selectedPlan === "featured" && featuredSlots.isFull) ||
    (selectedPlan === "article" && articleSlots.isFull);

  // Canonical website URL for badge embeds
  const siteOrigin = "https://pickmacapps.store";

  const badgeFile =
    badgeVariant === "classic"
      ? "badge-classic.svg"
      : badgeVariant === "dark"
        ? "badge-dark.svg"
        : "badge.svg";

  const badgeSrc = `${siteOrigin}/${badgeFile}`;
  const badgeHtml = `<a href="${siteOrigin}" target="_blank" rel="noopener">
  <img
    src="${badgeSrc}"
    alt="Featured on PickMacApps"
    width="200"
    height="54"
  />
</a>`;

  const hasEmail = Boolean(email.trim() && email.includes("@"));
  const hasXHandle = Boolean(xHandle.trim());
  const badgeOk = isPaid || badge === "ok";
  const canSubmit = Boolean(hasEmail && hasXHandle && (!isPaid || !isSelectedTierFull) && badgeOk && !sending);

  async function copyBadge() {
    try {
      await navigator.clipboard.writeText(badgeHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleAutoFetch() {
    const target = website.trim();
    if (!target) {
      setFetchStatus("error");
      setFetchMessage("Please enter your app's website URL first.");
      return;
    }
    setFetching(true);
    setFetchStatus("idle");
    setFetchMessage("");

    try {
      const result = await fetchAppMetadataFn({ data: { url: target } });
      if (result.alreadyListed) {
        setAlreadyListed(result.alreadyListed);
      } else {
        setAlreadyListed(null);
      }
      if (result.ok) {
        const data = result.data;
        if (data.name) setName(data.name);
        if (data.website) setWebsite(data.website);
        if (data.tagline) setTagline(data.tagline);
        if (data.description) setDescription(data.description);
        if (data.icon) setIcon(data.icon);
        if (data.demo) setDemo(data.demo);
        if (data.pricing) setPricing(data.pricing);
        if (data.category) setCategory(data.category);
        if (data.xHandle && !xHandle) setXHandle(data.xHandle);

        setFetchStatus("success");
        setFetchMessage(
          result.alreadyListed
            ? `Found existing listing for ${result.alreadyListed.name}! Details auto-filled. Submitting will update your listing.`
            : "Details extracted from your website! You can review or tweak anything below.",
        );
      } else {
        setFetchStatus("error");
        setFetchMessage(result.error);
      }
    } catch {
      setFetchStatus("error");
      setFetchMessage("Could not fetch details from that URL. Check the URL and try again, or enter details manually.");
    } finally {
      setFetching(false);
    }
  }

  async function checkBadge() {
    const targetUrl = website.trim();
    if (!targetUrl) {
      setBadge("fail");
      setBadgeMessage("Please enter your website URL first.");
      return;
    }
    setBadge("checking");
    setBadgeMessage("");
    try {
      const result = await verifyBadge({ data: { url: targetUrl } });
      setBadge(result.ok ? "ok" : "fail");
      setBadgeMessage(result.message);
    } catch {
      setBadge("fail");
      setBadgeMessage("We couldn't reach that page. Check the URL and try again.");
    }
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:py-12">
        {sent ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-8 text-center shadow-xs">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckIcon className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              {alreadyListed ? "Update received!" : "Submission received!"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-body">
              {alreadyListed ? (
                <>
                  Thank you for submitting an update for <strong>{name || alreadyListed.name}</strong>. We’ll review and apply your updates to your live listing (<a href={`/app/${alreadyListed.slug}`} target="_blank" rel="noreferrer" className="underline font-medium hover:text-ink">/app/{alreadyListed.slug}</a>).
                </>
              ) : (
                <>
                  Thank you for submitting your app. We’ll review your listing details and send confirmation to{" "}
                  <strong>{email}</strong>.
                </>
              )}
            </p>
            <button
              type="button"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-canvas hover:opacity-90 cursor-pointer"
              onClick={() => {
                setSent(false);
                setBadge("idle");
                setBadgeMessage("");
                setFetchStatus("idle");
                setFetchMessage("");
                setWebsite("");
                setName("");
                setTagline("");
                setDescription("");
                setIcon("");
                setDemo("");
                setEmail("");
                setXHandle("");
              }}
            >
              Submit another app
            </button>
          </div>
        ) : (
          <div>
            {/* Header Hero */}
            <div className="mx-auto max-w-3xl text-center mb-8 sm:mb-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent uppercase tracking-wider mb-2.5">
                Mac App Directory Submission
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink">
                Submit Your Mac App
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-body max-w-xl mx-auto leading-relaxed">
                Join 250+ hand-picked macOS apps. Choose between free reciprocal community listing or guaranteed top spot visibility.
              </p>
            </div>

            {/* 2-Column Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left Column: Form, Intent Selection, Checklist & CTA */}
              <div className="lg:col-span-7 xl:col-span-7 space-y-5">
                {/* 3-Plan Selector Strip: Free on Left (Default), Blue in Middle, Gold on Right */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider">
                      Select Your Plan
                    </label>
                    <span className="text-[11px] text-muted">
                      {isPaid ? "✨ No badge required" : "🔄 Reciprocal badge required"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* 1. Free Community (Left - Default Selected) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlan("free");
                        trackGoal("select_plan", { plan: "free" });
                      }}
                      className={`relative flex flex-col justify-between rounded-2xl p-3.5 text-left border-2 transition-all cursor-pointer ${
                        selectedPlan === "free"
                          ? "border-ink bg-stone-50/90 shadow-xs ring-1 ring-ink/10"
                          : "border-line bg-surface hover:border-stone-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="rounded-md bg-stone-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-700">
                            Community
                          </span>
                          <Radio selected={selectedPlan === "free"} />
                        </div>
                        <div className="mt-2 font-display text-2xl font-extrabold text-ink">$0</div>
                        <div className="text-xs font-bold text-ink mt-0.5">Free Listing</div>
                      </div>
                      <div className="mt-2.5 text-[11px] text-muted leading-tight">
                        Reciprocal badge required
                      </div>
                    </button>

                    {/* 2. Blue Featured ($99 - Middle) */}
                    <button
                      type="button"
                      disabled={featuredSlots.isFull}
                      onClick={() => {
                        if (!featuredSlots.isFull) {
                          setSelectedPlan("featured");
                          trackGoal("select_plan", { plan: "featured" });
                        }
                      }}
                      className={`relative flex flex-col justify-between rounded-2xl p-3.5 text-left border-2 transition-all ${
                        featuredSlots.isFull
                          ? "border-line bg-stone-100 opacity-60 cursor-not-allowed"
                          : selectedPlan === "featured"
                            ? "border-sky-500 bg-sky-50/50 shadow-xs ring-1 ring-sky-500/30 cursor-pointer"
                            : "border-line bg-surface hover:border-sky-300 cursor-pointer"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800">
                            🔹 Blue Tier
                          </span>
                          <Radio selected={selectedPlan === "featured"} />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="font-display text-2xl font-extrabold text-ink">${featuredPrice}</span>
                          <span className="text-xs text-muted line-through">${featuredCompare}</span>
                        </div>
                        <div className="text-xs font-bold text-ink mt-0.5">Featured Spot</div>
                      </div>
                      <div className="mt-2.5 text-[11px] text-muted leading-tight">
                        Top 6 spot · No badge
                      </div>
                    </button>

                    {/* 3. Gold Article ($120 - Right) */}
                    <button
                      type="button"
                      disabled={articleSlots.isFull}
                      onClick={() => {
                        if (!articleSlots.isFull) {
                          setSelectedPlan("article");
                          trackGoal("select_plan", { plan: "article" });
                        }
                      }}
                      className={`relative flex flex-col justify-between rounded-2xl p-3.5 text-left border-2 transition-all ${
                        articleSlots.isFull
                          ? "border-line bg-stone-100 opacity-60 cursor-not-allowed"
                          : selectedPlan === "article"
                            ? "border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500/30 cursor-pointer"
                            : "border-line bg-surface hover:border-amber-300 cursor-pointer"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="rounded-md bg-gradient-to-r from-amber-500 to-fuchsia-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            🌟 Gold Tier
                          </span>
                          <Radio selected={selectedPlan === "article"} />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="font-display text-2xl font-extrabold text-ink">${articlePrice}</span>
                          <span className="text-xs text-muted line-through">${articleCompare}</span>
                        </div>
                        <div className="text-xs font-bold text-ink mt-0.5">Top Spot + Article</div>
                      </div>
                      <div className="mt-2.5 text-[11px] text-muted leading-tight">
                        #1 Spot + Medium review
                      </div>
                    </button>
                  </div>
                </div>

                {/* Pricing / Plan Details Card (Matching Reference Design) */}
                <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
                  {selectedPlan === "free" ? (
                    <>
                      {/* Free Community Details */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">
                            Community Free Tier
                          </span>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-200 text-stone-700">
                            <CheckIcon className="h-3 w-3" />
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-baseline gap-2">
                          <span className="font-display text-3xl font-extrabold text-ink">$0</span>
                          <span className="text-xs text-muted">free forever</span>
                        </div>

                        <div className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                          * Requires PickMacApps backlink badge on your website landing page
                        </div>
                      </div>

                      <ul className="space-y-2.5 text-xs text-body pt-1">
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-600" />
                          <span>
                            <strong className="text-ink font-semibold">Permanent directory catalog listing</strong> in category & search
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-600" />
                          <span>
                            <strong className="text-ink font-semibold">Standard dofollow catalog backlink</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600">⚠️</span>
                          <span>
                            <strong className="text-ink font-semibold">Reciprocal badge required</strong> on your landing page before approval
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600">⏳</span>
                          <span>Standard manual review queue (3–5 business days)</span>
                        </li>
                      </ul>
                    </>
                  ) : selectedPlan === "featured" ? (
                    <>
                      {/* Blue Featured Details */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                            Editor's Choice · 🔹 Blue Verified
                          </span>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                            <CheckIcon className="h-3 w-3" />
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-baseline gap-2">
                          <span className="font-display text-3xl font-extrabold text-ink">${featuredPrice}</span>
                          <span className="text-sm text-muted line-through">${featuredCompare}</span>
                          <span className="text-xs text-muted">one-time</span>
                        </div>

                        {/* Scarcity Signal (Live Spot Counter) */}
                        <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>
                            {featuredSlots.isFull
                              ? "🔴 Sold out for this cycle"
                              : `* Only ${featuredSlots.remaining} spot${featuredSlots.remaining === 1 ? "" : "s"} remaining for this cycle`}
                          </span>
                        </div>
                      </div>

                      {/* Value Props Bullet List */}
                      <ul className="space-y-2.5 text-xs text-body pt-1">
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>
                            <strong className="text-ink font-semibold">Top 6 placement</strong> on directory homepage and shelf for 30 days
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>
                            After 30 days, you get <strong className="text-ink font-semibold">listed permanently</strong> on the directory
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>
                            <strong className="text-ink font-semibold">Featured at the top</strong> of competitor alternative pages
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>
                            <strong className="text-ink font-semibold">High-quality dofollow backlink</strong> to boost your domain authority & SEO
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>
                            <strong className="text-ink font-semibold">No reciprocal badge required</strong> on your website
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>
                            <strong className="text-ink font-semibold">Express approval</strong> within 24 hours
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>
                            <strong className="text-ink font-semibold">Hundreds of monthly Mac users</strong> discovering and testing your app
                          </span>
                        </li>
                      </ul>
                    </>
                  ) : (
                    <>
                      {/* Gold Tier Details */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 to-fuchsia-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs">
                            🌟 Gold Verified Badge · Best Exposure 🔥
                          </span>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                            <CheckIcon className="h-3 w-3" />
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-baseline gap-2">
                          <span className="font-display text-3xl font-extrabold text-ink">${articlePrice}</span>
                          <span className="text-sm text-muted line-through">${articleCompare}</span>
                          <span className="text-xs text-muted">one-time</span>
                        </div>

                        {/* Scarcity Signal (Live Spot Counter) */}
                        <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>
                            {articleSlots.isFull
                              ? "🔴 Sold out for this cycle"
                              : `* Only ${articleSlots.remaining} spot${articleSlots.remaining === 1 ? "" : "s"} remaining for this cycle`}
                          </span>
                        </div>
                      </div>

                      {/* Value Props Bullet List */}
                      <ul className="space-y-2.5 text-xs text-body pt-1">
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span>
                            <strong className="text-ink font-semibold">#1 Priority Top Spot</strong> on directory for 30 days
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span>
                            <strong className="text-ink font-semibold">Dedicated Medium blog post</strong> featuring your app with comparisons
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span>
                            <strong className="text-ink font-semibold">Express 2-hour review turnaround</strong> and approval
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span>
                            <strong className="text-ink font-semibold">High-authority SEO backlinks</strong> from Medium & directory
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span>
                            <strong className="text-ink font-semibold">No reciprocal badge required</strong> on your website
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span>
                            <strong className="text-ink font-semibold">Golden verified badge</strong> on your cards & app pages
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span>
                            Permanent listing in the catalog after 30 days
                          </span>
                        </li>
                      </ul>
                    </>
                  )}
                </div>

                {/* Quality Checklist Card (Matching Reference Image) */}
                <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-3">
                  <h3 className="text-sm font-semibold text-ink">Checklist</h3>
                  <div className="space-y-2.5">
                    {checks.map((item) => (
                      <div key={item.label} className="flex items-center gap-2.5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white shadow-2xs">
                          <CheckIcon className="h-3 w-3" />
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-ink">{item.label}</span>
                          <span className="text-muted"> — {item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Streamlined App Submission Form */}
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (sending) return;
                    if (!hasEmail || !hasXHandle) {
                      setBadge("fail");
                      setBadgeMessage("Both email and X handle are mandatory to submit.");
                      return;
                    }
                    if (!isPaid && badge !== "ok") {
                      setBadge("fail");
                      setBadgeMessage("Please verify the PickMacApps badge on your website first.");
                      return;
                    }
                    setSending(true);
                    const attr = getAttribution();
                    identifyUser({
                      user_id: email.trim(),
                      email: email.trim(),
                      name: name.trim(),
                      xHandle: xHandle.trim(),
                    });
                    trackGoal(isPaid ? "checkout_click" : "signup_click", {
                      plan: selectedPlan,
                      price: currentPrice,
                      paid: isPaid,
                      appName: name.trim(),
                    });

                    try {
                      const result = await submitListingFn({
                        data: {
                          name: name.trim() || website.replace(/^https?:\/\//, "").split("/")[0],
                          website: website.trim(),
                          tagline: tagline.trim() || "Handcrafted macOS utility",
                          description: description.trim() || tagline.trim() || "Handcrafted macOS application.",
                          icon: icon.trim(),
                          demo: demo.trim(),
                          pricing,
                          category,
                          email: email.trim(),
                          xHandle: xHandle.trim(),
                          plan: isPaid ? "choice" : "free",
                          tier: selectedPlan === "article" ? "article" : "featured",
                          mlVisitorId: attr.ml_visitor_id,
                          mlSessionId: attr.ml_session_id,
                        },
                      });
                      if (result.checkoutUrl) {
                        trackGoal("checkout_redirect", {
                          plan: selectedPlan,
                          price: currentPrice,
                          appName: name.trim(),
                        });
                        window.location.href = appendAttributionToUrl(result.checkoutUrl);
                        return;
                      }
                      if (result.ok) {
                        trackGoal("signup_completed", {
                          plan: selectedPlan,
                          price: currentPrice,
                          appName: name.trim(),
                        });
                        if (result.dashboardToken) {
                          window.location.href = `/dashboard/${result.dashboardToken}?new=1`;
                          return;
                        }
                        setSent(true);
                      } else {
                        setBadge("fail");
                        setBadgeMessage(result.message);
                      }
                    } catch {
                      setBadge("fail");
                      setBadgeMessage("The submission could not be saved.");
                    } finally {
                      setSending(false);
                    }
                  }}
                  className="space-y-4"
                >
                  {/* App Details Card */}
                  <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-ink">App details</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        <SparklesIcon className="h-3 w-3" /> Auto-fill available
                      </span>
                    </div>

                    {/* Website URL + Auto-fetch button */}
                    <div className="space-y-1.5">
                      <label htmlFor="website_url" className="text-xs font-medium text-body">
                        Website URL <span className="text-accent">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="website_url"
                          required
                          type="url"
                          name="website_url"
                          placeholder="https://yourmacapp.com"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleAutoFetch();
                            }
                          }}
                          className={field}
                        />
                        <button
                          type="button"
                          disabled={fetching || !website.trim()}
                          onClick={() => void handleAutoFetch()}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line-2 bg-surface-2 px-3.5 py-2.5 text-xs font-semibold text-ink transition-all hover:border-accent hover:bg-accent/5 disabled:opacity-50 cursor-pointer"
                        >
                          {fetching ? (
                            <>
                              <SpinnerIcon className="h-3.5 w-3.5 text-ink animate-spin" />
                              <span>Fetching…</span>
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="h-3.5 w-3.5 text-accent" />
                              <span>Auto-fetch</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted">
                        Enter your app website and click <strong>Auto-fetch</strong> to automatically extract name, tagline, description, and icon.
                      </p>
                    </div>

                    {/* Auto-fetch message feedback */}
                    {fetchStatus === "success" && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                        <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>{fetchMessage}</span>
                      </div>
                    )}
                    {fetchStatus === "error" && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                        {fetchMessage}
                      </div>
                    )}

                    {/* App Visual Preview Card (if details available) */}
                    {(icon || name || tagline) && (
                      <div className="rounded-xl border border-line bg-stone-50/60 p-3.5 flex items-center gap-3">
                        {icon ? (
                          <img
                            src={icon}
                            alt={name || "App icon"}
                            className="h-10 w-10 rounded-xl object-cover shrink-0 border border-line bg-surface shadow-2xs"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-xs font-bold text-muted shrink-0">
                            APP
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-ink truncate">{name || "App Name"}</span>
                            <span className="rounded bg-stone-200 px-1.5 py-0.2 text-[10px] font-medium text-stone-700 capitalize">
                              {pricing}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted truncate mt-0.5">{tagline || "Tagline extracted from your site"}</p>
                        </div>
                      </div>
                    )}

                    {/* Primary Contact Inputs: Email + X Handle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label htmlFor="email" className="mb-1 block text-xs font-medium text-body">
                          Your email <span className="text-accent">*</span>
                        </label>
                        <input
                          id="email"
                          required
                          type="email"
                          placeholder="developer@yourdomain.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={field}
                        />
                      </div>
                      <div>
                        <label htmlFor="x_handle" className="mb-1 block text-xs font-medium text-body">
                          X (Twitter) handle <span className="text-accent">*</span>
                        </label>
                        <input
                          id="x_handle"
                          required
                          type="text"
                          placeholder="@username"
                          value={xHandle}
                          onChange={(e) => setXHandle(e.target.value)}
                          className={field}
                        />
                      </div>
                    </div>

                    {/* Advanced Customization Accordion */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline cursor-pointer"
                      >
                        <ChevronIcon className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                        <span>{showAdvanced ? "Hide detailed fields" : "Customize name, description, screenshots ▾"}</span>
                      </button>

                      {showAdvanced && (
                        <div className="mt-3 space-y-3 border-t border-line pt-3">
                          <div>
                            <label htmlFor="name" className="mb-1 block text-xs font-medium text-body">App name</label>
                            <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Raycast" className={field} />
                          </div>
                          <div>
                            <label htmlFor="tagline" className="mb-1 block text-xs font-medium text-body">Tagline</label>
                            <input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Short one-line description" className={field} />
                          </div>
                          <div>
                            <label htmlFor="description" className="mb-1 block text-xs font-medium text-body">Description</label>
                            <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does your app do?" className={field} />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="icon" className="mb-1 block text-xs font-medium text-body">Icon URL</label>
                              <input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="https://.../icon.png" className={field} />
                            </div>
                            <div>
                              <label htmlFor="demo" className="mb-1 block text-xs font-medium text-body">Screenshot URL (optional)</label>
                              <input id="demo" value={demo} onChange={(e) => setDemo(e.target.value)} placeholder="https://.../screenshot.png" className={field} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="pricing" className="mb-1 block text-xs font-medium text-body">App Pricing</label>
                              <select id="pricing" value={pricing} onChange={(e) => setPricing(e.target.value as "free" | "freemium" | "paid")} className={field}>
                                <option value="free">Free</option>
                                <option value="freemium">Freemium</option>
                                <option value="paid">Paid</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="category" className="mb-1 block text-xs font-medium text-body">Category</label>
                              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
                                {shelfCategories.map((c) => (
                                  <option key={c.slug} value={c.slug}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Free Listing Badge Embed & Checker (Only in Free mode) */}
                  {!isPaid && (
                    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-ink">Reciprocal Backlink Badge</h4>
                        <span className="text-[11px] text-muted">Required for $0 listing</span>
                      </div>
                      <p className="text-xs text-body leading-relaxed">
                        Copy and paste this badge onto your app's website or footer. Our crawler verifies the badge automatically before approval.
                      </p>

                      {/* Variant Selector */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setBadgeVariant("logo")}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                            badgeVariant === "logo" ? "bg-ink text-canvas shadow-xs" : "border border-line bg-stone-50 text-muted hover:text-ink"
                          }`}
                        >
                          Logo (Default)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBadgeVariant("classic")}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                            badgeVariant === "classic" ? "bg-ink text-canvas shadow-xs" : "border border-line bg-stone-50 text-muted hover:text-ink"
                          }`}
                        >
                          Classic
                        </button>
                        <button
                          type="button"
                          onClick={() => setBadgeVariant("dark")}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                            badgeVariant === "dark" ? "bg-ink text-canvas shadow-xs" : "border border-line bg-stone-50 text-muted hover:text-ink"
                          }`}
                        >
                          Dark
                        </button>
                      </div>

                      {/* Live Badge Preview */}
                      <div className="flex justify-center rounded-xl border border-line bg-[#0B0F19] p-4">
                        <img src={`/${badgeFile}`} alt="Featured on PickMacApps" width="200" height="54" className="h-[54px] w-[200px]" />
                      </div>

                      {/* Code Snippet Box */}
                      <div className="overflow-hidden rounded-xl border border-line bg-stone-50">
                        <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-[11px] text-muted">
                          <span>HTML Embed Code</span>
                          <button
                            type="button"
                            onClick={copyBadge}
                            className="font-semibold text-ink hover:underline cursor-pointer"
                          >
                            {copied ? "Copied!" : "Copy Code"}
                          </button>
                        </div>
                        <pre className="overflow-x-auto p-3 text-[11px] text-body">
                          <code>{badgeHtml}</code>
                        </pre>
                      </div>

                      {/* Live Verify Button */}
                      <button
                        type="button"
                        disabled={badge === "checking" || !website.trim()}
                        onClick={() => void checkBadge()}
                        className="w-full py-2.5 px-4 rounded-xl border border-line-2 bg-surface text-xs font-semibold text-ink hover:bg-stone-50 disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        {badge === "checking" ? "Checking website for badge…" : "🔍 Check My Badge Now"}
                      </button>

                      {badgeMessage && (
                        <div
                          className={`rounded-xl border p-2.5 text-xs leading-relaxed ${
                            badge === "ok"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          {badgeMessage}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Primary Dynamic CTA Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={`w-full rounded-2xl py-3.5 px-6 text-sm font-bold transition-all shadow-sm hover:opacity-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedPlan === "article"
                          ? "bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white"
                          : isPaid
                            ? "bg-sky-600 text-white"
                            : "bg-ink text-canvas"
                      }`}
                    >
                      {sending
                        ? "Processing submission…"
                        : isPaid
                          ? isSelectedTierFull
                            ? "Sold Out for this cycle · Select another tier"
                            : `Get Listed for $${currentPrice}`
                          : badge === "ok"
                            ? "Submit Free Listing"
                            : "Verify Badge to Submit Free"}
                    </button>

                    <p className="mt-2 text-center text-xs text-muted">
                      {isPaid
                        ? "Instant redirect to secure checkout. You'll get private dashboard access immediately after payment."
                        : "Free reciprocal listing. Reviewed in 3–5 business days once your backlink badge is verified."}
                    </p>
                  </div>
                </form>
              </div>

              {/* Right Column: Social Proof, Testimonials & Clarity FAQ */}
              <div className="lg:col-span-5 xl:col-span-5 space-y-5">
                {/* 4 Founder Testimonials Stack (Directly from Reference Screenshot) */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                    Loved by Mac Indie Developers
                  </h3>

                  {testimonials.map((t) => (
                    <div
                      key={t.name}
                      className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs transition hover:border-ink/20"
                    >
                      <QuoteIcon className="h-5 w-5 text-stone-300 dark:text-stone-700 mb-2" />
                      <p className="text-xs text-body leading-relaxed">{t.quote}</p>
                      <div className="mt-3 flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs ${t.avatarBg}`}
                        >
                          {t.initials}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-ink">{t.name}</div>
                          <div className="text-[11px] text-muted">{t.role}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Directory Reach Metrics */}
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
                    Directory Reach & SEO Power
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-stone-50/80 p-2.5">
                      <div className="font-display text-lg font-bold text-ink">250+</div>
                      <div className="text-[10px] text-muted">Curated Apps</div>
                    </div>
                    <div className="rounded-xl bg-stone-50/80 p-2.5">
                      <div className="font-display text-lg font-bold text-ink">30k+</div>
                      <div className="text-[10px] text-muted">Monthly Views</div>
                    </div>
                    <div className="rounded-xl bg-stone-50/80 p-2.5">
                      <div className="font-display text-lg font-bold text-ink">Top 3</div>
                      <div className="text-[10px] text-muted">Search Ranks</div>
                    </div>
                  </div>
                </div>

                {/* Clarity FAQ Accordion */}
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
                    Common Questions
                  </h4>
                  <div className="space-y-2">
                    {faqs.map((faq, idx) => (
                      <div key={faq.q} className="border-b border-stone-100 last:border-b-0 pb-2.5">
                        <button
                          type="button"
                          onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                          className="flex w-full items-center justify-between text-left text-xs font-semibold text-ink hover:text-accent cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          <ChevronIcon className={`h-3 w-3 shrink-0 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                        </button>
                        {openFaq === idx && (
                          <p className="mt-1.5 text-[11px] text-muted leading-relaxed">
                            {faq.a}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
