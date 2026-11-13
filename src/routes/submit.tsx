import { useEffect, useState } from "react";
import { CheckIcon, SparklesIcon, SpinnerIcon } from "@/components/icons";
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

const checks = ["Your app is functional", "It delivers what it promises", "Is not an infoproduct"];
const field =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-muted focus:border-accent focus:outline-none";

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

  const [selectedPlan, setSelectedPlan] = useState<"free" | "featured" | "article">(() => {
    if (tier === "article" && !articleSlots.isFull) return "article";
    if (tier === "featured" && !featuredSlots.isFull) return "featured";
    if (!featuredSlots.isFull) return "featured";
    if (!articleSlots.isFull) return "article";
    return "free";
  });

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
  const [alreadyListed, setAlreadyListed] = useState<{ id: string; name: string; slug: string; isPaid?: boolean; tier?: string | null } | null>(null);

  const currentPrice = selectedPlan === "article" ? articlePrice : featuredPrice;
  const paid = selectedPlan === "featured" || selectedPlan === "article";
  const isSelectedTierFull =
    (selectedPlan === "featured" && featuredSlots.isFull) ||
    (selectedPlan === "article" && articleSlots.isFull);

  // Always use the real canonical website URL for external badge embeds
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
  const badgeOk = paid || badge === "ok";
  const canSubmit = Boolean(hasEmail && hasXHandle && (!paid || !isSelectedTierFull) && badgeOk && !sending);

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
            ? `Found existing listing for ${result.alreadyListed.name}! Details auto-filled. Submitting will update your listing (or upgrade to Sponsor if selected).`
            : "Details auto-filled from your website! Please review each field below, customize anything, and submit."
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

  async function checkBadge(form: HTMLFormElement) {
    const targetUrl = website.trim() || String(new FormData(form).get("website_url") ?? "");
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
    <main>
      <div className="min-h-screen">
        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:py-14">
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
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-canvas hover:opacity-90"
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
              <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-12">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent uppercase tracking-wider mb-3">
                  Mac App Directory Submission
                </span>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink">
                  Submit your Mac app
                </h1>
                <p className="mt-3 text-base sm:text-lg text-body max-w-2xl mx-auto leading-relaxed">
                  Join over 250+ handpicked Mac tools. Choose between free reciprocal community listing or guaranteed 30-day top spots.
                </p>
              </div>

              {/* 3-Column Pricing & Slot Selection Grid */}
              <div className="mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-ink">1. Choose your listing plan</h2>
                    <p className="text-xs text-muted">Click any plan below to select it for your submission.</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live capacity: 3 Blue spots & 3 Gold spots
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  {/* Option 1: Free Community */}
                  <div
                    onClick={() => {
                      setSelectedPlan("free");
                      trackGoal("select_plan", { plan: "free" });
                    }}
                    data-ml-goal="select_free_plan"
                    className={`relative cursor-pointer rounded-2xl border-2 p-5 sm:p-6 transition-all flex flex-col justify-between ${
                      selectedPlan === "free"
                        ? "border-ink bg-surface shadow-md ring-2 ring-ink/10"
                        : "border-line bg-surface hover:border-line-2"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="rounded-full bg-surface-2 border border-line px-2.5 py-0.5 text-[11px] font-semibold text-muted uppercase">
                          Community
                        </span>
                        <Radio selected={selectedPlan === "free"} />
                      </div>
                      <h3 className="font-display text-xl font-bold text-ink">Free Listing</h3>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-ink">$0</span>
                        <span className="text-xs text-muted">free forever</span>
                      </div>
                      <p className="mt-1 text-xs text-body">
                        Requires reciprocal badge on your landing page. Reviewed in 3-5 business days.
                      </p>

                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 border border-line px-2.5 py-1 text-xs font-medium text-body">
                          🟢 Always available
                        </span>
                        <p className="mt-1 text-[11px] text-muted">No spot cap · Badge required</p>
                      </div>

                      <div className="my-4 border-t border-line" />

                      <ul className="space-y-2 text-xs text-body">
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
                          <span>Reciprocal badge on your website required</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
                          <span>Permanent directory catalog listing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
                          <span>Standard nofollow link</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
                          <span>Manual review (3-5 business days)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-3 border-t border-line/60">
                      <button
                        type="button"
                        data-ml-goal="pricing_cta"
                        data-ml-goal-plan="free"
                        className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                          selectedPlan === "free"
                            ? "bg-ink text-canvas shadow-xs"
                            : "border border-line bg-surface-2 text-body hover:text-ink"
                        }`}
                      >
                        {selectedPlan === "free" ? "✓ Plan Selected" : "Select Free"}
                      </button>
                    </div>
                  </div>

                  {/* Option 2: Featured Placement ($99 - Blue Badge) */}
                  <div
                    onClick={() => {
                      if (!featuredSlots.isFull) {
                        setSelectedPlan("featured");
                        trackGoal("select_plan", { plan: "featured", price: featuredPrice });
                      }
                    }}
                    data-ml-goal="select_featured_plan"
                    className={`relative rounded-2xl border-2 p-5 sm:p-6 transition-all flex flex-col justify-between ${
                      featuredSlots.isFull
                        ? "border-line bg-surface-2/60 opacity-80 cursor-not-allowed"
                        : selectedPlan === "featured"
                          ? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 shadow-md ring-2 ring-sky-500/40 cursor-pointer"
                          : "border-line bg-surface hover:border-sky-300 cursor-pointer"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="rounded-full bg-sky-500/10 border border-sky-500/30 px-2.5 py-0.5 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                          🔹 Blue Verified Badge
                        </span>
                        <Radio selected={selectedPlan === "featured" && !featuredSlots.isFull} />
                      </div>
                      <h3 className="font-display text-xl font-bold text-ink">Featured Placement</h3>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-ink">${featuredPrice}</span>
                        <span className="text-sm text-muted line-through">${featuredCompare}</span>
                        <span className="text-xs text-muted">one-time</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-sky-700 dark:text-sky-300">
                        Approved within 24 hours · 30-day top rotation
                      </p>

                      {/* Live Slot Status Pill */}
                      <div className="mt-3">
                        {featuredSlots.isFull ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 text-xs font-bold text-rose-600">
                              🔴 Sold out (0/3 available)
                            </span>
                            {featuredSlots.openDates && featuredSlots.openDates.length > 0 ? (
                              <p className="text-[11px] font-medium text-sky-700 dark:text-sky-300">
                                📅 Next slot opens: {new Date(featuredSlots.openDates[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                {featuredSlots.openDates.length > 1 ? ` · then ${new Date(featuredSlots.openDates[1]).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              🟢 {featuredSlots.remaining} of 3 spots available
                            </span>
                            {featuredSlots.openDates && featuredSlots.openDates.length > 0 ? (
                              <p className="text-[11px] text-muted">
                                Next spot frees up on {new Date(featuredSlots.openDates[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            ) : null}
                          </div>
                        )}
                        <p className="mt-1 text-[11px] text-muted">
                          Strict 3-app cap (cycle until {featuredSlots.nextDate})
                        </p>
                      </div>

                      <div className="my-4 border-t border-line" />

                      <ul className="space-y-2 text-xs text-body">
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
                          <span><strong className="font-semibold text-ink">Top 6 placement</strong> on directory for 30 days</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
                          <span><strong className="font-semibold text-ink">Blue verified badge</strong> on cards & pages</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
                          <span><strong className="font-semibold text-ink">High-quality follow backlink</strong> for SEO</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
                          <span><strong className="font-semibold text-ink">Featured at the top</strong> of alternative pages</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
                          <span><strong className="font-semibold text-ink">Permanent listing</strong> after 30 days</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-3 border-t border-line/60">
                      <button
                        type="button"
                        disabled={featuredSlots.isFull}
                        data-ml-goal="pricing_cta"
                        data-ml-goal-plan="featured"
                        className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                          featuredSlots.isFull
                            ? "bg-surface-2 text-muted cursor-not-allowed"
                            : selectedPlan === "featured"
                              ? "bg-sky-600 text-white shadow-xs"
                              : "border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20"
                        }`}
                      >
                        {featuredSlots.isFull
                          ? "Sold Out for this cycle"
                          : selectedPlan === "featured"
                            ? "✓ Plan Selected"
                            : `Select Featured ($${featuredPrice})`}
                      </button>
                    </div>
                  </div>

                  {/* Option 3: Featured + Medium Article ($120 - Gold Badge) */}
                  <div
                    onClick={() => {
                      if (!articleSlots.isFull) {
                        setSelectedPlan("article");
                        trackGoal("select_plan", { plan: "article", price: articlePrice });
                      }
                    }}
                    data-ml-goal="select_article_plan"
                    className={`relative rounded-2xl border-2 p-5 sm:p-6 transition-all flex flex-col justify-between ${
                      articleSlots.isFull
                        ? "border-line bg-surface-2/60 opacity-80 cursor-not-allowed"
                        : selectedPlan === "article"
                          ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-500/40 cursor-pointer"
                          : "border-line bg-surface hover:border-amber-300 cursor-pointer"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                          🌟 Gold Badge · Best Exposure 🔥
                        </span>
                        <Radio selected={selectedPlan === "article" && !articleSlots.isFull} />
                      </div>
                      <h3 className="font-display text-xl font-bold text-ink">Featured + Medium Article</h3>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-ink">${articlePrice}</span>
                        <span className="text-sm text-muted line-through">${articleCompare}</span>
                        <span className="text-xs text-muted">one-time</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        ⚡ Express 2h turnaround · Full Medium review article
                      </p>

                      {/* Live Slot Status Pill */}
                      <div className="mt-3">
                        {articleSlots.isFull ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 text-xs font-bold text-rose-600">
                              🔴 Sold out (0/3 available)
                            </span>
                            {articleSlots.openDates && articleSlots.openDates.length > 0 ? (
                              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                📅 Next slot opens: {new Date(articleSlots.openDates[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                {articleSlots.openDates.length > 1 ? ` · then ${new Date(articleSlots.openDates[1]).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              🟢 {articleSlots.remaining} of 3 spots available
                            </span>
                            {articleSlots.openDates && articleSlots.openDates.length > 0 ? (
                              <p className="text-[11px] text-muted">
                                Next spot frees up on {new Date(articleSlots.openDates[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            ) : null}
                          </div>
                        )}
                        <p className="mt-1 text-[11px] text-muted">
                          Strict 3-app cap (cycle until {articleSlots.nextDate})
                        </p>
                      </div>

                      <div className="my-4 border-t border-line" />

                      <ul className="space-y-2 text-xs text-body">
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span><strong className="font-semibold text-ink">#1 Priority Top Spot</strong> on directory for 30 days</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span><strong className="font-semibold text-ink">Express 2-hour review turnaround</strong> and approval</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span><strong className="font-semibold text-ink">Dedicated in-depth review article</strong> on Medium</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span><strong className="font-semibold text-ink">High-authority SEO backlink</strong> from Medium & directory</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span><strong className="font-semibold text-ink">Golden Verified Badge</strong> on cards & pages</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span><strong className="font-semibold text-ink">Permanent listing</strong> after 30 days</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-3 border-t border-line/60">
                      <button
                        type="button"
                        disabled={articleSlots.isFull}
                        data-ml-goal="pricing_cta"
                        data-ml-goal-plan="article"
                        className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                          articleSlots.isFull
                            ? "bg-surface-2 text-muted cursor-not-allowed"
                            : selectedPlan === "article"
                              ? "bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white shadow-xs"
                              : "border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                        }`}
                      >
                        {articleSlots.isFull
                          ? "Sold Out for this cycle"
                          : selectedPlan === "article"
                            ? "✓ Plan Selected"
                            : `Select Article ($${articlePrice})`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Form & Sidebar Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                {/* Form Column */}
                <div className="lg:col-span-7 xl:col-span-8">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-ink">2. Enter your app details</h2>
                    <p className="text-xs text-muted">Provide your website URL to auto-fill or enter your information manually.</p>
                  </div>

                  {/* Selected Plan Summary Banner */}
                  <div
                    className={`mb-5 rounded-2xl border p-4 flex items-center justify-between shadow-xs ${
                      selectedPlan === "article"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                        : selectedPlan === "featured"
                          ? "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-200"
                          : "border-line bg-surface text-ink"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {selectedPlan === "article" ? "🌟" : selectedPlan === "featured" ? "🔹" : "📋"}
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">
                          Active Selection:{" "}
                          {selectedPlan === "article"
                            ? `Featured + Medium Article ($${articlePrice})`
                            : selectedPlan === "featured"
                              ? `Featured Placement ($${featuredPrice})`
                              : "Free Community Listing ($0)"}
                        </p>
                        <p className="text-xs opacity-85 mt-0.5">
                          {selectedPlan === "article"
                            ? "Golden badge · Top spot priority · 2-hour express turnaround · Medium article"
                            : selectedPlan === "featured"
                              ? "Blue badge · Top 6 hero spot · Approved in 24 hours · SEO follow backlink"
                              : "Community listing with reciprocal badge backlink"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-accent underline cursor-pointer shrink-0 ml-2 bg-transparent border-0"
                      onClick={() => window.scrollTo({ top: 180, behavior: "smooth" })}
                    >
                      Change plan
                    </button>
                  </div>

                  <form
                    className="space-y-5"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      if (sending) return;
                      if (!hasEmail || !hasXHandle) {
                        setBadge("fail");
                        setBadgeMessage("Both email and X handle are mandatory to submit.");
                        return;
                      }
                      if (selectedPlan === "free" && badge !== "ok") return;
                      setSending(true);
                      const attr = getAttribution();
                      identifyUser({
                        user_id: email.trim(),
                        email: email.trim(),
                        name: name.trim(),
                        xHandle: xHandle.trim(),
                      });
                      trackGoal(paid ? "checkout_click" : "signup_click", {
                        plan: selectedPlan,
                        price: currentPrice,
                        paid,
                        appName: name.trim(),
                      });
                      try {
                        const result = await submitListingFn({
                          data: {
                            name: name.trim(),
                            website: website.trim(),
                            tagline: tagline.trim(),
                            description: description.trim(),
                            icon: icon.trim(),
                            demo: demo.trim(),
                            pricing,
                            category,
                            email: email.trim(),
                            xHandle: xHandle.trim(),
                            plan: paid ? "choice" : "free",
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
                  >
                    {alreadyListed ? (
                      <div className="mb-4 rounded-2xl border border-sky-300/80 bg-sky-50/80 p-4 text-xs text-sky-950 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-200 shadow-xs">
                        <div className="flex items-start gap-2.5">
                          <span className="text-base leading-none">ℹ️</span>
                          <div>
                            <p className="font-semibold text-sm">
                              {alreadyListed.name} is already listed in our directory!
                            </p>
                            <p className="mt-0.5 leading-relaxed opacity-90">
                              Submitting this form will <strong>update your existing listing</strong> (<a href={`/app/${alreadyListed.slug}`} target="_blank" rel="noreferrer" className="underline font-semibold hover:opacity-80">/app/{alreadyListed.slug}</a>) rather than creating a duplicate.
                              {paid ? " You are upgrading to an Editor's Choice Sponsor tier!" : " You can also choose Gold or Blue below if you wish to upgrade to a featured placement."}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <div className="space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold tracking-[-0.025em] text-ink">App information</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
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
                            aria-label="Website URL"
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
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line-2 bg-surface-2 px-3.5 py-2.5 text-xs font-semibold text-ink transition-all hover:border-accent hover:bg-accent/5 disabled:opacity-50"
                          >
                            {fetching ? (
                              <>
                                <SpinnerIcon className="h-3.5 w-3.5 text-ink" />
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
                          Enter your website and click <strong>Auto-fetch</strong>. We’ll automatically extract name, tagline, description, icon, demo screenshot, and category.
                        </p>
                      </div>

                      {/* Auto-fetch notification banner */}
                      {fetchStatus === "success" && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
                          <div className="flex items-start gap-2">
                            <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <div>
                              <span className="font-semibold">Details fetched: </span>
                              <span>{fetchMessage}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {fetchStatus === "error" && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                          <div className="flex items-start gap-2">
                            <span className="font-semibold shrink-0">Note:</span>
                            <span>{fetchMessage}</span>
                          </div>
                        </div>
                      )}

                      {/* Live Visual Preview Card */}
                      {(icon || demo || name) && (
                        <div className="rounded-xl border border-line bg-surface-2 p-4 transition-all">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">Review Preview</span>
                            <span className="text-[10px] text-muted">Editable below</span>
                          </div>
                          <div className="flex items-start gap-3">
                            {icon ? (
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
                                <img
                                  src={icon}
                                  alt={name || "App icon"}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = "none";
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-xs font-bold text-muted">
                                APP
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-ink truncate">{name || "App Name"}</span>
                                <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent capitalize">
                                  {pricing}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-body line-clamp-1">{tagline || "Your short tagline"}</p>
                            </div>
                          </div>
                          {demo && (
                            <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface-2/40 dark:bg-[#141416]">
                              <img
                                src={demo}
                                alt="Demo screenshot"
                                className="max-h-48 w-full object-contain"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Editable Form Inputs */}
                      <div className="space-y-3.5 pt-1">
                        <div>
                          <label htmlFor="name" className="mb-1 block text-xs font-medium text-body">
                            App name <span className="text-accent">*</span>
                          </label>
                          <input
                            id="name"
                            required
                            name="name"
                            aria-label="App name"
                            placeholder="e.g. Raycast"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={field}
                          />
                        </div>

                        <div>
                          <label htmlFor="tagline" className="mb-1 block text-xs font-medium text-body">
                            Tagline <span className="text-accent">*</span>
                          </label>
                          <input
                            id="tagline"
                            required
                            name="tagline"
                            aria-label="Tagline"
                            placeholder="e.g. Supercharged productivity launcher"
                            value={tagline}
                            onChange={(e) => setTagline(e.target.value)}
                            className={field}
                          />
                          <p className="mt-1 text-[11px] text-muted">One punchy sentence describing your app.</p>
                        </div>

                        <div>
                          <label htmlFor="description" className="mb-1 block text-xs font-medium text-body">
                            Description <span className="text-accent">*</span>
                          </label>
                          <textarea
                            id="description"
                            required
                            rows={3}
                            name="description"
                            aria-label="Description"
                            placeholder="What does your app do, who is it for, and why should Mac users try it?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={field}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                          <div>
                            <label htmlFor="icon" className="mb-1 block text-xs font-medium text-body">
                              App icon URL <span className="text-accent">*</span>
                            </label>
                            <input
                              id="icon"
                              required
                              type="url"
                              name="icon"
                              aria-label="App icon URL"
                              placeholder="https://yourmacapp.com/icon.png"
                              value={icon}
                              onChange={(e) => setIcon(e.target.value)}
                              className={field}
                            />
                          </div>

                          <div>
                            <label htmlFor="demo" className="mb-1 block text-xs font-medium text-body">
                              Demo / Screenshot URL (optional)
                            </label>
                            <input
                              id="demo"
                              type="url"
                              name="demo"
                              aria-label="Demo screenshot URL"
                              placeholder="https://yourmacapp.com/screenshot.png"
                              value={demo}
                              onChange={(e) => setDemo(e.target.value)}
                              className={field}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                          <div>
                            <label htmlFor="pricing" className="mb-1 block text-xs font-medium text-body">
                              Pricing model <span className="text-accent">*</span>
                            </label>
                            <select
                              id="pricing"
                              required
                              name="pricing"
                              aria-label="Pricing model"
                              value={pricing}
                              onChange={(e) => setPricing(e.target.value as "free" | "freemium" | "paid")}
                              className={field}
                            >
                              <option value="free">Free</option>
                              <option value="freemium">Freemium</option>
                              <option value="paid">Paid</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="category" className="mb-1 block text-xs font-medium text-body">
                              Category <span className="text-accent">*</span>
                            </label>
                            <select
                              id="category"
                              required
                              name="category"
                              aria-label="Category"
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className={field}
                            >
                              {shelfCategories.map((cat) => (
                                <option key={cat.slug} value={cat.slug}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 pt-2 border-t border-line/60">
                          <div>
                            <label htmlFor="email" className="mb-1 block text-xs font-medium text-body">
                              Your email <span className="text-accent">*</span>
                            </label>
                            <input
                              id="email"
                              required
                              type="email"
                              name="email"
                              aria-label="Email address"
                              placeholder="your@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={field}
                            />
                          </div>

                          <div>
                            <label htmlFor="x_handle" className="mb-1 block text-xs font-medium text-body">
                              Your X (Twitter) handle <span className="text-accent">*</span>
                            </label>
                            <input
                              id="x_handle"
                              required
                              type="text"
                              name="x_handle"
                              aria-label="X (Twitter) handle"
                              placeholder="@username"
                              value={xHandle}
                              onChange={(e) => setXHandle(e.target.value)}
                              className={field}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-muted">
                          Both email and X handle are mandatory. We’ll notify you of approval and tag your handle on X when featured.
                        </p>
                      </div>
                    </div>

                    {/* Free Listing Badge Embed Verification Box */}
                    {paid ? null : (
                      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold tracking-[-0.025em] text-ink">Add our badge, get listed free</h3>
                          <span className="text-[11px] font-medium text-muted">200 × 54 px</span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-body">
                          Paste this badge on your app's landing page. A free listing requires this badge before approval.
                        </p>

                        {/* Variant Selector */}
                        <div className="mt-3.5 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setBadgeVariant("logo")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                              badgeVariant === "logo"
                                ? "bg-ink text-canvas shadow-xs"
                                : "border border-line bg-surface-2 text-muted hover:text-ink"
                            }`}
                          >
                            Logo badge (Favicon)
                          </button>
                          <button
                            type="button"
                            onClick={() => setBadgeVariant("classic")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                              badgeVariant === "classic"
                                ? "bg-ink text-canvas shadow-xs"
                                : "border border-line bg-surface-2 text-muted hover:text-ink"
                            }`}
                          >
                            Classic badge
                          </button>
                          <button
                            type="button"
                            onClick={() => setBadgeVariant("dark")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                              badgeVariant === "dark"
                                ? "bg-ink text-canvas shadow-xs"
                                : "border border-line bg-surface-2 text-muted hover:text-ink"
                            }`}
                          >
                            Dark badge
                          </button>
                        </div>

                        {/* Live Badge Preview */}
                        <div className="mt-3 flex justify-center rounded-xl border border-line bg-[#0B0F19] p-4 sm:p-5">
                          <img
                            src={`/${badgeFile}`}
                            alt="Featured on PickMacApps"
                            width="200"
                            height="54"
                            className="h-[54px] w-[200px]"
                          />
                        </div>

                        {/* Copy Code Box */}
                        <div className="mt-3 overflow-hidden rounded-lg border border-line bg-canvas">
                          <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
                            <span className="text-[11px] font-medium text-muted">HTML Embed Code (Absolute URL)</span>
                            <button
                              type="button"
                              onClick={copyBadge}
                              className="rounded-md border border-line-2 bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink transition-colors hover:bg-surface-2"
                            >
                              {copied ? "Copied!" : "Copy code"}
                            </button>
                          </div>
                          <pre className="overflow-x-auto p-3 text-[11px] leading-relaxed text-body">
                            <code>{badgeHtml}</code>
                          </pre>
                        </div>

                        <button
                          type="button"
                          disabled={badge === "checking"}
                          onClick={(event) => {
                            const form = event.currentTarget.form;
                            if (form) void checkBadge(form);
                          }}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line-2 bg-surface-2 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent disabled:opacity-60"
                        >
                          {badge === "checking" ? "Checking page for badge…" : "Check my badge now"}
                        </button>
                      </div>
                    )}

                    {badgeMessage ? (
                      <div
                        className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                          badge === "ok"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        {badgeMessage}
                      </div>
                    ) : null}

                    {/* Quality Checklist */}
                    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs">
                      <h4 className="mb-2.5 text-xs font-semibold tracking-wider text-muted uppercase">
                        Submission Requirements
                      </h4>
                      <div className="space-y-2">
                        {checks.map((item) => (
                          <div key={item} className="flex items-center gap-2.5">
                            <div className="flex h-[18px] w-[18px] items-center justify-center rounded-md bg-emerald-500">
                              <CheckIcon className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-xs text-body">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-muted">
                      Email and X handle are used only to communicate about this submission and promote your app. See our{" "}
                      <Link to="/privacy" className="text-ink underline underline-offset-2">
                        privacy policy
                      </Link>
                      .
                    </p>

                    {/* Dynamic Primary CTA Button */}
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      data-ml-goal={paid ? "checkout_click" : "signup_click"}
                      data-ml-goal-plan={selectedPlan}
                      className={`w-full rounded-xl px-6 py-3.5 text-sm font-semibold transition-all shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
                        selectedPlan === "article"
                          ? "bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white"
                          : selectedPlan === "featured"
                            ? "bg-sky-600 text-white"
                            : "bg-ink text-canvas"
                      }`}
                    >
                      {sending
                        ? "Processing submission…"
                        : !hasEmail && !hasXHandle
                          ? "Enter email & X handle to submit"
                          : !hasEmail
                            ? "Enter your email to submit"
                            : !hasXHandle
                              ? "Enter your X handle to submit"
                              : paid && isSelectedTierFull
                                ? "This tier is full · Select another plan"
                                : alreadyListed
                                  ? paid
                                    ? selectedPlan === "article"
                                      ? `Upgrade to Gold Sponsor · $${articlePrice} (Top 3 Spot + Medium Article)`
                                      : `Upgrade to Blue Sponsor · $${featuredPrice} (Top 6 Spot)`
                                    : badge === "ok"
                                      ? "Submit Listing Update"
                                      : "Verify badge to submit update"
                                  : selectedPlan === "article"
                                    ? `Continue to Payment · $${articlePrice} (Express 2h + Medium Article)`
                                    : selectedPlan === "featured"
                                      ? `Continue to Payment · $${featuredPrice} (Top 6 Spot)`
                                      : badge === "ok"
                                        ? "Submit Free Listing"
                                        : "Verify badge to submit"}
                    </button>
                  </form>
                </div>

                {/* Right Sticky Sidebar */}
                <div className="lg:col-span-5 xl:col-span-4">
                  <div className="sticky top-24 space-y-5">
                    {/* Why list on PickMacApps */}
                    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
                      <h3 className="font-display text-lg font-bold text-ink">Why list on PickMacApps?</h3>
                      <div className="space-y-3.5 text-xs text-body leading-relaxed">
                        <div className="flex gap-2.5">
                          <span className="text-base shrink-0">🎯</span>
                          <div>
                            <strong className="text-ink font-semibold">Curated Mac Audience:</strong> Reach thousands of active macOS developers, designers, and enthusiasts looking for quality software.
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="text-base shrink-0">🚀</span>
                          <div>
                            <strong className="text-ink font-semibold">Strict Slot Scarcity:</strong> Paid hero slots are strictly capped at 3 Blue + 3 Gold apps, guaranteeing you high visibility instead of getting buried.
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="text-base shrink-0">🔗</span>
                          <div>
                            <strong className="text-ink font-semibold">Powerful SEO Backlinks:</strong> Both featured tiers include high-quality dofollow backlinks to boost your domain authority and organic rankings.
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="text-base shrink-0">⏳</span>
                          <div>
                            <strong className="text-ink font-semibold">Permanent Directory Home:</strong> After your 30-day top rotation, your listing remains permanently in the catalog at no extra charge.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Placement FAQ Card */}
                    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-3.5">
                      <h3 className="font-display text-base font-bold text-ink">Frequently asked questions</h3>
                      <div className="space-y-3 text-xs text-body leading-relaxed">
                        <div>
                          <p className="font-semibold text-ink">What is the Medium article?</p>
                          <p className="mt-0.5 text-muted">
                            For the $120 tier, Firoj Alam writes and publishes a dedicated in-depth review article featuring your app on his high-authority Medium publication with dofollow backlinks.
                          </p>
                        </div>
                        <div className="pt-2 border-t border-line/60">
                          <p className="font-semibold text-ink">How fast will my app be reviewed?</p>
                          <p className="mt-0.5 text-muted">
                            Gold tier submissions are approved within 2 hours. Blue tier submissions are approved within 24 hours. Free submissions take 3-5 business days.
                          </p>
                        </div>
                        <div className="pt-2 border-t border-line/60">
                          <p className="font-semibold text-ink">What happens when slots sell out?</p>
                          <p className="mt-0.5 text-muted">
                            When 3 apps are active in a tier, that tier is marked Sold Out until the 30-day cycle finishes or an app expires. The other tier remains available.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <div
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
        selected ? "border-accent bg-accent" : "border-line-2"
      }`}
    >
      {selected ? <CheckIcon className="h-3 w-3 text-white" /> : null}
    </div>
  );
}
