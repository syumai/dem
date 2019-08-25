const { args } = Deno;
import { parse } from 'https://deno.land/std/flags/mod.ts';
import { Dem } from './mod.ts';

export const version = '0.1.0';

enum SubCommandType {
  Init = 'init',
  Add = 'add',
  Get = 'get',
  Update = 'update',
  Remove = 'remove',
  Ensure = 'ensure',
}

function isSubCommandType(t: string): t is SubCommandType {
  for (const value of Object.values(SubCommandType)) {
    if (value === t) {
      return true;
    }
  }
  return false;
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
  const dem = new Dem(version);
  switch (subCmdType) {
    case SubCommandType.Init:
      dem.init();
      break;
    case SubCommandType.Add:
      dem.add(args[2]);
      break;
    case SubCommandType.Get:
      dem.get(args[2]);
      break;
    case SubCommandType.Update:
      dem.update(args[2]);
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
