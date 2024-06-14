A simple utility to declare a filesystem test fixture: a directory containing a
number of files, used for testing some library or CLI tool.

> Note: initially, this utility is not published to npm. You can install it directly from git:
>
>     npm i -D https://github.com/TypeStrong/fs-fixture-builder
>
> If necessary, we can publish to npm in the future.

## Basic usage

- instantiate a new Project instance, letting it pick a temp directory, or passing a path to a root directory.
- declare a bunch of files in-memory
- use `rm` to delete the contents of the fixture directory
- use `write` to write all files into the fixture directory

Depending on your testing style, you may want to call `rm` in test teardown, or you may want to
leave the fixture on disk for manual testing. If the latter, you can call `rm` immediately before `write`
to reset the fixture every time it runs.

[Explicit Resource Management](https://github.com/tc39/proposal-explicit-resource-management)
may also be used to automatically call `rm` on the project when it goes out of scope.

```ts
import { tempdirProject } from "@typestrong/fs-fixture-builder";
import { test } from "node:test"

test("Something with the filesystem", () => {
    using project = tempdirProject();
    // project will be cleaned up automatically after the test, even if it fails
})
```

## CLI

The command `capture-fs-fixture` is provided by this package to traverse a directory and generate code to recreate
that directory with this tool. After installing, run `npx capture-fs-fixture path/to/dir > out.ts`
