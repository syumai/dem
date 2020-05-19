import {
  ADD_MODULE,
  REMOVE_MODULE,
  ADD_LINK,
  REMOVE_LINK,
  ADD_ALIAS,
  REMOVE_ALIAS,
  UPDATE_MODULE,
  Action,
} from "./actions.ts";
import { sprintf } from "./vendor/https/deno.land/std/fmt/sprintf.ts";
import { Store, duplicateStore } from "./store.ts";
import { Module, moduleEquals, compareModules } from "./module.ts";
import { Repository } from "./repository.ts";
import * as path from "./vendor/https/deno.land/std/path/mod.ts";

const vendorDirectoryPath = "vendor";

// mutateStore mutates store. This affects only for memory.
export function mutateStore(store: Store, actions: Action[]): Store {
  const s = duplicateStore(store);
  const { modules } = s.config;
  const aliases = { ...s.config.aliases };
  for (const action of actions) {
    switch (action.type) {
      case ADD_MODULE: {
        const { module } = action.payload;
        for (const mod of modules) {
          if (moduleEquals(mod, module)) {
            throw new Error(`module already exists: ${module.toString()}
to update module, please use 'dem update'.`);
          }
        }
        modules.push(module);
        break;
      }

      case REMOVE_MODULE: {
        const { moduleProtocol, modulePath } = action.payload;
        const urlStr = `${moduleProtocol}://${modulePath}`;
        let foundModIndex = 0;
        let foundMod: Module | undefined;
        for (const mod of modules) {
          if (urlStr.startsWith(mod.toString())) {
            foundMod = mod;
            break;
          }
          foundModIndex++;
        }
        if (!foundMod) {
          throw new Error(`module not found for: ${urlStr}`);
        }
        modules.splice(foundModIndex, 1);
        break;
      }

      case ADD_LINK: {
        const { link } = action.payload;
        const foundMod = modules.find((mod) => {
          return link.startsWith(mod.toString());
        });
        if (!foundMod) {
          throw new Error(`module not found for: ${link}`);
        }
        const filePath = link.split(foundMod.toString())[1];
        if (foundMod.files.includes(filePath)) {
          throw new Error(`file already linked: ${link}`);
        }
        foundMod.files.push(filePath);
        break;
      }

      case REMOVE_LINK: {
        const { link } = action.payload;
        const foundMod = modules.find((mod) => {
          return link.startsWith(mod.toString());
        });
        if (!foundMod) {
          throw new Error(`module not found for: ${link}`);
        }
        const filePath = link.split(foundMod.toString())[1];
        const foundFileIndex = foundMod.files.indexOf(filePath);
        if (foundFileIndex < 0) {
          throw new Error(`file not linked: ${link}`);
        }
        foundMod.files.splice(foundFileIndex, 1);
        break;
      }

      case ADD_ALIAS: {
        const { aliasPath, aliasTargetPath } = action.payload;

        if (aliases[aliasPath]) {
          throw new Error(
            `alias already exists for: ${aliasPath}. please execute dem unalias before this.`,
          );
        }

        const foundMod = modules.find((mod) => {
          return aliasTargetPath.startsWith(mod.toString());
        });
        if (!foundMod) {
          throw new Error(`module not found for: ${aliasTargetPath}`);
        }

        aliases[aliasPath] = aliasTargetPath;
        break;
      }

      case REMOVE_ALIAS: {
        const { aliasPath } = action.payload;
        if (!aliases[aliasPath]) {
          throw new Error(
            `alias does not exist for: ${aliasPath}.`,
          );
        }
        delete aliases[aliasPath];
        break;
      }

      case UPDATE_MODULE: {
        const { moduleProtocol, modulePath, moduleVersion } = action.payload;
        const urlStr = `${moduleProtocol}://${modulePath}`;
        const foundMod = modules.find((mod) => {
          return mod.protocol === moduleProtocol && mod.path === modulePath;
        });
        if (!foundMod) {
          throw new Error(`module not found for: ${urlStr}`);
        }
        foundMod.version = moduleVersion;
        break;
      }
    }
  }

  // sort modules
  modules.sort(compareModules);
  for (const mod of modules) {
    mod.files.sort();
  }

  // sort aliases
  const aliasesEntries = Object.entries(aliases);
  aliasesEntries.sort((a, b) => {
    return a[0].localeCompare(b[0]);
  });
  s.config.aliases = Object.fromEntries(aliasesEntries);

  return s;
}

