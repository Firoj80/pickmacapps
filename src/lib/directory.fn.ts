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
    const { findExistingPublishedApp } = await import("./directory.server");
    const result = await fetchAppMetadata(data.url);
    const existing = await findExistingPublishedApp(data.url, result.ok ? result.data.name : undefined);
    return {
      ...result,
      alreadyListed: existing
        ? {
            id: existing.id,
            name: existing.name,
            slug: existing.slug,
            isPaid: existing.editor_choice,
            tier: existing.featured_tier,
          }
        : null,
    };
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
      mlVisitorId: typeof data.mlVisitorId === "string" ? data.mlVisitorId.slice(0, 100) : undefined,
      mlSessionId: typeof data.mlSessionId === "string" ? data.mlSessionId.slice(0, 100) : undefined,
    };
  })
  .handler(async ({ data }) => {
    const { submitListing } = await import("./directory.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const origin = request ? new URL(request.url).origin : "";
    const cookieHeader = request?.headers.get("cookie") ?? "";
    const cookieVid = cookieHeader.match(/(?:^|;\s*)ml_vid=([^;]*)/)?.[1];
    const cookieSid = cookieHeader.match(/(?:^|;\s*)ml_sid=([^;]*)/)?.[1];
    const mlVisitorId = (cookieVid ? decodeURIComponent(cookieVid) : "") || data.mlVisitorId || "";
    const mlSessionId = (cookieSid ? decodeURIComponent(cookieSid) : "") || data.mlSessionId || "";
    return submitListing(data, origin, { mlVisitorId, mlSessionId });
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

// ---------------------------------------------------------------------------
// Client-side Admin Navigation Cache (Stale-While-Revalidate)
// ---------------------------------------------------------------------------
let _adminHomeCache: unknown = null;
let _adminHomeCachedAt = 0;
let _adminHomePromise: Promise<unknown> | null = null;

let _adminAppsCache: unknown = null;
let _adminAppsCachedAt = 0;
let _adminAppsPromise: Promise<unknown> | null = null;

let _adminGuidesCache: unknown = null;
let _adminGuidesCachedAt = 0;
let _adminGuidesPromise: Promise<unknown> | null = null;

const ADMIN_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function invalidateAdminDataCache() {
  _adminHomeCache = null;
  _adminHomeCachedAt = 0;
  _adminHomePromise = null;
  _adminAppsCache = null;
  _adminAppsCachedAt = 0;
  _adminAppsPromise = null;
  _adminGuidesCache = null;
  _adminGuidesCachedAt = 0;
  _adminGuidesPromise = null;
}

if (typeof window !== "undefined") {
  (window as unknown as { __invalidateAdminDataCache?: () => void }).__invalidateAdminDataCache = invalidateAdminDataCache;
}

export async function getCachedAdminHome() {
  if (typeof window === "undefined") return fetchAdminHome();
  const now = Date.now();
  if (_adminHomeCache !== null) {
    if (now - _adminHomeCachedAt > ADMIN_CACHE_TTL_MS && !_adminHomePromise) {
      _adminHomePromise = fetchAdminHome().then((res) => {
        _adminHomeCache = res;
        _adminHomeCachedAt = Date.now();
        _adminHomePromise = null;
        return res;
      }).catch(() => {
        _adminHomePromise = null;
        return _adminHomeCache;
      });
    }
    return _adminHomeCache as Awaited<ReturnType<typeof fetchAdminHome>>;
  }
  if (_adminHomePromise) return _adminHomePromise as Promise<Awaited<ReturnType<typeof fetchAdminHome>>>;
  _adminHomePromise = fetchAdminHome().then((res) => {
    _adminHomeCache = res;
    _adminHomeCachedAt = Date.now();
    _adminHomePromise = null;
    return res;
  }).catch((err) => {
    _adminHomePromise = null;
    throw err;
  });
  return _adminHomePromise as Promise<Awaited<ReturnType<typeof fetchAdminHome>>>;
}

export async function getCachedAdminApps() {
  if (typeof window === "undefined") return fetchAdminApps();
  const now = Date.now();
  if (_adminAppsCache !== null) {
    if (now - _adminAppsCachedAt > ADMIN_CACHE_TTL_MS && !_adminAppsPromise) {
      _adminAppsPromise = fetchAdminApps().then((res) => {
        _adminAppsCache = res;
        _adminAppsCachedAt = Date.now();
        _adminAppsPromise = null;
        return res;
      }).catch(() => {
        _adminAppsPromise = null;
        return _adminAppsCache;
      });
    }
    return _adminAppsCache as Awaited<ReturnType<typeof fetchAdminApps>>;
  }
  if (_adminAppsPromise) return _adminAppsPromise as Promise<Awaited<ReturnType<typeof fetchAdminApps>>>;
  _adminAppsPromise = fetchAdminApps().then((res) => {
    _adminAppsCache = res;
    _adminAppsCachedAt = Date.now();
    _adminAppsPromise = null;
    return res;
  }).catch((err) => {
    _adminAppsPromise = null;
    throw err;
  });
  return _adminAppsPromise as Promise<Awaited<ReturnType<typeof fetchAdminApps>>>;
}

export async function getCachedAdminGuides() {
  if (typeof window === "undefined") return fetchAdminGuides();
  const now = Date.now();
  if (_adminGuidesCache !== null) {
    if (now - _adminGuidesCachedAt > ADMIN_CACHE_TTL_MS && !_adminGuidesPromise) {
      _adminGuidesPromise = fetchAdminGuides().then((res) => {
        _adminGuidesCache = res;
        _adminGuidesCachedAt = Date.now();
        _adminGuidesPromise = null;
        return res;
      }).catch(() => {
        _adminGuidesPromise = null;
        return _adminGuidesCache;
      });
    }
    return _adminGuidesCache as Awaited<ReturnType<typeof fetchAdminGuides>>;
  }
  if (_adminGuidesPromise) return _adminGuidesPromise as Promise<Awaited<ReturnType<typeof fetchAdminGuides>>>;
  _adminGuidesPromise = fetchAdminGuides().then((res) => {
    _adminGuidesCache = res;
    _adminGuidesCachedAt = Date.now();
    _adminGuidesPromise = null;
    return res;
  }).catch((err) => {
    _adminGuidesPromise = null;
    throw err;
  });
  return _adminGuidesPromise as Promise<Awaited<ReturnType<typeof fetchAdminGuides>>>;
}
