import { createFileRoute } from "@tanstack/react-router";
import { AppCard } from "@/components/app-card";
import { Missing } from "@/components/missing";
import { appsInCategory, getCategory } from "@/lib/catalog";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
  head: ({ params }) => {
    const category = getCategory(params.slug);
    return {
      meta: [
        {
          title: category ? `${category.name} Mac Apps — PickMacApps` : "Category — PickMacApps",
        },
        { name: "description", content: category?.paragraphs[0] ?? "Mac apps by category" },
      ],
    };
  },
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const category = getCategory(slug);
  if (!category) {
    return <Missing title="Category not found" body="That category isn't in the directory." />;
  }
  const listed = appsInCategory(slug);
  const label = category.name.toLowerCase();

  return (
    <main>
      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <h1 className="flex items-center gap-3 text-3xl font-[550] tracking-[-0.025em] text-ink sm:text-4xl">
          <span aria-hidden="true">{category.emoji}</span>
          {category.name} Mac Apps
        </h1>
        <div className="mt-5 max-w-3xl space-y-4 text-[15px] leading-relaxed text-body">
          {category.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <section className="mt-12 max-w-3xl">
          <h2 className="text-[19px] font-[550] tracking-[-0.025em] text-ink">
            What to look for in a {label} app
          </h2>
          <ul className="mt-4 space-y-3">
            {category.tips.map((tip) => (
              <li key={tip} className="flex gap-3 text-[15px] leading-relaxed text-body">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-faint" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-14">
          <div className="flex items-center gap-5">
            <h2 className="shrink-0 text-[19px] font-[550] tracking-[-0.025em] text-ink">
              All {listed.length} {label} apps
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
