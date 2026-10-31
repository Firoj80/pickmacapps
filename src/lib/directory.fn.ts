import { createServerFn } from "@tanstack/react-start";

export const fetchDirectory = createServerFn({ method: "GET" }).handler(async () => {
  const { publishedDirectory } = await import("./directory.server");
  return publishedDirectory();
});

export const fetchOffer = createServerFn({ method: "GET" }).handler(async () => {
  const { publicOffer } = await import("./directory.server");
  return publicOffer();
});

export const submitListingFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
    return {
      name: String(data.name ?? "").slice(0, 120),
      website: String(data.website ?? "").slice(0, 300),
      tagline: String(data.tagline ?? "").slice(0, 180),
      email: String(data.email ?? "").slice(0, 180),
      plan: data.plan === "choice" ? "choice" : "free",
    };
  })
  .handler(async ({ data }) => {
    const { submitListing } = await import("./directory.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const origin = request ? new URL(request.url).origin : "";
    return submitListing(data, origin);
  });

async function adminOnly() {
  const { requestIsAdmin } = await import("./admin-auth.server");
  if (!requestIsAdmin()) throw new Error("ADMIN_REQUIRED");
}

export const requireAdmin = createServerFn({ method: "GET" }).handler(async () => {
  await adminOnly();
  return true;
});

export const fetchAdminHome = createServerFn({ method: "GET" }).handler(async () => {
  await adminOnly();
  const dir = await import("./directory.server");
  const [stats, offer, submissions, badges] = await Promise.all([
    dir.adminStats(),
    dir.publicOffer(),
    dir.listSubmissions(),
    dir.listApps(),
  ]);
  return {
    stats,
    offer,
    submissions,
    badges: badges.filter((app) => app.pricing === "free" && !app.editorChoice),
  };
});

export const fetchAdminApps = createServerFn({ method: "GET" }).handler(async () => {
  await adminOnly();
  const { listApps } = await import("./directory.server");
  return listApps();
});

export const fetchAdminApp = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const id = typeof input === "object" && input && "id" in input ? String(input.id) : "";
    return { id };
  })
  .handler(async ({ data }) => {
    await adminOnly();
    const { getAppRow } = await import("./directory.server");
    return getAppRow(data.id);
  });

export const fetchAdminGuides = createServerFn({ method: "GET" }).handler(async () => {
  await adminOnly();
  const { listGuides } = await import("./directory.server");
  return listGuides();
});

export const fetchAdminGuide = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const slug = typeof input === "object" && input && "slug" in input ? String(input.slug) : "";
    return { slug };
  })
  .handler(async ({ data }) => {
    await adminOnly();
    const { getGuide } = await import("./directory.server");
    return getGuide(data.slug);
  });
