/** Copy the bundled catalog into the database only when that database has never
 *  held the directory. Once any app or guide row exists, admin deletes and
 *  Editor’s Choice stay as saved. A deploy must not put removed apps back.
 */
export function shouldSeedCatalogApps(
  seeded: string | null | undefined,
  appCount: number,
  directoryAlreadyUsed = false,
) {
  if (seeded === "1") return false;
  if (directoryAlreadyUsed) return false;
  if (!Number.isFinite(appCount) || appCount > 0) return false;
  return true;
}

/** Public pages render the server list only. A missing directory is empty, never the bundled catalog. */
export function publishedApps<T>(directory: { apps: readonly T[] } | null | undefined): T[] {
  return directory?.apps ? [...directory.apps] : [];
}
