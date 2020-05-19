import { App } from "./mod.ts";
import { version } from "./version.ts";
import { StorageRepository } from "./repository.ts";
import { Store } from "./store.ts";
import { Config } from "./config.ts";

const defaultConfigFilePath = "dem.json";

enum SubCommandType {
  Version = "version",
  Init = "init",
  Add = "add",
  Link = "link",
  Update = "update",
  Remove = "remove",
  Unlink = "unlink",
  Ensure = "ensure",
  Prune = "prune",
  Alias = "alias",
  Unalias = "unalias",
}

function isSubCommandType(t: string): t is SubCommandType {
  const commandTypes = Object.values(SubCommandType) as string[];
  return commandTypes.includes(t);
}

async function main(args: string[]): Promise<void> {
  const subCmdType = args[0];
  if (!subCmdType) {
    const subCmdTypes = Object.values(SubCommandType).join(", ");
    console.error(`sub command must be given: ${subCmdTypes}`);
    return;
  }
  if (!isSubCommandType(subCmdType)) {
    console.error(`sub command ${subCmdType} does not exist.`);
    return;
  }

  const repo = new StorageRepository(defaultConfigFilePath);

  let config: Config;
  try {
    config = await repo.loadConfig();
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) {
      console.error(`failed to get config, ${e}`);
      return;
    }
    config = {
      modules: [],
      aliases: {},
    };
  }
  const store: Store = { config };

  const dem = new App(store, repo);

  const excludes = ["vendor", "node_modules"];
  switch (subCmdType) {
    case SubCommandType.Version:
      console.log(`dem: ${version}`);
      break;
    case SubCommandType.Init:
      dem.init();
      break;
    case SubCommandType.Add:
      dem.addModule(args[1]);
      break;
    case SubCommandType.Link:
      dem.addLink(args[1]);
      break;
    case SubCommandType.Update:
      dem.updateModule(args[1]);
      break;
    case SubCommandType.Unlink:
      dem.removeLink(args[1]);
      break;
    case SubCommandType.Remove:
      dem.removeModule(args[1]);
      break;
    case SubCommandType.Ensure:
      dem.ensure(excludes);
      break;
    case SubCommandType.Prune:
      dem.prune(excludes);
      break;
    case SubCommandType.Alias:
      dem.addAlias(args[1], args[2]);
      break;
    case SubCommandType.Unalias:
      dem.removeAlias(args[1]);
      break;
  }
}

if (import.meta.main) {
  let { args } = Deno;
  if (args[0] === "--") {
    args = args.slice(1);
  }
  main(args);
}
