import { createFileRoute } from "@tanstack/react-router";
import { fieldClass } from "@/components/admin-shell";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    error: search.error === "1" ? "1" : undefined,
  }),
  component: Login,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "Admin sign in",
      description: "Sign in to the PickMacApps admin.",
      path: "/admin/login",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function Login() {
  const { error } = Route.useSearch();
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f3ef] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6">
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">PickMacApps</p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-body">The password is checked on the server. It is not stored in the page.</p>
        {error ? <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">That password was not accepted.</p> : null}
        <form method="post" action="/api/admin/login" className="mt-5 space-y-3">
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            aria-label="Admin password"
            placeholder="Password"
            className={fieldClass}
          />
          <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-canvas">
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
