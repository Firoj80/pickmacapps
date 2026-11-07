import { createFileRoute, redirect } from "@tanstack/react-router";
import { RichGuideEditor } from "@/components/rich-guide-editor";
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
      description: "Add a PickMacApps editorial guide.",
      path: "/admin/guides/new",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function NewGuide() {
  return (
    <AdminShell
      title="Write New Guide"
      lede="Author a comprehensive editorial guide with rich formatting, live reader preview, and image attachments."
      active="add_guide"
    >
      <div className="max-w-5xl">
        <RichGuideEditor isNew slug="" title="" excerpt="" html="" status="draft" />
      </div>
    </AdminShell>
  );
}
