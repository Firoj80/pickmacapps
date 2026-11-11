import { useEffect } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { isChunkOrSkewError, reloadOnceOnSkew } from "@/lib/directory-cache";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  useEffect(() => {
    if (isChunkOrSkewError(error)) {
      reloadOnceOnSkew();
    }
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-canvas px-6 text-center text-ink">
      <span className="text-rose-500" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {errorMessage(error)}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-xs font-semibold text-canvas transition hover:opacity-90"
        >
          Reload page
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-ink transition hover:border-line-2 hover:bg-surface-2"
        >
          Back to directory
        </a>
      </div>
    </main>
  );
}
