import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/categories" as any)({
  beforeLoad: () => {
    throw redirect({ to: "/category" });
  },
});
