import { basename, relative, resolve } from "path";
import { JsonFile, project, StringFile } from "./fs-helpers";
import { readFromFsIntoFixture } from "./read-from";

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

function createFixture(options: { path: string; useTemp: boolean }) {
  const { path: root, useTemp } = options;
  const out = [
    `import { ${useTemp ? "tempdirProject" : "project"
    } } from '@typestrong/fs-fixture-builder'`,
    "",
    useTemp
      ? "const fixture = tempdirProject()"
      : `const fixture = project('${basename(root)}')`,
  ];

  const fixture = project({ rootDir: '', name: 'root' });
  fixture.readFrom(root);

  for (const _file of fixture.files) {
    const file = _file as JsonFile<any> | StringFile;

    const relPath = relative('/root', file.path);
    if (file.type === 'json') {
      out.push(
        `fixture.addJsonFile('${relPath}', ${JSON.stringify(
          file.obj,
          null,
          "\t"
        )})`
      );
    } else {
      out.push(
        `fixture.addFile('${relPath}', \`${escapeContent(file.content)}\`)`
      );
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
