import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";
import { GuideForm } from "@/components/guide-form";

export const Route = createFileRoute("/admin/guides/new")({
  beforeLoad: async () => {
    try {
      await requireAdmin();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  component: NewGuide,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "New guide",
      description: "Add a PickMacApps guide.",
      path: "/admin/guides/new",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function NewGuide() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl font-semibold text-ink">New guide</h1>
      <GuideForm isNew slug="" title="" excerpt="" html="<p></p>" status="draft" />
    </main>
  );
}