// mutateRepository mutates files controlled by repository.
// This persists mutated files.
export async function mutateRepository(
  repository: Repository,
  store: Store,
  actions: Action[],
) {
  const { modules } = store.config;
  for (const action of actions) {
    switch (action.type) {
      case ADD_MODULE: {
        // Do nothing for add module.
        break;
      }

      case REMOVE_MODULE: {
        const { moduleProtocol, modulePath } = action.payload;
        // Remove module directory
        const dp = path.join(
          vendorDirectoryPath,
          moduleProtocol,
          modulePath,
        );

        try {
          await Deno.remove(dp, { recursive: true });
        } catch (e) {
          if (e instanceof Deno.errors.NotFound) {
            throw new Error(`module already removed: ${dp}`);
          } else {
            throw new Error(`failed to remove directory: ${dp}, ${e}`);
          }
        }
        break;
      }

      case ADD_LINK: {
        const { link } = action.payload;
        // find module
        const foundMod = modules.find((mod) => {
          return link.startsWith(mod.toString());
        });
        if (!foundMod) {
          throw new Error(`module not found for: ${link}`);
        }

        // create file path
        const filePath = link.split(foundMod.toString())[1];
        const directoryPath = path.dirname(filePath);
        const enc = new TextEncoder();
        const fp = path.join(
          vendorDirectoryPath,
          foundMod.protocol,
          foundMod.path,
          filePath,
        );
        const dp = path.join(
          vendorDirectoryPath,
          foundMod.protocol,
          foundMod.path,
          directoryPath,
        );
        const script = sprintf(
          "export * from '%s%s';\n",
          foundMod.toStringWithVersion(),
          filePath,
        );

        // create directories and file
        await Deno.mkdir(dp, { recursive: true });
        await Deno.writeFile(fp, enc.encode(script));
        break;
      }

      case REMOVE_LINK: {
        const { link } = action.payload;
        const foundMod = modules.find((mod) => {
          return link.startsWith(mod.toString());
        });
        if (!foundMod) {
          throw new Error(`module not found for: ${link}`);
        }

        // create file path
        const filePath = link.split(foundMod.toString())[1];
        const fp = path.join(
          vendorDirectoryPath,
          foundMod.protocol,
          foundMod.path,
          filePath,
        );

        // remove link
        try {
          await Deno.remove(fp, { recursive: false });
        } catch (e) {
          if (e instanceof Deno.errors.NotFound) {
            throw new Error(`link already removed: ${fp}`);
          } else {
            throw new Error(`failed to remove directory: ${fp}, ${e}`);
          }
        }
        break;
      }

      case ADD_ALIAS: {
        const { aliasPath, aliasTargetPath } = action.payload;

        await Deno.mkdir(vendorDirectoryPath, { recursive: true });
        const foundMod = modules.find((mod) => {
          return aliasTargetPath.startsWith(mod.toString());
        });
        if (!foundMod) {
          throw new Error(`module not found for: ${aliasTargetPath}`);
        }

        const aliasDirectoryPath = path.dirname(aliasPath);
        const linkedFilePath = aliasTargetPath.split(foundMod.toString())[1];

        const enc = new TextEncoder();
        const fp = path.join(
          vendorDirectoryPath,
          aliasPath,
        );
        const dp = path.join(
          vendorDirectoryPath,
          aliasDirectoryPath,
        );
        const script = sprintf(
          "export * from './%s/%s%s';\n",
          foundMod.protocol,
          foundMod.path,
          linkedFilePath,
        );

        // create directories and file
        await Deno.mkdir(dp, { recursive: true });
        await Deno.writeFile(fp, enc.encode(script));
        break;
      }

      case REMOVE_ALIAS: {
        const { aliasPath } = action.payload;

        // Remove alias
        const fp = path.join(
          vendorDirectoryPath,
          aliasPath,
        );

        try {
          await Deno.remove(fp, { recursive: false });
        } catch (e) {
          if (e instanceof Deno.errors.NotFound) {
            throw new Error(`alias already removed: ${fp}`);
          } else {
            throw new Error(`failed to remove alias: ${fp}, ${e}`);
          }
        }
        break;
      }

      case UPDATE_MODULE: {
        const { moduleProtocol, modulePath, moduleVersion } = action.payload;
        const urlStr = `${moduleProtocol}://${modulePath}`;
        const foundMod = modules.find((mod) => {
          return mod.protocol === moduleProtocol && mod.path === modulePath;
        });
        if (!foundMod) {
          throw new Error(`module not found for: ${urlStr}`);
        }

        for (const filePath of foundMod.files) {
          const enc = new TextEncoder();
          const fp = path.join(
            vendorDirectoryPath,
            moduleProtocol,
            modulePath,
            filePath,
          );
          const script = sprintf(
            "export * from '%s://%s@%s%s';\n",
            moduleProtocol,
            modulePath,
            moduleVersion,
            filePath,
          );
          await Deno.writeFile(fp, enc.encode(script));
        }
        break;
      }
    }
  }
}
