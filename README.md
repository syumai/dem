# dem

- A module manager for Deno.

## Status

WIP

## Usage

### Installation

```console
deno install dem https://denopkg.com/syumai/dem/cmd.ts --allow-read --allow-write
```

### Commands

```console
dem init                                  // initialize denomod.ts
dem add https://deno.land/x/dejs@0.1.0    // add module `dejs` and set its version to `0.1.0`
dem get https://deno.land/x/dejs/mod.ts   // get `mod.ts` which is controlled by dem, and put it in vendor directory.
dem update https://deno.land/x/dejs@0.2.0 // update module to `0.2.0`
dem remove https://deno.land/x/dejs (WIP) // remove module `dejs`
dem ensure (WIP)                          // resolve modules used in project and download them
```

### Use modules

- Modules can be accessed using relative path without module version.

```ts
import { dejs } from '../../vendor/https/deno.land/x/dejs/mod.ts';
```

## Author

syumai

## License

MIT
