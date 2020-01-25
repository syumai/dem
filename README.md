# dem

- A module version manager for Deno.
- dem creates versioned aliases of modules.
  - alias files are stored in `vendor` directory.
- modules managed by dem can be easily updated using `dem update`.

#### Example of alias file

- vendor/https/deno.land/x/dejs/mod.ts

```ts
export * from 'https://deno.land/x/dejs@0.3.1/mod.ts';
```

## Installation

```console
deno install dem https://deno.land/x/dem@0.3.1/cmd.ts --allow-read --allow-write
```

## Usage

- Initialize project and add module.

```console
$ dem init
successfully initialized a project.

$ dem add https://deno.land/std@v0.15.0
successfully added new module: https://deno.land/std, version: v0.15.0
```

- Import module from `vendor` directory in ts file.

example.ts

```ts
import * as path from './vendor/https/deno.land/std/fs/path.ts';

console.log(path.join(Deno.cwd(), 'example'));
```

- Resolve module files used in project.

```console
$ dem ensure
successfully created alias: https://deno.land/std@v0.15.0/fs/path.ts
```

- Run project.

```
$ deno example.ts
```

- If you want to update module, use `dem update`.

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
dem ensure                                 // resolve modules used in project and link them.
dem prune (WIP)                            // remove unused modules and aliases.
```

### Unsupported features

- default export
- dem prune
- manage `.d.ts` file

## Author

syumai

## License

MIT
