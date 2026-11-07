import { createServerFn } from "@tanstack/react-start";

export const fetchDirectory = createServerFn({ method: "GET" }).handler(async () => {
  const { publishedDirectory } = await import("./directory.server");
  return publishedDirectory();
});

export const fetchOffer = createServerFn({ method: "GET" }).handler(async () => {
  const { publicOffer } = await import("./directory.server");
  return publicOffer();
});
export const fetchAppMetadataFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const url = typeof input === "object" && input && "url" in input ? String(input.url) : "";
    return { url };
  })
  .handler(async ({ data }) => {
    const { fetchAppMetadata } = await import("./metadata.server");
    return fetchAppMetadata(data.url);
  });

export const submitListingFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
    return {
      name: String(data.name ?? "").slice(0, 120),
      website: String(data.website ?? "").slice(0, 300),
      tagline: String(data.tagline ?? "").slice(0, 180),
      description: String(data.description ?? "").slice(0, 8000),
      icon: String(data.icon ?? "").slice(0, 400),
      demo: String(data.demo ?? "").slice(0, 400),
      pricing: data.pricing === "paid" || data.pricing === "freemium" || data.pricing === "free" ? data.pricing : "free",
      category: String(data.category ?? "").slice(0, 80),
      email: String(data.email ?? "").slice(0, 180),
      xHandle: String(data.xHandle ?? data.x_handle ?? "").slice(0, 80),
      plan: data.plan === "choice" ? "choice" : "free",
      tier: data.tier === "article" ? "article" : "featured",
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

let _adminSessionOk = false;
let _adminCheckedAt = 0;
let _adminCheckPromise: Promise<boolean> | null = null;
const ADMIN_CHECK_TTL_MS = 3 * 60 * 1000; // 3 minutes

export async function ensureAdminSession(): Promise<boolean> {
  // Always verify on the server side
  if (typeof window === "undefined") {
    await requireAdmin();
    return true;
  }
  // Client-side cache: if verified recently, return instantly
  const now = Date.now();
  if (_adminSessionOk && now - _adminCheckedAt < ADMIN_CHECK_TTL_MS) {
    return true;
  }
  if (_adminCheckPromise) return _adminCheckPromise;
  _adminCheckPromise = requireAdmin()
    .then((res) => {
      _adminSessionOk = true;
      _adminCheckedAt = Date.now();
      _adminCheckPromise = null;
      return res;
    })
    .catch((err) => {
      _adminSessionOk = false;
      _adminCheckedAt = 0;
      _adminCheckPromise = null;
      throw err;
    });
  return _adminCheckPromise;
}

export function invalidateAdminSessionCache() {
  _adminSessionOk = false;
  _adminCheckedAt = 0;
  _adminCheckPromise = null;
}

export const requireAdmin = createServerFn({ method: "GET" }).handler(async () => {
  await adminOnly();
  return true;
});

export const toggleAppHotFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
    return {
      id: String(data.id ?? ""),
    };
  })
  .handler(async ({ data }) => {
    await adminOnly();
    const { toggleAppHot } = await import("./directory.server");
    return toggleAppHot(data.id);
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
    badges: badges.filter((app) => !app.editorChoice && app.isUserSubmitted),
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

export const recordAppViewFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const slug = typeof input === "object" && input && "slug" in input ? String(input.slug) : "";
    return { slug };
  })
  .handler(async ({ data }) => {
    if (!data.slug) return;
    const { recordAppView } = await import("./directory.server");
    await recordAppView(data.slug);
  });
