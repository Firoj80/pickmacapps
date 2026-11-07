import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { Missing } from "@/components/missing";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 60_000,
    defaultStaleTime: 30_000,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: () => (
      <Missing title="Page not found" body="That page isn't part of the directory." />
    ),
  });
}
