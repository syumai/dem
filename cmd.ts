const { args } = Deno;
import { parse } from './vendor/https/deno.land/std/flags/mod.ts';
import * as dem from './mod.ts';

export const version = '0.1.0';
const defaultConfigFilePath = 'dem.json';

enum SubCommandType {
  Init = 'init',
  Add = 'add',
  Link = 'link',
  Update = 'update',
  Remove = 'remove',
  Unlink = 'unlink',
  Ensure = 'ensure',
}

function isSubCommandType(t: string): t is SubCommandType {
  return Object.values(SubCommandType).includes(t);
}

async function main(): Promise<void> {
  const subCmdType = args[1];
  if (!subCmdType) {
    const subCmdTypes = Object.values(SubCommandType).join(', ');
    console.error(`sub command must be given: ${subCmdTypes}`);
    return;
  }
  if (!isSubCommandType(subCmdType)) {
    console.error(`sub command ${subCmdType} does not exist.`);
    return;
  }
  // const parsedArgs = parse(args.slice(2));
  switch (subCmdType) {
    case SubCommandType.Init:
      dem.init(version, defaultConfigFilePath);
      break;
    case SubCommandType.Add:
      dem.add(defaultConfigFilePath, args[2]);
      break;
    case SubCommandType.Link:
      dem.link(defaultConfigFilePath, args[2]);
      break;
    case SubCommandType.Update:
      dem.update(defaultConfigFilePath, args[2]);
      break;
    case SubCommandType.Remove:
      // dem.remove();
      break;
    case SubCommandType.Ensure:
      // dem.ensure();
      break;
  }
}

if (import.meta.main) {
  main();
}
