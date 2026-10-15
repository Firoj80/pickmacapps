import { createFileRoute, Link } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import { Missing } from "@/components/missing";
import { getAlternative, getApp } from "@/lib/catalog";

export const Route = createFileRoute("/alternatives/$slug")({
  component: AlternativePage,
  head: ({ params }) => {
    const item = getAlternative(params.slug);
    return {
      meta: [
        {
          title: item ? `Best Alternatives for ${item.name} — PickMacApps` : "Alternatives — PickMacApps",
        },
        { name: "description", content: item?.blurb ?? "Mac app alternatives" },
      ],
    };
  },
});

function AlternativePage() {
  const { slug } = Route.useParams();
  const item = getAlternative(slug);
  if (!item) {
    return <Missing title="Alternatives not found" body="That comparison isn't in the directory." />;
  }
  const listed = item.appSlugs
    .map((appSlug) => getApp(appSlug))
    .filter((app): app is NonNullable<ReturnType<typeof getApp>> => Boolean(app));

  return (
    <main>
      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <Link to="/alternatives" className="text-[14px] text-muted transition-colors hover:text-ink">
          ← All alternatives
        </Link>
        <h1 className="mt-6 flex items-center gap-3 text-3xl font-[550] tracking-[-0.025em] text-ink sm:text-4xl">
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-line sm:h-11 sm:w-11">
            <img alt={item.name} src={item.icon} className="h-full w-full object-cover" />
          </span>
          Best Alternatives for {item.name}
        </h1>
        <div className="mt-5 max-w-3xl space-y-4 text-[15px] leading-relaxed text-body">
          {item.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <section className="mt-12">
          <div className="flex items-center gap-5">
            <h2 className="shrink-0 text-[19px] font-[550] tracking-[-0.025em] text-ink">
              {listed.length} {item.name} alternatives
            </h2>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listed.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
