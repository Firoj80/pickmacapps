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
  tier?: "featured" | "article" | "free";
  submitted?: string;
  payment_id?: string;
  subscription_id?: string;
  status?: string;
};

export const Route = createFileRoute("/submit")({
  validateSearch: (search: Record<string, unknown>): SubmitSearch => ({
    tier:
      search.tier === "featured" || search.tier === "article" || search.tier === "free"
        ? (search.tier as "featured" | "article" | "free")
        : undefined,
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
  { label: "Your app is functional" },
  { label: "It delivers what it promises" },
  { label: "Is not an infoproduct" },
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

  // Default to Editor's Choice ("featured") matching macapp.supply/submit design
  const [selectedPlan, setSelectedPlan] = useState<"featured" | "free" | "article">(() => {
    if (tier === "article" && !articleSlots.isFull) return "article";
    if (tier === "free") return "free";
    return "featured";
  });

  const isPaid = selectedPlan === "featured" || selectedPlan === "article";
  const [showModal, setShowModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
  const currentCompare = selectedPlan === "article" ? articleCompare : featuredCompare;
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

  async function handleFinalSubmit(event: React.FormEvent) {
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
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="w-full px-5 md:px-8 xl:px-12 py-8 sm:py-12 lg:py-14 max-w-6xl mx-auto">
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
            {/* Top Heading matching macapp.supply/submit screenshot */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-ink">
                Submit Your Mac App
              </h1>

              {/* Discreet Plan Switcher Pills */}
              <div className="inline-flex items-center rounded-xl border border-line bg-surface p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedPlan("featured")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    selectedPlan === "featured"
                      ? "bg-ink text-canvas shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  Editor's Choice ($39)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan("free")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    selectedPlan === "free"
                      ? "bg-ink text-canvas shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  Free Listing ($0)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan("article")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    selectedPlan === "article"
                      ? "bg-ink text-canvas shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  Gold Spotlight ($120)
                </button>
              </div>
            </div>

            {/* 2-Column Split Layout matching macapp.supply/submit screenshot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Left Column: Price Card, Checklist & Primary Action */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xs font-semibold text-muted mb-2.5">
                    {selectedPlan === "free" ? "Free Community Tier" : "Price"}
                  </h2>

                  {/* Main Price Card matching screenshot */}
                  <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7 shadow-xs relative transition-all">
                    {/* Top Row with Badge & Circular Checkmark */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {selectedPlan === "article" ? (
                          <span className="inline-flex items-center rounded-md bg-gradient-to-r from-amber-500 to-fuchsia-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs">
                            🌟 Gold Tier · Top #1 Placement
                          </span>
                        ) : selectedPlan === "free" ? (
                          <span className="inline-flex items-center rounded-md bg-stone-200/80 px-2.5 py-0.5 text-xs font-semibold text-stone-800 dark:bg-stone-800 dark:text-stone-200">
                            Community Tier
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-ink">
                            Editor's Choice
                          </span>
                        )}

                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="font-display text-3xl sm:text-4xl font-extrabold text-ink">
                            ${currentPrice}
                          </span>
                          {selectedPlan !== "free" && (
                            <>
                              <span className="text-sm text-muted line-through">${currentCompare}</span>
                              <span className="text-sm text-muted">one-time</span>
                            </>
                          )}
                          {selectedPlan === "free" && (
                            <span className="text-xs text-muted">free forever</span>
                          )}
                        </div>

                        {selectedPlan === "free" ? (
                          <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                            * Requires PickMacApps backlink badge on your website
                          </p>
                        ) : (
                          <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>
                              {selectedPlan === "article"
                                ? articleSlots.isFull
                                  ? "🔴 Sold out for this week"
                                  : `* Only ${articleSlots.remaining} spot remaining for this week`
                                : featuredSlots.isFull
                                  ? "🔴 Sold out for this week"
                                  : `* Only ${featuredSlots.remaining} spot remaining for this week`}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Top Right Blue Check Circle matching reference */}
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0071e3] text-white">
                        <CheckIcon className="h-3.5 w-3.5 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* 6 Value Prop Bullets matching screenshot */}
                    <ul className="mt-6 space-y-3 border-t border-line/70 pt-5 text-xs text-body">
                      {selectedPlan === "article" ? (
                        <>
                          <li className="flex items-start gap-2.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>
                              <strong className="text-ink font-semibold">#1 Priority Top Placement</strong> on our directory for 30 days
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>
                              After 30 days, you get <strong className="text-ink font-semibold">listed permanently</strong> on the directory
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>
                              <strong className="text-ink font-semibold">Featured at the top</strong> of alternative pages
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>
                              <strong className="text-ink font-semibold">Dedicated blog post</strong> for your app, including competitor comparisons
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>
                              <strong className="text-ink font-semibold">High-quality backlink</strong> to boost your SEO
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>
                              <strong className="text-ink font-semibold">Hundreds of monthly visitors</strong> discovering your app
                            </span>
                          </li>
                        </>
                      ) : selectedPlan === "free" ? (
                        <>
                          <li className="flex items-start gap-2.5">
                            <span className="text-stone-500 font-bold shrink-0">✓</span>
                            <span>
                              <strong className="text-ink font-semibold">Permanent directory catalog listing</strong> in category & search
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-stone-500 font-bold shrink-0">✓</span>
                            <span>
                              <strong className="text-ink font-semibold">Standard dofollow backlink</strong> to your website
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-amber-600 font-bold shrink-0">⚠️</span>
                            <span>
                              <strong className="text-ink font-semibold">Reciprocal badge required</strong> on your landing page before approval
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-stone-500 font-bold shrink-0">✓</span>
                            <span>Standard manual editorial review (3–5 business days)</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start gap-2.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>
                              <strong className="text-ink font-semibold">Top 3 placement</strong> on our directory for 1 week
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>
                              After 1 week, you get <strong className="text-ink font-semibold">listed permanently</strong> on the directory
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>
                              <strong className="text-ink font-semibold">Featured at the top</strong> of alternative pages
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>
                              <strong className="text-ink font-semibold">Dedicated blog post</strong> for your app, including competitor comparisons
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>
                              <strong className="text-ink font-semibold">High-quality backlink</strong> to boost your SEO
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>
                              <strong className="text-ink font-semibold">Hundreds of monthly visitors</strong> discovering your app
                            </span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Quality Checklist section matching screenshot */}
                <div>
                  <h2 className="text-sm font-semibold text-ink mb-3">Checklist</h2>
                  <div className="space-y-3">
                    {checks.map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#10b981] text-white shadow-2xs">
                          <CheckIcon className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-ink">{item.label}</span>
                      </div>
                    ))}
                    {selectedPlan === "free" && (
                      <div className="flex items-center gap-3">
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${badge === "ok" ? "bg-[#10b981]" : "bg-amber-500"} text-white shadow-2xs`}>
                          <CheckIcon className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-ink">PickMacApps reciprocal badge on your site</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Free Plan Badge & Form Block (Only in free mode) */}
                {selectedPlan === "free" ? (
                  <form onSubmit={handleFinalSubmit} className="space-y-4 pt-2">
                    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
                      <h3 className="text-sm font-semibold text-ink">App details for free submission</h3>

                      <div className="space-y-1.5">
                        <label htmlFor="free_website" className="text-xs font-medium text-body">
                          Website URL <span className="text-accent">*</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="free_website"
                            required
                            type="url"
                            placeholder="https://yourmacapp.com"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className={field}
                          />
                          <button
                            type="button"
                            disabled={fetching || !website.trim()}
                            onClick={() => void handleAutoFetch()}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-accent hover:bg-accent/5 disabled:opacity-50 cursor-pointer"
                          >
                            {fetching ? (
                              <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <SparklesIcon className="h-3.5 w-3.5 text-accent" />
                            )}
                            <span>Auto-fetch</span>
                          </button>
                        </div>
                      </div>

                      {fetchStatus === "success" && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                          {fetchMessage}
                        </div>
                      )}
                      {fetchStatus === "error" && (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                          {fetchMessage}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="free_email" className="mb-1 block text-xs font-medium text-body">
                            Email <span className="text-accent">*</span>
                          </label>
                          <input
                            id="free_email"
                            required
                            type="email"
                            placeholder="developer@yourdomain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={field}
                          />
                        </div>
                        <div>
                          <label htmlFor="free_x" className="mb-1 block text-xs font-medium text-body">
                            X (Twitter) handle <span className="text-accent">*</span>
                          </label>
                          <input
                            id="free_x"
                            required
                            type="text"
                            placeholder="@username"
                            value={xHandle}
                            onChange={(e) => setXHandle(e.target.value)}
                            className={field}
                          />
                        </div>
                      </div>

                      {/* Reciprocal Badge embed block */}
                      <div className="rounded-xl border border-line bg-surface-2 p-3.5 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-ink">
                          <span>Reciprocal badge code</span>
                          <button
                            type="button"
                            onClick={copyBadge}
                            className="text-accent hover:underline cursor-pointer"
                          >
                            {copied ? "Copied!" : "Copy Code"}
                          </button>
                        </div>
                        <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-2.5 text-[11px] text-body">
                          <code>{badgeHtml}</code>
                        </pre>
                        <button
                          type="button"
                          disabled={badge === "checking" || !website.trim()}
                          onClick={() => void checkBadge()}
                          className="w-full py-2 px-3 rounded-lg border border-line bg-surface text-xs font-semibold text-ink hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
                        >
                          {badge === "checking" ? "Checking website for badge…" : "🔍 Check My Badge Now"}
                        </button>
                        {badgeMessage && (
                          <p className={`text-xs ${badge === "ok" ? "text-emerald-600" : "text-amber-600"}`}>
                            {badgeMessage}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full rounded-xl bg-ink py-3.5 px-6 text-sm font-semibold text-canvas transition hover:opacity-90 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? "Submitting…" : badge === "ok" ? "Submit Free Listing" : "Verify Badge to Submit Free"}
                    </button>
                  </form>
                ) : (
                  /* Paid Listing CTA matching screenshot */
                  <div>
                    <button
                      type="button"
                      disabled={isSelectedTierFull}
                      onClick={() => setShowModal(true)}
                      className="w-full rounded-xl bg-ink py-3.5 px-6 text-sm sm:text-base font-semibold text-canvas transition hover:opacity-90 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSelectedTierFull
                        ? "Sold Out for this week"
                        : `Get listed for $${currentPrice}`}
                    </button>
                    <p className="mt-3 text-center text-xs text-muted">
                      You'll get a form link to submit your app details after successful payment.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: 4 Testimonials matching macapp.supply/submit screenshot */}
              <div className="space-y-4">
                {testimonials.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs transition hover:border-line-2"
                  >
                    {/* Large subtle quote glyph */}
                    <div className="text-3xl font-serif text-muted/40 leading-none select-none mb-3">
                      “
                    </div>
                    <p className="text-xs sm:text-sm text-body leading-relaxed">
                      {t.quote}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs ${t.avatarBg}`}
                      >
                        {t.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-ink leading-tight">
                          {t.name}
                        </div>
                        <div className="text-[11px] text-muted mt-0.5">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Paid Checkout Modal (Opened on "Get listed for $XX") */}
        {showModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
          >
            <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="text-base font-bold text-ink">
                    Get listed for ${currentPrice}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {selectedPlan === "article" ? "Gold Spotlight Tier" : "Editor's Choice Placement"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFinalSubmit} className="space-y-3.5">
                {/* Website URL + Auto-fetch */}
                <div className="space-y-1">
                  <label htmlFor="modal_website" className="text-xs font-medium text-body">
                    Website URL <span className="text-accent">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="modal_website"
                      required
                      type="url"
                      placeholder="https://yourmacapp.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className={field}
                    />
                    <button
                      type="button"
                      disabled={fetching || !website.trim()}
                      onClick={() => void handleAutoFetch()}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs font-semibold text-ink transition hover:border-accent hover:bg-accent/5 disabled:opacity-50 cursor-pointer"
                    >
                      {fetching ? (
                        <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <SparklesIcon className="h-3.5 w-3.5 text-accent" />
                      )}
                      <span>Auto-fetch</span>
                    </button>
                  </div>
                </div>

                {fetchStatus === "success" && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-800 dark:text-emerald-300">
                    {fetchMessage}
                  </div>
                )}

                {/* Email + X Handle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal_email" className="mb-1 block text-xs font-medium text-body">
                      Your Email <span className="text-accent">*</span>
                    </label>
                    <input
                      id="modal_email"
                      required
                      type="email"
                      placeholder="developer@yourdomain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={field}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal_x" className="mb-1 block text-xs font-medium text-body">
                      X (Twitter) handle <span className="text-accent">*</span>
                    </label>
                    <input
                      id="modal_x"
                      required
                      type="text"
                      placeholder="@username"
                      value={xHandle}
                      onChange={(e) => setXHandle(e.target.value)}
                      className={field}
                    />
                  </div>
                </div>

                {/* Accordion for optional fields */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
                  >
                    <ChevronIcon className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                    <span>{showAdvanced ? "Hide optional fields" : "Customize name, category & tagline ▾"}</span>
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-2.5 border-t border-line pt-3">
                      <div>
                        <label htmlFor="modal_name" className="mb-1 block text-xs font-medium text-body">App name</label>
                        <input id="modal_name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Raycast" className={field} />
                      </div>
                      <div>
                        <label htmlFor="modal_tagline" className="mb-1 block text-xs font-medium text-body">Tagline</label>
                        <input id="modal_tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Short one-line description" className={field} />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label htmlFor="modal_category" className="mb-1 block text-xs font-medium text-body">Category</label>
                          <select id="modal_category" value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
                            {shelfCategories.map((c) => (
                              <option key={c.slug} value={c.slug}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="modal_pricing" className="mb-1 block text-xs font-medium text-body">Pricing Model</label>
                          <select id="modal_pricing" value={pricing} onChange={(e) => setPricing(e.target.value as "free" | "freemium" | "paid")} className={field}>
                            <option value="free">Free</option>
                            <option value="freemium">Freemium</option>
                            <option value="paid">Paid</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sending || !hasEmail || !hasXHandle || !website.trim()}
                    className="w-full rounded-xl bg-ink py-3 px-5 text-sm font-bold text-canvas transition hover:opacity-90 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? "Redirecting to checkout…" : `Proceed to Secure Checkout ($${currentPrice}) →`}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-muted">
                    Instant access to private submitter dashboard after payment.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
