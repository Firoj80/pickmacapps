import { createFileRoute, redirect } from "@tanstack/react-router";
import { GuideForm } from "@/components/guide-form";
import { fetchAdminGuide, requireAdmin } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/guides/$slug")({
  beforeLoad: async () => {
    try {
      await requireAdmin();
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
  if (!guide) return <main className="px-6 py-12">That guide is not in the directory.</main>;
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl font-semibold text-ink">{guide.title}</h1>
      <GuideForm
        isNew={false}
        slug={guide.slug}
        title={guide.title}
        excerpt={guide.excerpt}
        html={guide.html}
        status={guide.status}
      />
    </main>
  );
}
