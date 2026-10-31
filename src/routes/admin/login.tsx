import { createFileRoute } from "@tanstack/react-router";
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
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-ink">Admin</h1>
      <p className="mt-3 text-sm text-body">The password is checked on the server. It is not stored in the page.</p>
      {error ? <p className="mt-4 text-sm text-amber-800">That password was not accepted.</p> : null}
      <form method="post" action="/api/admin/login" className="mt-6 space-y-3">
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          aria-label="Admin password"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm text-canvas">
          Sign in
        </button>
      </form>
    </main>
  );
}
