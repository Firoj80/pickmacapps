import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { Missing } from "@/components/missing";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 300_000,
    defaultStaleTime: 300_000,
    defaultPendingMs: 150,
    defaultPendingMinMs: 0,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: () => (
      <Missing title="Page not found" body="That page isn't part of the directory." />
    ),
  });
}
