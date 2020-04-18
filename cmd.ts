import * as dem from "./mod.ts";
import { version } from "./version.ts";

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

  // const parsedArgs = parse(args.slice(2));
  const excludes = ["vendor", "node_modules"];
  switch (subCmdType) {
    case SubCommandType.Version:
      console.log(`dem: ${version}`);
      break;
    case SubCommandType.Init:
      dem.init(version, defaultConfigFilePath);
      break;
    case SubCommandType.Add:
      dem.add(defaultConfigFilePath, args[1]);
      break;
    case SubCommandType.Link:
      dem.link(defaultConfigFilePath, args[1]);
      break;
    case SubCommandType.Update:
      dem.update(defaultConfigFilePath, args[1]);
      break;
    case SubCommandType.Unlink:
      dem.unlink(defaultConfigFilePath, args[1]);
      break;
    case SubCommandType.Remove:
      dem.remove(defaultConfigFilePath, args[1]);
      break;
    case SubCommandType.Ensure:
      dem.ensure(defaultConfigFilePath, excludes);
      break;
    case SubCommandType.Prune:
      dem.prune(defaultConfigFilePath, excludes);
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
