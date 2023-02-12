import * as fs from "fs";
import * as Path from "path";
import { readFromFsIntoFixture } from "./read-from";

// Helpers to describe a bunch of files in a project programmatically,
// then write them to disk in a temp directory.

let fixturesRootDir = process.cwd();
export function setFixturesRootDir(path: string) {
  fixturesRootDir = path;
}

export type File = StringFile | JsonFile<unknown>;
export interface BaseFile {
  path: string;
  content: string;
}
export interface StringFile extends BaseFile {
  type: 'string';
}
export interface JsonFile<T = unknown> extends BaseFile {
  type: 'json';
  obj: T;
}
export interface DirectoryApi {
  add<T extends File>(file: T): T;
  addFile(...args: Parameters<typeof file>): StringFile;
  addFiles(files: Record<string, string | object | null | undefined>): File[];
  addJsonFile(...args: Parameters<typeof jsonFile>): JsonFile<any>;
  dir(dirPath: string, cb?: (dir: DirectoryApi) => void): DirectoryApi;
  readFrom(realFsDirPath: string, targetPath?: string, ignoredPaths?: string[]): void;
  getFile(path: string): File | undefined;
  getJsonFile(path: string): JsonFile<any> | undefined;
}

export type ProjectAPI = ReturnType<typeof projectInternal>;
// Verify that ProjectAPI implements full DirectoryApi
const _typeTest: DirectoryApi = null as any as ProjectAPI;

export function file(path: string, content = ""): StringFile {
  return { type: 'string', path, content };
}
export function jsonFile<T>(path: string, obj: T) {
  const file: JsonFile<T> = {
    type: 'json',
    path,
    obj,
    get content() {
      return JSON.stringify(obj, null, 2);
    },
  };
  return file;
}
function cloneFile(f: File): File {
  if(f.type === 'json') {
    return jsonFile(f.path, JSON.parse(JSON.stringify(f.obj)));
  } else {
    return file(f.path, f.content);
  }
}

export interface ProjectOptions {
  name: string;
  rootDir?: string;
}

export function tempdirProject(options: string | Partial<ProjectOptions> = "") {
  if (typeof options === "string") {
    options = { name: options };
  }
  const rootTmpDir = options.rootDir ?? `${fixturesRootDir}/tmp`;
  fs.mkdirSync(rootTmpDir, { recursive: true });
  const tmpdir = fs.mkdtempSync(`${rootTmpDir}/${options.name ?? ""}`);
  return projectInternal(tmpdir);
}

export type Project = ReturnType<typeof project>;
export function project(options: string | ProjectOptions) {
  if (typeof options === "string") {
    options = { name: options };
  }
  const rootDir = options.rootDir ?? `${fixturesRootDir}/tmp`;
  return projectInternal(`${rootDir}/${options.name}`);
}

function projectInternal(cwd: string) {
  const files: File[] = [];
  function write() {
    for (const file of files) {
      fs.mkdirSync(Path.dirname(file.path), { recursive: true });
      fs.writeFileSync(file.path, file.content);
    }
  }
  function rm() {
    try {
      if (fs.rmSync) {
        fs.rmSync(cwd, { recursive: true, force: true });
      } else {
        fs.rmdirSync(cwd, { recursive: true });
      }
    } catch (err) {
      if (fs.existsSync(cwd)) throw err;
    }
  }
  function copyFilesFrom(other: ProjectAPI) {
    for(const f of other.files) {
      add(cloneFile(f));
    }
    return fixture;
  }
  function createDirectory(
    dirPath: string,
    cb?: (dir: DirectoryApi) => void
  ): DirectoryApi {
    function add<T extends File>(file: T) {
      file.path = Path.join(dirPath, file.path);
      files.push(file);
      return file;
    }
    function addFiles(files: Record<string, string | object | null | undefined>) {
      return Object.entries(files).map(([path, content]) => {
        if(typeof content === 'string') {
          return addFile(path, content);
        } else if(content !== undefined) {
          return addJsonFile(path, content);
        }
      }).filter(v => v !== undefined) as Array<StringFile | JsonFile<any>>;
    }
    function addFile(...args: Parameters<typeof file>) {
      return add(file(...args));
    }
    function addJsonFile(...args: Parameters<typeof jsonFile>) {
      return add(jsonFile(...args)) as JsonFile<unknown>;
    }
    function dir(path: string, cb?: (dir: DirectoryApi) => void) {
      return createDirectory(Path.join(dirPath, path), cb);
    }
    function readFrom(realFsDirPath: string, targetPath?: string, ignoredPaths?: string[]): void {
      const targetDir = targetPath ? dir(targetPath) : _dir;
      readFromFsIntoFixture(realFsDirPath, targetDir);
    }
    function getFile(path: string): File | undefined {
      const filePath = Path.join(dirPath, path);
      // Search for most recently appended in case the same file was written multiple times,
      // because we do not dedupe on write.
      // A bit of a hack.
      for(let i = files.length - 1; i >= 0; i--) {
        const file = files[i];
        if (file.path === filePath) return file;
      }
    }
    function getJsonFile(path: string): JsonFile<any> | undefined {
      const found = getFile(path);
      if(found && (found as JsonFile).type !== 'json') throw new Error(`Found file in fixture, but it is type ${(found as File).type} instead of json.`);
      return found as JsonFile | undefined;
    }
    const _dir: DirectoryApi = {
      add,
      addFiles,
      addFile,
      addJsonFile,
      dir,
      readFrom,
      getFile,
      getJsonFile,
    };
    cb?.(_dir);
    return _dir;
  }
  const { add, addFile, addJsonFile, dir, readFrom, getFile, getJsonFile, addFiles } = createDirectory(cwd);
  const fixture = {
    cwd,
    files,
    dir,
    readFrom,
    getFile,
    getJsonFile,
    add,
    addFile,
    addFiles,
    addJsonFile,
    write,
    rm,
    copyFilesFrom
  };
  return fixture;
}
