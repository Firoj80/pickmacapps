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
  tier?: "article" | "featured" | "free";
  submitted?: string;
  payment_id?: string;
  subscription_id?: string;
  status?: string;
  currency?: string;
  coupon?: string;
};

export const Route = createFileRoute("/submit")({
  validateSearch: (search: Record<string, unknown>): SubmitSearch => ({
    tier:
      search.tier === "article" || search.tier === "featured" || search.tier === "free"
        ? (search.tier as "article" | "featured" | "free")
        : undefined,
    submitted: search.submitted ? String(search.submitted) : undefined,
    payment_id: search.payment_id ? String(search.payment_id) : undefined,
    subscription_id: search.subscription_id ? String(search.subscription_id) : undefined,
    status: search.status ? String(search.status) : undefined,
    currency: typeof search.currency === "string" ? String(search.currency).slice(0, 10) : undefined,
    coupon: typeof search.coupon === "string" ? String(search.coupon).trim().slice(0, 20) : undefined,
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

const testimonials = [
  {
    quote: "I liked this idea of sharing Mac Apps made by indie hackers so I've submitted Photsy to be listed here 😊",
    name: "Shravan",
    xHandle: "shrav_10",
    role: "Founder, Photsy",
    initials: "SH",
    avatarBg: "bg-indigo-600",
    avatarUrl: "https://unavatar.io/x/shrav_10",
  },
  {
    quote: "Looks solid! Thanks for including Shedi 💜",
    name: "Abdiraimov",
    xHandle: "abdiraimov_",
    role: "Founder, Shedi",
    initials: "AB",
    avatarBg: "bg-purple-600",
    avatarUrl: "https://unavatar.io/x/abdiraimov_",
  },
  {
    quote: "Thanks for including both Notchy and Peekaboo!",
    name: "Vishva Variya",
    xHandle: "vishvavariya",
    role: "Founder, Notchy & Peekaboo",
    initials: "VV",
    avatarBg: "bg-emerald-600",
    avatarUrl: "https://unavatar.io/x/vishvavariya",
  },
  {
    quote: "Great to see Hoply in the list! Thank you for including it.",
    name: "Milos",
    xHandle: "milos5611",
    role: "Founder, Hoply",
    initials: "MI",
    avatarBg: "bg-amber-600",
    avatarUrl: "https://unavatar.io/x/milos5611",
  },
];

const inputFieldClass =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-muted focus:border-accent focus:outline-none";

function SubmitPage() {
  const offer = Route.useLoaderData();
  const search = Route.useSearch();
  const { tier, payment_id, submitted, coupon: searchCoupon } = search;

  // Coupon state — auto-apply BFCM50 by default
  const [couponInput, setCouponInput] = useState(() => (searchCoupon ?? "BFCM50").toUpperCase());
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() => {
    const raw = (searchCoupon ?? "BFCM50").trim().toUpperCase();
    return raw === "BFCM50" ? "BFCM50" : null;
  });
  const [couponError, setCouponError] = useState<string | null>(null);

  // Auto-sync coupon from search params if passed
  useEffect(() => {
    if (searchCoupon) {
      const raw = searchCoupon.trim().toUpperCase();
      if (raw === "BFCM50") {
        setAppliedCoupon("BFCM50");
        setCouponInput("BFCM50");
      }
    }
  }, [searchCoupon]);

  const applyCoupon = (code: string) => {
    const upper = code.trim().toUpperCase();
    if (upper === "BFCM50") {
      setAppliedCoupon("BFCM50");
      setCouponError(null);
    } else if (upper) {
      setCouponError("Invalid coupon code.");
    } else {
      setAppliedCoupon(null);
      setCouponError(null);
    }
  };

  const isBfcm = appliedCoupon === "BFCM50";
  const discountMultiplier = isBfcm ? 0.5 : 1.0;

  // Pricing calculations
  // Hot Boost (tier === "featured")
  const rawHotDollars = Math.round((offer.featuredPriceCents ?? 9900) / 100);
  const hotBaseDollars = Math.round(rawHotDollars * discountMultiplier);
  const hotCompareDollars = isBfcm ? rawHotDollars : Math.round((offer.featuredCompareCents ?? 19900) / 100);

  // Gold Spotlight (tier === "article")
  const rawGoldDollars = Math.round((offer.articlePriceCents ?? 12000) / 100);
  const goldBaseDollars = Math.round(rawGoldDollars * discountMultiplier);
  const goldCompareDollars = isBfcm ? rawGoldDollars : Math.round((offer.articleCompareCents ?? 24900) / 100);

  // Slot calculations
  const hotSlots = offer.hotSlots ?? {
    total: 6,
    active: 0,
    remaining: 6,
    isFull: false,
    nextDate: "7 days",
  };
  const articleSlots = offer.articleSlots ?? {
    total: 6,
    active: 0,
    remaining: 6,
    isFull: false,
    nextDate: "7 days",
  };

  // Plan Selection: "free" | "featured" (Hot Boost) | "article" (Gold Spotlight)
  const [selectedPlan, setSelectedPlan] = useState<"free" | "featured" | "article">(() => {
    if (tier === "article" && !articleSlots.isFull) return "article";
    if (tier === "featured" && !hotSlots.isFull) return "featured";
    if (tier === "free") return "free";
    return "featured"; // Default to Hot Boost
  });

  // Auto-sync plan when tier in search changes
  useEffect(() => {
    if (tier === "article" && !articleSlots.isFull) {
      setSelectedPlan("article");
    } else if (tier === "featured" && !hotSlots.isFull) {
      setSelectedPlan("featured");
    } else if (tier === "free") {
      setSelectedPlan("free");
    }
  }, [tier, articleSlots.isFull, hotSlots.isFull]);

  // App details form state
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

  // Auto-fetch state
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

  // Badge state for Free tier
  const [copied, setCopied] = useState(false);
  const [badgeVariant, setBadgeVariant] = useState<"logo" | "classic" | "dark">("logo");
  const [badge, setBadge] = useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [badgeMessage, setBadgeMessage] = useState("");

  // Submission process state
  const [sent, setSent] = useState(() => Boolean(submitted || payment_id));
  const [sending, setSending] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    if (payment_id) {
      trackGoal("payment_completed", { payment_id, status: search.status ?? "success" });
      setSent(true);
    }
  }, [payment_id, search.status]);

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
            : "Metadata extracted successfully! You can review and tweak the details below.",
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

  const isPaid = selectedPlan !== "free";
  const hasEmail = Boolean(email.trim() && email.includes("@"));
  const hasXHandle = Boolean(xHandle.trim());
  const badgeOk = isPaid || badge === "ok";
  const isSelectedTierFull =
    (selectedPlan === "featured" && hotSlots.isFull) ||
    (selectedPlan === "article" && articleSlots.isFull);

  async function handleFinalSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSubmissionError(null);

    if (!website.trim()) {
      setSubmissionError("Website URL is required.");
      return;
    }
    if (!name.trim()) {
      setSubmissionError("App name is required.");
      return;
    }
    if (!hasEmail) {
      setSubmissionError("A valid developer email is required so we can notify you.");
      return;
    }
    if (!hasXHandle) {
      setSubmissionError("Your X (Twitter) handle is required.");
      return;
    }
    if (!isPaid && badge !== "ok") {
      setSubmissionError("Please verify the PickMacApps badge on your website before submitting free listing.");
      return;
    }
    if (isSelectedTierFull) {
      setSubmissionError("The selected placement tier is currently sold out for this cycle. Please pick another tier.");
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

    const activePrice =
      selectedPlan === "free"
        ? "0"
        : selectedPlan === "featured"
          ? String(hotBaseDollars)
          : String(goldBaseDollars);

    trackGoal(isPaid ? "checkout_click" : "signup_click", {
      plan: selectedPlan,
      price: activePrice,
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
          tier: selectedPlan === "free" ? "free" : selectedPlan === "featured" ? "featured" : "article",
          currency: "USD",
          coupon: appliedCoupon ?? undefined,
          mlVisitorId: attr.ml_visitor_id,
          mlSessionId: attr.ml_session_id,
        },
      });

      if (result.checkoutUrl) {
        trackGoal("checkout_redirect", {
          plan: selectedPlan,
          price: activePrice,
          appName: name.trim(),
        });
        window.location.href = appendAttributionToUrl(result.checkoutUrl);
        return;
      }

      if (result.ok) {
        trackGoal("signup_completed", {
          plan: selectedPlan,
          price: activePrice,
          appName: name.trim(),
        });
        if (result.dashboardToken) {
          window.location.href = `/dashboard/${result.dashboardToken}?new=1`;
          return;
        }
        setSent(true);
      } else {
        setSubmissionError(result.message);
      }
    } catch {
      setSubmissionError("The submission could not be processed. Please check your network and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased selection:bg-accent/20">
      <div className="mx-auto w-full max-w-[880px] px-6 md:px-10 pt-12 pb-24 md:pt-16">
        {/* Top Back Link matching macapp.supply */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink mb-8 transition cursor-pointer"
        >
          <span aria-hidden="true">←</span>
          <span>Back to apps</span>
        </Link>

        {sent ? (
          /* Submission Confirmation View matching macapp.supply */
          <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
              <CheckIcon className="h-9 w-9 stroke-[2.5]" />
            </div>

            <h1 className="font-display text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-ink md:text-[56px]">
              Thank you!
            </h1>

            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              {alreadyListed ? (
                <>
                  Update received for <strong className="text-ink">{name || alreadyListed.name}</strong>. We’ll review your changes and apply them to your live listing (<a href={`/app/${alreadyListed.slug}`} target="_blank" rel="noreferrer" className="underline font-medium hover:text-ink">/app/{alreadyListed.slug}</a>).
                </>
              ) : (
                <>
                  Your app is in our review queue. We’ll email you at{" "}
                  <span className="text-ink font-semibold">{email}</span> once it’s approved and live.
                </>
              )}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/"
                className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition hover:opacity-90 cursor-pointer"
              >
                Browse directory
              </Link>
              <button
                type="button"
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
                className="rounded-full border border-line bg-surface px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-2 cursor-pointer"
              >
                Submit another app
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header / Intro matching macapp.supply */}
            <div className="space-y-3">
              <h1 className="font-display text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-ink md:text-[52px]">
                Submit an app
              </h1>
              <p className="max-w-lg text-[15px] leading-relaxed text-muted">
                Share your Mac app with thousands of macOS power users, designers, and developers. Every submission is manually reviewed.
              </p>
            </div>

            {/* Black Friday Discount Pill Banner */}
            {isBfcm && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-400">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>🔥 Black Friday 50% OFF active! Promo code <span className="font-mono underline">BFCM50</span> applied across all paid tiers.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponInput("");
                  }}
                  className="text-[11px] text-amber-400/80 hover:text-amber-300 cursor-pointer"
                  title="Remove coupon"
                >
                  ✕ Remove
                </button>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleFinalSubmit} className="mt-10 space-y-8">
              {/* SECTION 1: The App Card matching macapp.supply */}
              <div className="rounded-2xl border border-line bg-surface p-6 md:p-8 space-y-6">
                <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                  The app
                </h2>

                {/* Website URL + Analyze Button */}
                <div className="space-y-2">
                  <label htmlFor="website" className="text-xs font-medium text-ink">
                    Website URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="website"
                      type="url"
                      required
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourmacapp.com"
                      className={inputFieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => void handleAutoFetch()}
                      disabled={fetching || !website.trim()}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-xs font-semibold text-ink transition hover:border-accent hover:bg-accent/10 disabled:opacity-50 cursor-pointer"
                    >
                      {fetching ? (
                        <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <SparklesIcon className="h-3.5 w-3.5 text-accent" />
                      )}
                      <span>Analyze</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted">
                    Tap Analyze to auto-fill the name, tagline, description, icon and details.
                  </p>

                  {fetchStatus === "success" && (
                    <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                      {fetchMessage}
                    </div>
                  )}
                  {fetchStatus === "error" && (
                    <div className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                      {fetchMessage}
                    </div>
                  )}
                </div>

                {/* App Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-medium text-ink">
                    App name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Raycast"
                    className={inputFieldClass}
                  />
                </div>

                {/* Short Description (Tagline) with 60-char counter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="tagline" className="text-xs font-medium text-ink">
                      Short description <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-[11px] tabular-nums ${
                        tagline.length > 60 ? "text-amber-400 font-semibold" : "text-muted"
                      }`}
                    >
                      {tagline.length}/60
                    </span>
                  </div>
                  <input
                    id="tagline"
                    type="text"
                    required
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="One sharp line that sums up what the app does."
                    className={inputFieldClass}
                  />
                </div>

                {/* Long Description with Markdown guide chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="description" className="text-xs font-medium text-ink">
                      Long description
                    </label>
                    <span className="text-[11px] tabular-nums text-muted">
                      {description.length}/6000 · optional
                    </span>
                  </div>
                  <textarea
                    id="description"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed description of what your app does, core features, keyboard shortcuts, and who it's for."
                    className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-muted focus:border-accent focus:outline-none resize-y"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted">
                    <span className="font-medium text-ink">Markdown supported:</span>
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono border border-line">## Heading</span>
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono border border-line">**bold**</span>
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono border border-line">*italic*</span>
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono border border-line">[text](url)</span>
                  </div>
                </div>

                {/* Category & Pricing Model (2-column grid) */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-xs font-medium text-ink">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none cursor-pointer"
                    >
                      {shelfCategories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="pricing" className="text-xs font-medium text-ink">
                      Pricing <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="pricing"
                      value={pricing}
                      onChange={(e) => setPricing(e.target.value as "free" | "freemium" | "paid")}
                      className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none cursor-pointer"
                    >
                      <option value="free">Free</option>
                      <option value="freemium">Freemium</option>
                      <option value="paid">Paid (one-time or subscription)</option>
                    </select>
                  </div>
                </div>

                {/* App Icon URL & Live Preview */}
                <div className="space-y-2">
                  <label htmlFor="icon" className="text-xs font-medium text-ink">
                    App icon URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface-2 overflow-hidden shadow-xs">
                      {icon.trim() ? (
                        <img
                          src={icon.trim()}
                          alt={name || "App icon"}
                          className="h-14 w-14 rounded-2xl object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-[10px] text-muted text-center px-1">No icon</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        id="icon"
                        type="url"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="https://yourmacapp.com/icon.png"
                        className={inputFieldClass}
                      />
                      <p className="mt-1 text-[11px] text-muted">
                        Auto-detected by Analyze, or paste an image URL (PNG, JPG or WebP).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cover Image or Demo Preview (1200x630) */}
                <div className="space-y-2">
                  <label htmlFor="demo" className="text-xs font-medium text-ink">
                    Cover image or Demo URL (1200×630) · optional
                  </label>
                  <input
                    id="demo"
                    type="url"
                    value={demo}
                    onChange={(e) => setDemo(e.target.value)}
                    placeholder="https://yourmacapp.com/og-image.png"
                    className={inputFieldClass}
                  />
                  {demo.trim() && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-line bg-surface-2 aspect-[1200/630] max-h-48 flex items-center justify-center">
                      <img
                        src={demo.trim()}
                        alt="Preview cover"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Developer Contact (2-column grid) */}
                <div className="grid gap-5 sm:grid-cols-2 pt-2 border-t border-line/60">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-medium text-ink">
                      Developer email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="developer@yourdomain.com"
                      className={inputFieldClass}
                    />
                    <p className="text-[11px] text-muted">We’ll send review and approval status updates here.</p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="xHandle" className="text-xs font-medium text-ink">
                      X (Twitter) handle <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="xHandle"
                      type="text"
                      required
                      value={xHandle}
                      onChange={(e) => setXHandle(e.target.value)}
                      placeholder="@username"
                      className={inputFieldClass}
                    />
                    <p className="text-[11px] text-muted">Used to tag you in launch announcements on X.</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Placement Plan Selector */}
              <div className="rounded-2xl border border-line bg-surface p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                    Choose your placement plan
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    Select how you would like your app to be listed and prioritized in the directory.
                  </p>
                </div>

                {/* 3-Tier Placement Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  {/* Card 1: Free Community Tier */}
                  <div
                    onClick={() => setSelectedPlan("free")}
                    className={`relative flex flex-col justify-between rounded-2xl border p-5 transition cursor-pointer ${
                      selectedPlan === "free"
                        ? "border-line-2 bg-surface-2 ring-2 ring-line-2 shadow-xs"
                        : "border-line bg-surface/60 hover:border-line-2 hover:bg-surface-2/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-md bg-stone-800 px-2 py-0.5 text-[11px] font-semibold text-stone-200">
                          Community
                        </span>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                            selectedPlan === "free"
                              ? "border-ink bg-ink text-canvas"
                              : "border-line bg-surface-2 text-transparent"
                          }`}
                        >
                          <CheckIcon className="h-3 w-3 stroke-[3]" />
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="font-display text-2xl font-bold text-ink">$0</div>
                        <div className="text-[11px] text-muted">Free forever with badge</div>
                      </div>

                      <ul className="mt-4 space-y-2 text-xs text-body border-t border-line/60 pt-3">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Permanent directory listing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Standard dofollow backlink</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">⚠️</span>
                          <span className="font-medium text-amber-300">Requires reciprocal badge</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-stone-400 font-bold">•</span>
                          <span>Standard review (1–2 weeks)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-5 pt-3 border-t border-line/60 text-[11px] text-muted">
                      Best for hobbyists and side projects.
                    </div>
                  </div>

                  {/* Card 2: 🔥 Hot Boost (Highlighted Tier) */}
                  <div
                    onClick={() => !hotSlots.isFull && setSelectedPlan("featured")}
                    className={`relative flex flex-col justify-between rounded-2xl border p-5 transition cursor-pointer ${
                      hotSlots.isFull
                        ? "opacity-60 cursor-not-allowed border-line bg-surface/40"
                        : selectedPlan === "featured"
                          ? "border-orange-500/80 bg-orange-500/10 ring-2 ring-orange-500/50 shadow-md"
                          : "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                          <span>🔥</span>
                          <span>Hot Boost</span>
                        </span>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                            selectedPlan === "featured"
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-line bg-surface-2 text-transparent"
                          }`}
                        >
                          <CheckIcon className="h-3 w-3 stroke-[3]" />
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-2xl font-bold text-ink">
                            ${hotBaseDollars}
                          </span>
                          <span className="text-xs text-muted line-through font-medium">
                            ${hotCompareDollars}
                          </span>
                          <span className="text-[11px] text-muted">one-time</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-orange-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                          <span>
                            {hotSlots.isFull
                              ? "Sold out for this week"
                              : `⚡ ${hotSlots.remaining} of 6 spots left`}
                          </span>
                        </div>
                      </div>

                      {/* User's exact requirements for Hot Boost */}
                      <ul className="mt-4 space-y-2 text-xs text-body border-t border-orange-500/20 pt-3">
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 font-bold">🔥</span>
                          <span>
                            <strong className="text-ink">Top of all free listing apps</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 font-bold">⏱️</span>
                          <span>
                            <strong className="text-ink">7 days duration</strong> boost
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 font-bold">🥈</span>
                          <span>
                            <strong className="text-ink">Just right after Golden badge apps</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 font-bold">✨</span>
                          <span>
                            <strong className="text-ink">In hero section app icon</strong> carousel
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 font-bold">🏷️</span>
                          <span>
                            Distinct <strong className="text-ink">Fire badge (🔥 Hot)</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>
                            <strong className="text-ink">No backlinks or badges required</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Fast-track 24h editorial review</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Permanent directory listing after 7 days</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-5 pt-3 border-t border-orange-500/20 text-[11px] text-orange-400/90 font-medium">
                      Maximum 6 spots active simultaneously.
                    </div>
                  </div>

                  {/* Card 3: 🌟 Gold Spotlight Tier */}
                  <div
                    onClick={() => !articleSlots.isFull && setSelectedPlan("article")}
                    className={`relative flex flex-col justify-between rounded-2xl border p-5 transition cursor-pointer ${
                      articleSlots.isFull
                        ? "opacity-60 cursor-not-allowed border-line bg-surface/40"
                        : selectedPlan === "article"
                          ? "border-amber-500/80 bg-amber-500/10 ring-2 ring-amber-500/50 shadow-md"
                          : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 text-[11px] font-bold text-stone-950 shadow-2xs">
                          <span>🌟</span>
                          <span>Gold Spotlight</span>
                        </span>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                            selectedPlan === "article"
                              ? "border-amber-500 bg-amber-500 text-stone-950"
                              : "border-line bg-surface-2 text-transparent"
                          }`}
                        >
                          <CheckIcon className="h-3 w-3 stroke-[3]" />
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-2xl font-bold text-ink">
                            ${goldBaseDollars}
                          </span>
                          <span className="text-xs text-muted line-through font-medium">
                            ${goldCompareDollars}
                          </span>
                          <span className="text-[11px] text-muted">one-time</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>
                            {articleSlots.isFull
                              ? "Sold out for this week"
                              : `⚡ ${articleSlots.remaining} of 6 spots left`}
                          </span>
                        </div>
                      </div>

                      <ul className="mt-4 space-y-2 text-xs text-body border-t border-amber-500/20 pt-3">
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">👑</span>
                          <span>
                            <strong className="text-ink">#1 Hero Spot & Top Placement</strong> for 7 days
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">🌟</span>
                          <span>
                            Exclusive <strong className="text-ink">Golden Choice Badge</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">📝</span>
                          <span>
                            <strong className="text-ink">Dedicated Medium review article</strong> (10k+ readers)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">🔝</span>
                          <span>Top spot on competitor comparison pages</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">✨</span>
                          <span>Hero animated app icon in top carousel</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>High-authority SEO dofollow backlink</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Guaranteed 24-hour publishing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Permanent directory listing after 7 days</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-5 pt-3 border-t border-amber-500/20 text-[11px] text-amber-400/90 font-medium">
                      Maximum 6 spots active simultaneously.
                    </div>
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="pt-2 border-t border-line">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="coupon" className="text-xs font-medium text-ink">
                      Discount coupon code
                    </label>
                    {isBfcm && (
                      <span className="text-[11px] font-semibold text-emerald-400">
                        ✓ BFCM50 applied (50% off)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <input
                      id="coupon"
                      type="text"
                      placeholder="e.g. BFCM50"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs font-mono font-bold text-ink uppercase placeholder:normal-case placeholder:font-normal focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => applyCoupon(couponInput)}
                      className="shrink-0 rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="mt-1 text-xs text-rose-400">{couponError}</p>}
                </div>
              </div>

              {/* SECTION 3: Reciprocal Badge Block (Visible only when Free plan selected) */}
              {selectedPlan === "free" && (
                <div className="rounded-2xl border border-line bg-surface p-6 md:p-8 space-y-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink">
                      Reciprocal badge on your website
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      Free community listings require adding our backlink badge to your app website. Once added, click “Check My Badge Now” below to verify.
                    </p>
                  </div>

                  {/* Badge Style Selector */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setBadgeVariant("logo")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                        badgeVariant === "logo"
                          ? "bg-ink text-canvas"
                          : "border border-line bg-surface-2 text-muted hover:text-ink"
                      }`}
                    >
                      Logo badge
                    </button>
                    <button
                      type="button"
                      onClick={() => setBadgeVariant("classic")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                        badgeVariant === "classic"
                          ? "bg-ink text-canvas"
                          : "border border-line bg-surface-2 text-muted hover:text-ink"
                      }`}
                    >
                      Classic badge
                    </button>
                    <button
                      type="button"
                      onClick={() => setBadgeVariant("dark")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                        badgeVariant === "dark"
                          ? "bg-ink text-canvas"
                          : "border border-line bg-surface-2 text-muted hover:text-ink"
                      }`}
                    >
                      Dark badge
                    </button>
                  </div>

                  {/* Badge Preview */}
                  <div className="p-4 rounded-xl border border-line bg-surface-2 flex items-center justify-center">
                    <img
                      src={badgeSrc}
                      alt="Featured on PickMacApps"
                      width={200}
                      height={54}
                      className="h-10 w-auto"
                    />
                  </div>

                  {/* HTML snippet with 1-click copy */}
                  <div className="rounded-xl border border-line bg-surface-2 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-ink">
                      <span>HTML Embed Code</span>
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
                  </div>

                  <button
                    type="button"
                    disabled={badge === "checking" || !website.trim()}
                    onClick={() => void checkBadge()}
                    className="w-full py-2.5 px-4 rounded-xl border border-line bg-surface-2 text-xs font-semibold text-ink hover:border-accent hover:bg-accent/10 transition cursor-pointer disabled:opacity-50"
                  >
                    {badge === "checking" ? "Checking website for badge…" : "🔍 Check My Badge Now"}
                  </button>

                  {badgeMessage && (
                    <p
                      className={`text-xs ${
                        badge === "ok" ? "text-emerald-400 font-medium" : "text-amber-400"
                      }`}
                    >
                      {badgeMessage}
                    </p>
                  )}
                </div>
              )}

              {/* Submission Error Banner */}
              {submissionError && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
                  {submissionError}
                </div>
              )}

              {/* Submit CTA button matching macapp.supply */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={
                    sending ||
                    isSelectedTierFull ||
                    (!isPaid && badge !== "ok") ||
                    !hasEmail ||
                    !hasXHandle ||
                    !website.trim() ||
                    !name.trim()
                  }
                  className={`w-full rounded-full py-3.5 px-6 text-sm md:text-base font-bold transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedPlan === "featured"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-95"
                      : selectedPlan === "article"
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 hover:opacity-95"
                        : "bg-ink text-canvas hover:opacity-90"
                  }`}
                >
                  {sending ? (
                    <span className="inline-flex items-center gap-2">
                      <SpinnerIcon className="h-4 w-4 animate-spin" />
                      <span>{isPaid ? "Proceeding to checkout…" : "Submitting…"}</span>
                    </span>
                  ) : selectedPlan === "free" ? (
                    badge === "ok" ? "Submit for review (Free)" : "Verify badge above to submit free"
                  ) : selectedPlan === "featured" ? (
                    `Proceed to checkout — $${hotBaseDollars} (🔥 Hot Boost)`
                  ) : (
                    `Proceed to checkout — $${goldBaseDollars} (🌟 Gold Spotlight)`
                  )}
                </button>

                <p className="text-center text-[12px] leading-relaxed text-muted">
                  {isPaid
                    ? "Secure checkout by Dodo Payments, powered by Stripe — USD, excl. VAT. Full refund if it doesn't meet our listing guidelines."
                    : "Submissions are reviewed manually by a human editor. Most take 1–2 weeks."}
                </p>
              </div>
            </form>

            {/* Testimonials Section matching macapp.supply */}
            <div className="mt-16 pt-12 border-t border-line space-y-6">
              <div className="text-center space-y-1">
                <h3 className="font-display text-lg font-bold text-ink">
                  Trusted by indie Mac developers
                </h3>
                <p className="text-xs text-muted">
                  Here is what founders say about being listed on PickMacApps.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {testimonials.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-2xl border border-line bg-surface p-5 shadow-xs transition hover:border-line-2"
                  >
                    <div className="text-2xl font-serif text-muted/40 leading-none select-none mb-2">
                      “
                    </div>
                    <p className="text-xs text-body leading-relaxed">{t.quote}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="relative h-9 w-9 shrink-0">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs ${t.avatarBg}`}
                        >
                          {t.initials}
                        </div>
                        {t.avatarUrl && (
                          <img
                            src={t.avatarUrl}
                            alt={t.name}
                            loading="lazy"
                            decoding="async"
                            width={36}
                            height={36}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                            className="absolute inset-0 h-9 w-9 rounded-full object-cover ring-1 ring-line/80 shadow-2xs"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-ink leading-tight">
                            {t.name}
                          </span>
                          {t.xHandle && (
                            <a
                              href={`https://x.com/${t.xHandle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-medium text-accent hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>@{t.xHandle}</span>
                            </a>
                          )}
                        </div>
                        <div className="text-[11px] text-muted">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
