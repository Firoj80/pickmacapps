import { createServerFn } from "@tanstack/react-start";

export const fetchSiteOrigin = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequestUrl } = await import("@tanstack/start-server-core");
  return getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin;
});

export function originFrom(matches: ReadonlyArray<{ context: unknown }>) {
  const origin = (matches[0]?.context as { origin?: string } | undefined)?.origin;
  return origin ?? "";
}

export function metaDescription(text: string, fallback = "Mac apps worth installing.") {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  if (clean.length <= 155) return clean;
  const cut = clean.slice(0, 152);
  const space = cut.lastIndexOf(" ");
  return `${(space > 80 ? cut.slice(0, space) : cut).replace(/[.,;:]+$/, "").trim()}…`;
}

export function canonical(origin: string, path: string) {
  const href = origin ? `${origin}${path}` : path;
  return { rel: "canonical" as const, href };
}
