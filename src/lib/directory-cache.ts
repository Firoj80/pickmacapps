import { fetchDirectory } from "@/lib/directory.fn";

export type DirectoryResult = Awaited<ReturnType<typeof fetchDirectory>>;

const DIRECTORY_STALE_MS = 5 * 60 * 1000; // 5 minutes
const SKEW_RELOAD_KEY = "pickmacapps_skew_reload_at";
const SKEW_RELOAD_COOLDOWN_MS = 10_000;

let _directoryCache: DirectoryResult | null = null;
let _directoryCachedAt = 0;
let _directoryPromise: Promise<DirectoryResult | null> | null = null;

function isValidDirectory(dir: unknown): dir is DirectoryResult {
  return Boolean(dir && typeof dir === "object" && Array.isArray((dir as DirectoryResult).apps));
}

export function seedDirectoryCache(directory: DirectoryResult | null | undefined) {
  if (typeof window === "undefined" || !isValidDirectory(directory)) return;
  _directoryCache = directory;
  _directoryCachedAt = Date.now();
}

export function invalidateDirectoryCache() {
  _directoryCache = null;
  _directoryCachedAt = 0;
  _directoryPromise = null;
}

if (typeof window !== "undefined") {
  (window as unknown as { __invalidateDirectoryCache?: () => void }).__invalidateDirectoryCache =
    invalidateDirectoryCache;
}

export function reloadOnceOnSkew(targetHref?: string): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  try {
    const now = Date.now();
    const last = Number(window.sessionStorage.getItem(SKEW_RELOAD_KEY) ?? "0");
    if (Number.isFinite(last) && now - last < SKEW_RELOAD_COOLDOWN_MS) {
      return false;
    }
    window.sessionStorage.setItem(SKEW_RELOAD_KEY, String(now));
    if (targetHref) {
      window.location.assign(targetHref);
    } else {
      window.location.reload();
    }
    return true;
  } catch {
    return false;
  }
}

export function isChunkOrSkewError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "string"
      ? error
      : "";
  if (!msg) return false;
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Unable to preload CSS/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /Unexpected token '<'/i.test(msg)
  );
}

async function fetchDirectoryWithRetry(): Promise<DirectoryResult | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await fetchDirectory();
      if (isValidDirectory(result)) {
        _directoryCache = result;
        _directoryCachedAt = Date.now();
        return result;
      }
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 120));
      }
    }
  }
  return null;
}

export function refreshDirectoryCache(): Promise<DirectoryResult | null> {
  if (typeof window === "undefined") {
    return fetchDirectoryWithRetry();
  }
  if (_directoryPromise) return _directoryPromise;
  _directoryPromise = fetchDirectoryWithRetry().finally(() => {
    _directoryPromise = null;
  });
  return _directoryPromise;
}

export function getCachedDirectory(
  currentContextDirectory?: DirectoryResult | null,
): DirectoryResult | null | Promise<DirectoryResult | null> {
  if (typeof window === "undefined") {
    return fetchDirectoryWithRetry();
  }

  if (_directoryCache === null && isValidDirectory(currentContextDirectory)) {
    _directoryCache = currentContextDirectory;
    _directoryCachedAt = Date.now();
  }

  if (_directoryCache !== null) {
    const now = Date.now();
    if (now - _directoryCachedAt > DIRECTORY_STALE_MS && !_directoryPromise) {
      void refreshDirectoryCache();
    }
    return _directoryCache;
  }

  return refreshDirectoryCache();
}

export async function resolveRouteDirectoryMatch(
  contextDirectory: DirectoryResult | null | undefined,
  predicate: (directory: DirectoryResult | null | undefined) => boolean,
): Promise<{ found: boolean; directory: DirectoryResult | null | undefined }> {
  if (isValidDirectory(contextDirectory) && predicate(contextDirectory)) {
    seedDirectoryCache(contextDirectory);
    return { found: true, directory: contextDirectory };
  }

  if (typeof window !== "undefined" && isValidDirectory(_directoryCache) && predicate(_directoryCache)) {
    return { found: true, directory: _directoryCache };
  }

  if (typeof window !== "undefined") {
    const fresh = await refreshDirectoryCache();
    if (isValidDirectory(fresh)) {
      return { found: predicate(fresh), directory: fresh };
    }
    // If client serverFn failed (e.g. deployment skew / stale build), let router error boundary / reload recover cleanly instead of throwing false 404
    if (reloadOnceOnSkew()) {
      return { found: true, directory: contextDirectory ?? _directoryCache };
    }
    throw new Error("Could not load directory data. Please reload the page.");
  }

  return { found: false, directory: contextDirectory };
}

export function directoryFromMatches(
  matches: readonly { context?: { directory?: DirectoryResult | null } }[],
): DirectoryResult | null | undefined {
  for (let i = matches.length - 1; i >= 0; i--) {
    const dir = matches[i]?.context?.directory;
    if (isValidDirectory(dir)) return dir;
  }
  return matches[0]?.context?.directory;
}
