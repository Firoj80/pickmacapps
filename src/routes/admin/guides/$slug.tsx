import { createFileRoute, redirect } from "@tanstack/react-router";
import { RichGuideEditor } from "@/components/rich-guide-editor";
import { AdminShell, Notice, useAdminNotice } from "@/components/admin-shell";
import { fetchAdminGuide, ensureAdminSession } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/guides/$slug")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: ({ params }) => fetchAdminGuide({ data: { slug: params.slug } }),
  component: EditGuide,
  head: ({ matches, params }) => {
    const seo = buildMetadata({
      title: "Edit guide",
      description: "Edit a PickMacApps guide.",
      path: `/admin/guides/${params.slug}`,
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function EditGuide() {
  const guide = Route.useLoaderData();
  const notice = useAdminNotice();
  if (!guide) {
    return (
      <AdminShell title="Missing guide" active="guides">
        <p className="text-sm text-body">That guide is not in the directory.</p>
      </AdminShell>
    );
  }
  return (
    <AdminShell title={`Edit: ${guide.title}`} active="guides">
      <Notice {...notice} />
      <div className="max-w-5xl">
        <RichGuideEditor
          isNew={false}
          slug={guide.slug}
          title={guide.title}
          excerpt={guide.excerpt}
          html={guide.html}
          status={guide.status}
        />
      </div>
    </AdminShell>
  );
}
