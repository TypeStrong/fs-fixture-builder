import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { DirectoryApi } from "./fs-helpers";

const IGNORED_PATHS = [
  "node_modules",
  ".git",
  "package-lock.json",
  "yarn.lock",
];

export function readFromFsIntoFixture(root: string, fixture: DirectoryApi, ignoredPaths = IGNORED_PATHS) {
  const queue = [root];

  while (queue.length) {
    const current = queue.shift()!;

    if (ignoredPaths.some((p) => current.endsWith(p))) continue;

    try {
      const stat = statSync(current);

      if (stat.isFile()) {
        const content = readFileSync(current, "utf-8");
        const relPath = relative(root, current);

        if (current.endsWith(".json")) {
          try {
            const parsed = JSON.parse(content);
            fixture.addJsonFile(relPath, parsed);
            continue;
          } catch {
            // ignore
          }
        }

        fixture.addFile(relPath, content);

      } else if (stat.isDirectory()) {
        queue.push(
          ...readdirSync(current).map((inner) => join(current, inner))
        );
      }
    } catch {
      // ignore
    }
  }
}
