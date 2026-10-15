import { createFileRoute, Link } from "@tanstack/react-router";
import { alternatives } from "@/lib/catalog";

export const Route = createFileRoute("/alternatives/")({
  component: AlternativesIndex,
  head: () => ({
    meta: [
      { title: "Alternatives — PickMacApps" },
      {
        name: "description",
        content: "The best alternatives to popular Mac apps, hand-picked from the directory.",
      },
    ],
  }),
});

function AlternativesIndex() {
  return (
    <main>
      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-[550] tracking-[-0.025em] text-ink sm:text-4xl">Alternatives</h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-body">
          Looking to replace a Mac app you already know? These are the best alternatives, hand-picked
          from the directory.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {alternatives.map((item) => (
            <Link
              key={item.slug}
              to="/alternatives/$slug"
              params={{ slug: item.slug }}
              className="card-silver group flex flex-col rounded-2xl border p-6 transition-colors duration-200"
            >
              <div className="flex items-center">
                {item.icons.map((icon, index) => (
                  <div
                    key={icon.src}
                    className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface ring-2 ring-canvas"
                    style={{ marginLeft: index === 0 ? 0 : -10, zIndex: item.icons.length - index }}
                  >
                    <img alt={icon.name} src={icon.src} className="h-full w-full object-cover" />
                  </div>
                ))}
                {item.extra > 0 ? (
                  <span className="-ml-2.5 flex h-11 min-w-11 items-center justify-center rounded-xl bg-ink px-2 text-[13px] font-semibold text-canvas ring-2 ring-canvas">
                    +{item.extra}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-6 text-[19px] leading-snug font-[600] tracking-[-0.02em] text-ink">
                Best Alternatives for {item.name}
              </h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-body">{item.blurb}</p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{item.namesLine}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-6 text-[14px] font-medium text-accent">
                View alternatives
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
