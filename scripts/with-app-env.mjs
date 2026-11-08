import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

export function projectRoot() {
  return dirname(dirname(fileURLToPath(import.meta.url)));
}
