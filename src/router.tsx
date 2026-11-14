import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { Missing } from "@/components/missing";
import { reloadOnceOnSkew } from "@/lib/directory-cache";
import { routeTree } from "./routeTree.gen";

if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadOnceOnSkew();
  });
}

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 300_000,
    defaultStaleTime: 300_000,
    defaultPendingMs: 200,
    defaultPendingMinMs: 0,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: () => (
      <Missing title="Page not found" body="That page isn't part of the directory." />
    ),
  });
}
