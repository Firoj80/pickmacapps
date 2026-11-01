import { createFileRoute, Link } from "@tanstack/react-router";
import { crumbGraph, jsonLdScript } from "@/lib/jsonld";
import { buildMetadata, markdownAlternate, originFrom } from "@/lib/seo";
import { pageCopy } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: ({ matches }) => {
    const origin = originFrom(matches);
    const seo = buildMetadata({
      title: pageCopy.privacy.title,
      description: pageCopy.privacy.description,
      path: "/privacy",
      origin,
    });
    const script = jsonLdScript(crumbGraph(origin, "/privacy", "Privacy"));
    return {
      meta: seo.meta,
      links: [...seo.links, markdownAlternate(origin, "/privacy")],
      ...(script ? { scripts: [script] } : {}),
    };
  },
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-[12px] font-semibold tracking-[0.16em] text-accent uppercase">Privacy</p>
      <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">Privacy</h1>
      <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-body">
        <p>
          The submit form asks for an app name, website, tagline, description, icon, category, price model, and
          email so a listing can be reviewed. That information is used only to reply about the submission. It is not
          sold.
        </p>
        <p>
          The site does not ask you to create an account. Theme preference is stored in this browser. Fonts are loaded
          from Google Fonts, which means your browser requests them from Google.
        </p>
        <p>
          Editor’s Choice listings are labeled Editor’s Choice. This page describes the site’s
          own practices. It is not legal advice.
        </p>
        <p>
          <Link to="/submit" className="font-medium text-ink underline underline-offset-2">
            Back to submit
          </Link>
        </p>
      </div>
    </main>
  );
}
