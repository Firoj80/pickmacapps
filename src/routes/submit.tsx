import { useState } from "react";
import { CheckIcon, SparklesIcon, SpinnerIcon } from "@/components/icons";
import { verifyBadge } from "@/lib/badge";
import { categories } from "@/lib/catalog";
import { fetchAppMetadataFn, fetchOffer, submitListingFn } from "@/lib/directory.fn";
import { crumbGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/submit")({
  loader: () => fetchOffer(),
  component: SubmitPage,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: pageCopy.submit.title,
      description: pageCopy.submit.description,
      path: "/submit",
      origin,
    });
    const script = jsonLdScript(crumbGraph(origin, "/submit", "Submit your Mac app"));
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
  const [plan, setPlan] = useState<"free" | "choice">("free");
  const [copied, setCopied] = useState(false);
  const [badgeVariant, setBadgeVariant] = useState<"logo" | "classic" | "dark">("logo");
  const [badge, setBadge] = useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [badgeMessage, setBadgeMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  // App details form state (editable & populated by auto-fetch)
  const [website, setWebsite] = useState("");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [demo, setDemo] = useState("");
  const [pricing, setPricing] = useState<"free" | "freemium" | "paid">("free");
  const [category, setCategory] = useState<string>(categories[0]?.slug ?? "utilities");
  const [email, setEmail] = useState("");
  const [xHandle, setXHandle] = useState("");

  // Auto-fetch status
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<"idle" | "success" | "error">("idle");
  const [fetchMessage, setFetchMessage] = useState("");

  const offer = Route.useLoaderData();
  const price = (offer.priceCents / 100).toFixed(0);
  const compare = (offer.compareCents / 100).toFixed(0);
  const slots = offer.slots ?? {
    total: 3,
    active: 0,
    remaining: 3,
    isFull: false,
    nextDate: "next week",
  };
  const paid = plan === "choice";

  // Always use the real canonical website URL for external badge embeds
  const siteOrigin = "https://www.picmacapps.store";

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
  const canSubmit = Boolean(hasEmail && hasXHandle && (!paid || !slots.isFull) && badgeOk && !sending);

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
          "Details auto-filled from your website! Please review each field below, customize anything, and submit."
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
        <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-16 xl:gap-24">
            <div className="w-full lg:max-w-[460px]">
              <p className="text-[12px] font-semibold tracking-[0.16em] text-accent uppercase">List an app</p>
              <h1 className="font-display mt-2 mb-8 text-4xl font-semibold tracking-[-0.03em] text-ink">Submit your Mac app</h1>
              {sent ? (
                <div className="rounded-xl border border-line bg-surface p-6">
                  <h2 className="text-lg font-[550] tracking-[-0.025em] text-ink">Submission received</h2>
                  <p className="mt-2 text-sm leading-relaxed text-body">
                    Thanks. We’ll review your listing and follow up by email.
                  </p>
                  <button
                    type="button"
                    className="mt-5 text-sm font-medium text-ink underline underline-offset-2"
                    onClick={() => {
                      setSent(false);
                      setBadge("idle");
                      setBadgeMessage("");
                      setFetchStatus("idle");
                      setFetchMessage("");
                      setXHandle("");
                    }}
                  >
                    Submit another
                  </button>
                </div>
              ) : (
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
                    if (plan === "free" && badge !== "ok") return;
                    setSending(true);
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
                          plan,
                        },
                      });
                      if (result.checkoutUrl) {
                        window.location.href = result.checkoutUrl;
                        return;
                      }
                      if (result.ok) setSent(true);
                      else {
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
                  <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-[550] tracking-[-0.025em] text-ink">App information</h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                        <SparklesIcon className="h-3 w-3" /> Auto-fill
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
                        Enter your app’s website and click <strong>Auto-fetch</strong>. We’ll pull the name, tagline, description, icon, demo preview, and category for you to review and edit.
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

                    {/* Live Visual Preview Card when an icon or demo is available */}
                    {(icon || demo || name) && (
                      <div className="rounded-xl border border-line bg-surface-2 p-3.5 transition-all">
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
                          <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface">
                            <img
                              src={demo}
                              alt="Demo screenshot"
                              className="max-h-40 w-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Editable Form Inputs */}
                    <div className="space-y-3 pt-1">
                      <div>
                        <label htmlFor="name" className="mb-1 block text-xs font-medium text-body">
                          App name <span className="text-accent">*</span>
                        </label>
                        <input
                          id="name"
                          required
                          name="name"
                          aria-label="App name"
                          placeholder="App name"
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
                          placeholder="Short tagline (e.g. More space for your Mac)"
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                          className={field}
                        />
                      </div>

                      <div>
                        <label htmlFor="description" className="mb-1 block text-xs font-medium text-body">
                          Description <span className="text-accent">*</span>
                        </label>
                        <textarea
                          id="description"
                          required
                          name="description"
                          aria-label="Description"
                          placeholder="What the app does, key features, and requirements"
                          rows={5}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className={field}
                        />
                      </div>

                      <div>
                        <label htmlFor="icon" className="mb-1 block text-xs font-medium text-body">
                          Icon image URL <span className="text-accent">*</span>
                        </label>
                        <input
                          id="icon"
                          required
                          type="url"
                          name="icon"
                          aria-label="Icon URL"
                          placeholder="https://.../icon.png"
                          value={icon}
                          onChange={(e) => setIcon(e.target.value)}
                          className={field}
                        />
                      </div>

                      <div>
                        <label htmlFor="demo" className="mb-1 block text-xs font-medium text-body">
                          Demo screenshot image URL <span className="text-muted">(optional)</span>
                        </label>
                        <input
                          id="demo"
                          type="url"
                          name="demo"
                          aria-label="Demo image URL"
                          placeholder="https://.../demo.png"
                          value={demo}
                          onChange={(e) => setDemo(e.target.value)}
                          className={field}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="pricing" className="mb-1 block text-xs font-medium text-body">
                            Price model <span className="text-accent">*</span>
                          </label>
                          <select
                            id="pricing"
                            required
                            name="pricing"
                            aria-label="Price model"
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
                            {categories.map((cat) => (
                              <option key={cat.slug} value={cat.slug}>
                                {cat.emoji} {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        Both email and X handle are mandatory. We’ll use your email for review updates and your X handle to tag you when your app is featured.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-line bg-surface p-4">
                    <h2 className="mb-3 text-base font-[550] tracking-[-0.025em] text-ink">Listing</h2>
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => setPlan("free")}
                        className={`relative w-full rounded-lg border-2 px-3.5 py-3 text-left transition-all ${
                          plan === "free" ? "border-accent bg-accent/5" : "border-line hover:border-line-2"
                        }`}
                      >
                        <span className="absolute -top-2 left-3 rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium text-canvas">
                          Popular
                        </span>
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-bold text-ink">Free</span>
                            <span className="text-xs text-muted">after review</span>
                          </div>
                          <Radio selected={plan === "free"} />
                        </div>
                        <ul className="mt-2.5 space-y-1 border-t border-line pt-2.5">
                          {[
                            "Add our badge, then we review the listing.",
                            "The link back to your site is nofollow.",
                            "No visitor count is promised.",
                          ].map((line) => (
                            <li key={line} className="flex items-start gap-1.5 text-[11px] text-body">
                              <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-ink" />
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (slots.isFull) {
                            setPlan("free");
                            return;
                          }
                          setPlan("choice");
                        }}
                        className={`relative w-full rounded-lg border-2 px-3.5 py-3 text-left transition-all ${
                          slots.isFull
                            ? "border-line bg-surface-2 opacity-80 cursor-not-allowed"
                            : plan === "choice"
                              ? "border-accent bg-accent/5"
                              : "border-line hover:border-line-2"
                        }`}
                      >
                        <div className="absolute -top-2 left-3 flex items-center gap-1.5">
                          <span className="rounded-full bg-surface-2 border border-line px-2 py-0.5 text-[10px] font-medium text-body">
                            Editor's Choice
                          </span>
                          {slots.isFull ? (
                            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                              Sold out
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-bold text-ink">${price}</span>
                              <span className="text-xs text-muted line-through">${compare}</span>
                              <span className="text-xs text-muted">one-time</span>
                            </div>
                            {!slots.isFull ? (
                              <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                * Only {slots.remaining} {slots.remaining === 1 ? "spot" : "spots"} remaining for next week ( {slots.nextDate} )
                              </p>
                            ) : (
                              <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                * All 3 Editor's Choice spots are currently full for next week
                              </p>
                            )}
                          </div>
                          <Radio selected={!slots.isFull && plan === "choice"} />
                        </div>
                        <ul className="mt-2.5 space-y-1.5 border-t border-line pt-2.5">
                          <li className="flex items-start gap-1.5 text-[11px] text-body">
                            <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-ink" />
                            <span>
                              <strong className="font-semibold text-ink">Top 3 placement</strong> on our directory for 1 week
                            </span>
                          </li>
                          <li className="flex items-start gap-1.5 text-[11px] text-body">
                            <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-ink" />
                            <span>
                              After 1 week, you get <strong className="font-semibold text-ink">listed permanently</strong> on the directory
                            </span>
                          </li>
                          <li className="flex items-start gap-1.5 text-[11px] text-body">
                            <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-ink" />
                            <span>
                              <strong className="font-semibold text-ink">Featured at the top</strong> of alternative pages
                            </span>
                          </li>
                          <li className="flex items-start gap-1.5 text-[11px] text-body">
                            <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-ink" />
                            <span>
                              <strong className="font-semibold text-ink">Dedicated blog post</strong> for your app, including competitor comparisons
                            </span>
                          </li>
                          <li className="flex items-start gap-1.5 text-[11px] text-body">
                            <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-ink" />
                            <span>
                              <strong className="font-semibold text-ink">High-quality backlink</strong> to boost your SEO
                            </span>
                          </li>
                          <li className="flex items-start gap-1.5 text-[11px] text-body">
                            <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-ink" />
                            <span>
                              <strong className="font-semibold text-ink">Hundreds of monthly visitors</strong> discovering your app
                            </span>
                          </li>
                        </ul>
                      </button>
                    </div>
                  </div>

                  {paid ? null : (
                    <div className="rounded-xl border border-line bg-surface p-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-[550] tracking-[-0.025em] text-ink">Add our badge, get listed free</h2>
                        <span className="text-[11px] font-medium text-muted">200 × 54 px</span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-body">
                        Paste this badge on your app's landing page. A free listing needs it before we can review the app.
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
                          Classic badge (Previous)
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
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line-2 bg-surface-2 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent disabled:opacity-60"
                      >
                        {badge === "checking" ? "Checking…" : "Check my badge"}
                      </button>
                    </div>
                  )}

                  {badgeMessage ? (
                    <p className={`text-[12.5px] ${badge === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-body"}`}>{badgeMessage}</p>
                  ) : null}

                  <div className="rounded-xl border border-line bg-surface p-4">
                    <h2 className="mb-2.5 text-base font-[550] tracking-[-0.025em] text-ink">Checklist</h2>
                    <div className="space-y-2">
                      {checks.map((item) => (
                        <div key={item} className="flex items-center gap-2.5">
                          <div className="flex h-[18px] w-[18px] items-center justify-center rounded bg-emerald-500">
                            <CheckIcon className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-body">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-muted">
                    Email and X handle are used only to communicate about this submission and feature your app. See{" "}
                    <Link to="/privacy" className="text-ink underline underline-offset-2">
                      privacy
                    </Link>
                    .
                  </p>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-canvas transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending
                      ? "Sending…"
                      : !hasEmail && !hasXHandle
                        ? "Enter email & X handle to submit"
                        : !hasEmail
                          ? "Enter your email to submit"
                          : !hasXHandle
                            ? "Enter your X handle to submit"
                            : paid && slots.isFull
                              ? "Editor’s Choice slots are full · Select Free"
                              : paid
                                ? `Continue to payment · $${price}`
                                : badge === "ok"
                                  ? "Submit your app"
                                  : "Verify your badge to submit"}
                  </button>
                </form>
              )}
            </div>

            <div className="flex-1">
              <div className="sticky top-24 space-y-4 rounded-2xl border border-line bg-surface p-6">
                <h2 className="font-display text-2xl font-semibold text-ink">How listing works</h2>
                <p className="text-[15px] leading-relaxed text-body">Listings are reviewed by hand. Nothing goes live from the form alone.</p>
                <p className="text-[15px] leading-relaxed text-body">
                  A free listing needs our badge, and the link back to your site is nofollow.
                </p>
                <p className="text-[15px] leading-relaxed text-body">
                  <strong className="font-semibold text-ink">Editor’s Choice is strictly limited to 3 spots</strong> at any time to guarantee maximum visibility. You receive Top 3 placement on our directory for 1 week, and after that 1 week your app remains listed permanently with a high-quality follow backlink.
                </p>
                <p className="text-[15px] leading-relaxed text-body">
                  Editor’s Choice costs ${price}, marked down from ${compare} one-time. The amount is charged securely by Dodo from the server.
                </p>
              </div>
            </div>
          </div>
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

function ChoiceLine({ strong, rest }: { strong: string; rest: string }) {
  return (
    <li className="flex items-start gap-1.5 text-[11px] text-body">
      <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-ink" />
      <span>
        <span className="font-medium text-ink">{strong}</span>
        {rest}
      </span>
    </li>
  );
}
