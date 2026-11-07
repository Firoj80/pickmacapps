import { createFileRoute, redirect } from "@tanstack/react-router";
import { GuideForm } from "@/components/guide-form";
import { AdminShell } from "@/components/admin-shell";
import { ensureAdminSession } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/guides/new")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
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
    <AdminShell title="New guide" lede="Write it as HTML. It stays a draft until you publish." active="guides">
      <div className="max-w-3xl rounded-2xl border border-line bg-white p-5">
        <GuideForm isNew slug="" title="" excerpt="" html="<p></p>" status="draft" />
      </div>
    </AdminShell>
  );
}
