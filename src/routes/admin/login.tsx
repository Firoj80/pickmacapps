import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4 sm:px-6 dark:bg-[#0c0d0e]">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-gradient-to-tr from-accent/10 via-indigo-500/5 to-transparent blur-3xl opacity-70" />
      </div>

      <div className="relative w-full max-w-sm rounded-3xl border border-line bg-white/95 p-7 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl transition">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-canvas shadow-xs">
            <span className="text-xl"></span>
          </div>
          <Link
            to="/"
            className="text-xs font-medium text-muted hover:text-ink transition"
          >
            ← Public Site
          </Link>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">PickMacApps Console</p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Admin Sign In</h1>
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            Enter your admin passphrase to access the directory management console.
          </p>
        </div>

        {error ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2.5 text-xs font-medium text-rose-800">
            <span>⚠️</span>
            <span>That password was not accepted. Please try again.</span>
          </div>
        ) : null}

        <form method="post" action="/api/admin/login" className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="password-input" className="text-xs font-semibold text-body">
              Passphrase
            </label>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                name="password"
                required
                autoComplete="current-password"
                aria-label="Admin password"
                placeholder="Enter admin password..."
                className="w-full rounded-xl border border-line bg-stone-50/70 px-3.5 py-2.5 pr-10 text-xs text-ink placeholder:text-muted focus:border-ink focus:bg-white focus:outline-none shadow-2xs transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition cursor-pointer text-xs"
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-ink py-2.5 text-xs font-bold text-canvas shadow-xs hover:opacity-90 active:opacity-80 transition cursor-pointer"
          >
            Unlock Console
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-muted">
          Protected session · Server-side verification
        </p>
      </div>
    </main>
  );
}
