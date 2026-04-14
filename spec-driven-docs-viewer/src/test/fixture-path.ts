import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export function fixturePath(name: string): string {
  return path.resolve(here, "../../tests/fixtures", name);
}
