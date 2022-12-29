import { readdirSync, readFileSync, statSync } from "fs";
import { basename, join, relative, resolve } from "path";

const IGNORED_PATHS = [
  "node_modules",
  ".git",
  "package-lock.json",
  "yarn.lock",
];

function parseArgs() {
  let useTemp = false;
  let path: string | undefined;

  for (const arg of process.argv.slice(2)) {
    if (arg === "-t") {
      useTemp = true;
    } else if (!arg.startsWith("-") && !path) {
      path = arg;
    } else {
      return null;
    }
  }

  return { useTemp, path: path ? resolve(path) : process.cwd() };
}

function createFixture({ path, useTemp }: { path: string; useTemp: boolean }) {
  const out = [
    `import { ${
      useTemp ? "tempdirProject" : "project"
    } } from '@typestrong/fs-fixture-builder'`,
    "",
    useTemp
      ? "const fixture = tempdirProject()"
      : `const fixture = project('${basename(path)}')`,
  ];

  const root = path;
  const queue = [path];

  while (queue.length) {
    const current = queue.shift()!;

    if (IGNORED_PATHS.some((p) => current.endsWith(p))) continue;

    try {
      const stat = statSync(current);

      if (stat.isFile()) {
        const content = readFileSync(current, "utf-8");
        const relPath = relative(root, current);

        if (current.endsWith(".json")) {
          try {
            const parsed = JSON.parse(content);
            out.push(
              `fixture.addJsonFile('${relPath}', ${JSON.stringify(
                parsed,
                null,
                "\t"
              )})`
            );
            continue;
          } catch {
            // ignore
          }
        }

        out.push(
          `fixture.addFile('${relPath}', \`${escapeContent(content)}\`)`
        );
      } else if (stat.isDirectory()) {
        queue.push(
          ...readdirSync(current).map((inner) => join(current, inner))
        );
      }
    } catch {
      // ignore
    }
  }

  console.log(out.join("\n"));
}

function escapeContent(str: string) {
  return str.replace(/[`\\]|\$\{/g, "\\$&");
}

function main(): number {
  const args = parseArgs();
  if (!args) {
    console.log("Usage: npx capture-fs-fixture [-t] [path]");
    return 1;
  }

  createFixture(args);

  return 0;
}

process.exit(main());
