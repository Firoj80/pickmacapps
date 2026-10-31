import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const root = new URL("../src/", import.meta.url)

export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/")) return nextResolve(specifier, context)
  const rel = specifier.slice(2)
  const candidates = [rel, `${rel}.ts`, `${rel}.tsx`, `${rel}.json`, `${rel}/index.ts`]
  for (const candidate of candidates) {
    const url = new URL(candidate, root)
    if (existsSync(fileURLToPath(url))) return nextResolve(url.href, context)
  }
  return nextResolve(new URL(rel, root).href, context)
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".json")) {
    return {
      format: "module",
      source: `export default ${readFileSync(fileURLToPath(url), "utf8")}`,
      shortCircuit: true,
    }
  }
  return nextLoad(url, context)
}
