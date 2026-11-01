import { useState } from "react";
import { CheckIcon } from "@/components/icons";
import { verifyBadge } from "@/lib/badge";
import { categories } from "@/lib/catalog";
import { fetchOffer, submitListingFn } from "@/lib/directory.fn";
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

const BADGE_HTML = `<a href="/" target="_blank" rel="noopener">
  <img
    src="/badge.svg"
    alt="Featured on PickMacApps"
    width="200"
    height="54"
  />
</a>`;

const checks = ["Your app is functional", "It delivers what it promises", "Is not an infoproduct"];
const field =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-muted focus:border-accent focus:outline-none";

function SubmitPage() {
  const [plan, setPlan] = useState<"free" | "choice">("free");
  const [copied, setCopied] = useState(false);
  const [badge, setBadge] = useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [badgeMessage, setBadgeMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const offer = Route.useLoaderData();
  const price = (offer.priceCents / 100).toFixed(0);
  const compare = (offer.compareCents / 100).toFixed(0);
  const paid = plan === "choice";

  async function copyBadge() {
    try {
      await navigator.clipboard.writeText(BADGE_HTML);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function checkBadge(form: HTMLFormElement) {
    const website = String(new FormData(form).get("website_url") ?? "");
    setBadge("checking");
    setBadgeMessage("");
    try {
      const result = await verifyBadge({ data: { url: website } });
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
                    onClick={() => setSent(false)}
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
                    if (plan === "free" && badge !== "ok") return;
                    const form = new FormData(event.currentTarget);
                    setSending(true);
                    try {
                      const result = await submitListingFn({
                        data: {
                          name: String(form.get("name") ?? ""),
                          website: String(form.get("website_url") ?? ""),
                          tagline: String(form.get("tagline") ?? ""),
                          description: String(form.get("description") ?? ""),
                          icon: String(form.get("icon") ?? ""),
                          demo: String(form.get("demo") ?? ""),
                          pricing: String(form.get("pricing") ?? ""),
                          category: String(form.get("category") ?? ""),
                          email: String(form.get("email") ?? ""),
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
                  <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
                    <h2 className="text-base font-[550] tracking-[-0.025em] text-ink">App</h2>
                    <input required name="name" aria-label="App name" placeholder="App name" className={field} />
                    <input required type="url" name="website_url" aria-label="Website URL" placeholder="Website URL" className={field} />
                    <input required name="tagline" aria-label="Tagline" placeholder="Short tagline" className={field} />
                    <textarea
                      required
                      name="description"
                      aria-label="Description"
                      placeholder="What the app does"
                      rows={5}
                      className={field}
                    />
                    <input required type="url" name="icon" aria-label="Icon URL" placeholder="Icon image URL" className={field} />
                    <input type="url" name="demo" aria-label="Demo image URL" placeholder="Demo image URL, optional" className={field} />
                    <div className="grid grid-cols-2 gap-3">
                      <select required name="pricing" aria-label="Price model" defaultValue="free" className={field}>
                        <option value="free">Free</option>
                        <option value="freemium">Freemium</option>
                        <option value="paid">Paid</option>
                      </select>
                      <select required name="category" aria-label="Category" defaultValue={categories[0]?.slug} className={field}>
                        {categories.map((category) => (
                          <option key={category.slug} value={category.slug}>
                            {category.emoji} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input required type="email" name="email" aria-label="Email address" placeholder="Your email address" className={field} />
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
                        onClick={() => setPlan("choice")}
                        className={`relative w-full rounded-lg border-2 px-3.5 py-3 text-left transition-all ${
                          plan === "choice" ? "border-accent bg-accent/5" : "border-line hover:border-line-2"
                        }`}
                      >
                        <span className="absolute -top-2 left-3 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-body">
                          Editor's Choice
                        </span>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-bold text-ink">${price}</span>
                              <span className="text-xs text-muted line-through">${compare}</span>
                              <span className="text-xs text-muted">one-time</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-body">No badge. A follow link on the listing.</p>
                          </div>
                          <Radio selected={plan === "choice"} />
                        </div>
                        <ul className="mt-2.5 space-y-1 border-t border-line pt-2.5">
                          <ChoiceLine strong="Editor’s Choice label" rest=" on the directory." />
                          <ChoiceLine strong="A follow link" rest=" from the listing to your site." />
                          <ChoiceLine strong="No badge" rest=" on your site is required." />
                        </ul>
                      </button>
                    </div>
                  </div>

                  {paid ? null : (
                    <div className="rounded-xl border border-line bg-surface p-4">
                      <h2 className="text-base font-[550] tracking-[-0.025em] text-ink">Add our badge, get listed free</h2>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-body">
                        Paste this badge on your app's landing page. A free listing needs it before we can review the app.
                      </p>
                      <div className="mt-3 flex justify-center rounded-lg border border-line bg-surface-2 p-3">
                        <img src="/badge.svg" alt="Featured on PickMacApps" width="200" height="54" />
                      </div>
                      <div className="mt-3 overflow-hidden rounded-lg border border-line bg-canvas">
                        <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
                          <span className="text-[11px] font-medium text-muted">HTML</span>
                          <button
                            type="button"
                            onClick={copyBadge}
                            className="rounded-md border border-line-2 bg-surface px-2 py-0.5 text-[11px] font-medium text-ink transition-colors hover:bg-surface-2"
                          >
                            {copied ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <pre className="overflow-x-auto p-3 text-[11px] leading-relaxed text-body">
                          <code>{BADGE_HTML}</code>
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
                    Email is used only to reply about this submission. See{" "}
                    <Link to="/privacy" className="text-ink underline underline-offset-2">
                      privacy
                    </Link>
                    .
                  </p>
                  <button
                    type="submit"
                    disabled={sending || (!paid && badge !== "ok")}
                    className="w-full rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-canvas transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? "Sending…" : paid ? `Continue to payment · $${price}` : badge === "ok" ? "Submit your app" : "Verify your badge to submit"}
                  </button>
                </form>
              )}
            </div>

            <div className="flex-1">
              <div className="sticky top-24 space-y-4 rounded-2xl border border-line bg-surface p-6">
                <h2 className="font-display text-2xl font-semibold text-ink">How listing works</h2>
                <p className="text-[15px] leading-relaxed text-body">Listings are reviewed by hand. Nothing goes live from the form alone.</p>
                <p className="text-[15px] leading-relaxed text-body">
                  A free listing needs the badge, and the link back to your site is nofollow. Editor’s Choice costs ${price}, marked down from ${compare}. It does not need a badge, and the listing link is a follow link.
                </p>
                <p className="text-[15px] leading-relaxed text-body">
                  The amount is charged by Dodo from the server, not from this page. Visitor counts are not promised.
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
