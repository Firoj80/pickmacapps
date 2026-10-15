import { Link } from "@tanstack/react-router";

export function Missing({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center px-6 py-20">
      <p className="text-sm text-muted">404</p>
      <h1 className="mt-2 text-3xl font-[550] tracking-[-0.025em] text-ink">{title}</h1>
      <p className="mt-3 text-body">{body}</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-canvas hover:opacity-85"
      >
        Back to the directory
      </Link>
    </main>
  );
}
