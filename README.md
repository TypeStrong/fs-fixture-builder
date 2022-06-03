A simple utility to declare a filesystem test fixture: a directory containing a
number of files, used for testing some library or CLI tool.

> Note: initially, this utility is not published to npm.  You can install it directly from git:
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
leave the fixture on disk for manual testing.  If the latter, you can call `rm` immediately before `write`
to reset the fixture every time it runs.