# dem

[![Build Status](https://github.com/syumai/dem/workflows/test/badge.svg?branch=master)](https://github.com/syumai/dem/actions)

- A module version manager for Deno.
- dem creates versioned aliases of modules.
  - alias files are stored in `vendor` directory.
- modules managed by dem can be easily updated using `dem update`.

#### Example of alias file

- vendor/https/deno.land/x/dejs/mod.ts

```ts
export * from 'https://deno.land/x/dejs@0.2.0/mod.ts';
```

## Installation

```console
deno install --allow-read --allow-write -f dem https://deno.land/x/dem@0.6.0/cmd.ts
```

## Usage

### Getting Started

#### 1. Initialize the project.

```console
$ dem init
successfully initialized the project.
```

#### 2. Add a module.

```console
$ dem add https://deno.land/std@v0.15.0
successfully added new module: https://deno.land/std, version: v0.15.0
```

#### 3. Import the added module from the `vendor` directory.

example.ts

```ts
import * as path from './vendor/https/deno.land/std/fs/path.ts';

console.log(path.join(Deno.cwd(), 'example'));
```

#### 4. Resolve module files in the project.

```console
$ dem ensure
successfully created alias: https://deno.land/std@v0.15.0/fs/path.ts
# This alias file is stored as vendor/https/deno.land/std/fs/path.ts
```

#### 5. Run the project.

```
$ deno example.ts
```

### Update modules

```
$ dem update https://deno.land/std@v0.16.0
successfully updated module: https://deno.land/std, version: v0.16.0
```

## Commands

```console
dem init                                   // initialize dem.json
dem add https://deno.land/x/dejs@0.1.0     // add module `dejs` and set its version to `0.1.0`
dem link https://deno.land/x/dejs/mod.ts   // create alias of `dejs@0.1.0/mod.ts` and put it into vendor.
dem update https://deno.land/x/dejs@0.2.0  // update module to `0.2.0`
dem unlink https://deno.land/x/dejs/mod.ts // remove alias of `dejs@0.2.0/mod.ts`.
dem remove https://deno.land/x/dejs        // remove module `dejs`
dem ensure                                 // resolve file paths of added modules used in project and link them.
dem prune                                  // remove unused modules and aliases.
```

### Unsupported features

- default export
- manage `.d.ts` file

## Author

syumai

## License

MIT
