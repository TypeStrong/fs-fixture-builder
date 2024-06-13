import { afterEach, beforeEach, test } from "node:test"
import { tempdirProject, type Project } from "#self"
import { equal } from "assert";
import { lstatSync, readFileSync } from "fs";
import { join } from "path";

let fixture: Project;
beforeEach(() => {
    fixture = tempdirProject();
});
afterEach(() => {
    fixture.rm();
})

test("Supports custom file types", () => {
    const file = {
        path: 'foo.txt',
        stuff: '',
        get content() {
            return this.stuff + "suffix";
        }
    };

    fixture.add(file);
    file.stuff += 'stuff-';

    fixture.write();

    equal(readFileSync(join(fixture.cwd, "foo.txt"), "utf-8"), "stuff-suffix");
})

test("Supports defining symlinks", () => {
    fixture.addFile("test.txt", "test");
    fixture.addSymlink("test2.txt", "test.txt");
    fixture.write();

    equal(readFileSync(join(fixture.cwd, "test2.txt"), "utf-8"), "test");
    const stat = lstatSync(join(fixture.cwd, "test2.txt"));
    equal(stat.isSymbolicLink(), true);
});
