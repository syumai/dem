const { cwd, mkdir, writeFile, remove: removeFile, readDir, readFile } = Deno;

import { getConfig, saveConfig, Config } from './config.ts';
import { Module } from './module.ts';
import * as path from './vendor/https/deno.land/std/fs/path.ts';
// @deno-types='https://denopkg.com/syumai/TypeScript@dem/lib/typescript.d.ts';
import ts from './vendor/https/denopkg.com/syumai/TypeScript/lib/typescript-patched.js';

const vendorDirectoryPath = 'vendor';
const dec = new TextDecoder('utf-8');

function compareModules(modA: Module, modB: Module): number {
  return modA.path.localeCompare(modB.path);
}

function moduleEquals(a: Module, b: Module): boolean {
  return a.protocol === b.protocol && a.path === b.path;
}

export async function init(
  version: string,
  configFilePath: string
): Promise<void> {
  const config: Config = {
    version: version,
    modules: [],
  };
  await saveConfig(config, configFilePath);
  console.log('successfully initialized a project.');
}

export async function add(
  configFilePath: string,
  urlStr: string
): Promise<void> {
  // Validate added module.
  const config = await getConfig(configFilePath);
  if (!config) {
    console.error(`failed to get config: ${configFilePath}`);
    return;
  }
  const addedMod = Module.parse(urlStr);
  if (!addedMod) {
    console.error(`failed to parse module: ${urlStr}`);
    return;
  }
  const foundMod = config.modules.find(mod => {
    return moduleEquals(mod, addedMod);
  });
  if (foundMod) {
    console.error(`module already exists: ${urlStr}
to update module, please use 'dem update'.`);
    return;
  }

  // Update config.
  config.modules.push(addedMod);
  config.modules.sort(compareModules);
  await saveConfig(config, configFilePath);
  console.log(
    `successfully added new module: ${addedMod.toString()}, version: ${
      addedMod.version
    }`
  );
}

export async function link(
  configFilePath: string,
  urlStr: string
): Promise<void> {
  await mkdir(vendorDirectoryPath, true);
  const config = await getConfig(configFilePath);
  if (!config) {
    console.error(`failed to get config: ${configFilePath}`);
    return;
  }
  const foundMod = config.modules.find(mod => {
    return urlStr.startsWith(mod.toString());
  });
  if (!foundMod) {
    console.error(`module not found for: ${urlStr}`);
    return;
  }

  const filePath = urlStr.split(foundMod.toString())[1];
  if (foundMod.files.includes(filePath)) {
    return;
  }

  const directoryPath = path.dirname(filePath);
  const enc = new TextEncoder();
  const fp = path.join(
    vendorDirectoryPath,
    foundMod.protocol,
    foundMod.path,
    filePath
  );
  const dp = path.join(
    vendorDirectoryPath,
    foundMod.protocol,
    foundMod.path,
    directoryPath
  );
  const script = `export * from '${foundMod.toStringWithVersion()}${filePath}';\n`;

  await mkdir(dp, true);
  await writeFile(fp, enc.encode(script));

  foundMod.files.push(filePath);
  foundMod.files.sort((a, b) => a.localeCompare(b));
  saveConfig(config, configFilePath);

  console.log(
    `successfully created alias: ${foundMod.toStringWithVersion()}${filePath}`
  );
}

export async function update(
  configFilePath: string,
  urlStr: string
): Promise<void> {
  const config = await getConfig(configFilePath);
  if (!config) {
    console.error(`failed to get config: ${configFilePath}`);
    return;
  }
  const updatedMod = Module.parse(urlStr);
  if (!updatedMod) {
    console.error(`failed to parse module: ${urlStr}`);
    return;
  }
  const foundMod = config.modules.find(mod => {
    return moduleEquals(mod, updatedMod);
  });
  if (!foundMod) {
    console.error(`module not found for: ${urlStr}`);
    return;
  }

  for (const filePath of foundMod.files) {
    const enc = new TextEncoder();
    const fp = path.join(
      vendorDirectoryPath,
      foundMod.protocol,
      foundMod.path,
      filePath
    );
    const script = `export * from '${updatedMod.toStringWithVersion()}${filePath}';`;
    await writeFile(fp, enc.encode(script));
  }
  foundMod.version = updatedMod.version;

  await saveConfig(config, configFilePath);
  console.log(
    `successfully updated module: ${updatedMod.toString()}, version: ${
      updatedMod.version
    }`
  );
}

export async function unlink(
  configFilePath: string,
  urlStr: string
): Promise<void> {
  // Validate added module.
  const config = await getConfig(configFilePath);
  if (!config) {
    console.error(`failed to get config: ${configFilePath}`);
    return;
  }
  const foundMod = config.modules.find(mod => {
    return urlStr.startsWith(mod.toString());
  });
  if (!foundMod) {
    console.error(`module not found for: ${urlStr}`);
    return;
  }

  // Remove aliases
  const filePath = urlStr.split(foundMod.toString())[1];
  const fp = path.join(
    vendorDirectoryPath,
    foundMod.protocol,
    foundMod.path,
    filePath
  );

  const foundFileIndex = foundMod.files.indexOf(filePath);
  if (foundFileIndex < 0) {
    console.error(`file not found: ${filePath}`);
    return;
  }

  try {
    await removeFile(fp, { recursive: false });
  } catch (e) {
    console.error(`failed to remove file: ${fp}`);
    console.error(e);
    return;
  }

  // Update config.
  foundMod.files.splice(foundFileIndex, 1);
  await saveConfig(config, configFilePath);
  console.log(`successfully removed alias: ${urlStr}`);
}

export async function remove(
  configFilePath: string,
  urlStr: string
): Promise<void> {
  // Validate module to remove.
  const config = await getConfig(configFilePath);
  if (!config) {
    console.error(`failed to get config: ${configFilePath}`);
    return;
  }
  let foundModIndex = 0;
  let foundMod: Module;
  for (const mod of config.modules) {
    if (urlStr.startsWith(mod.toString())) {
      foundMod = mod;
      break;
    }
    foundModIndex++;
  }
  if (!foundMod) {
    console.error(`module not found for: ${urlStr}`);
    return;
  }

  // Remove aliases
  const filePath = urlStr.split(foundMod.toString())[1];
  const directoryPath = path.dirname(filePath);
  const dp = path.join(
    vendorDirectoryPath,
    foundMod.protocol,
    foundMod.path,
    directoryPath
  );
  // TODO: remove parent's blank directories recursive up to vendor

  try {
    await removeFile(dp, { recursive: true });
  } catch (e) {
    console.error(`failed to remove directory: ${dp}`);
    console.error(e);
    return;
  }

  // Update config.
  config.modules.splice(foundModIndex, 1);
  await saveConfig(config, configFilePath);
  console.log(`successfully removed module: ${urlStr}`);
}

function removeQuotes(s: string): string {
  return s.replace(/[\'\"\`]/g, '');
}

const crawlImport = (filePaths: string[], sourceFile: ts.SourceFile) => (
  node: ts.Node
) => {
  if (node.kind === ts.SyntaxKind.ImportDeclaration) {
    node.forEachChild((child: ts.Node) => {
      if (child.kind === ts.SyntaxKind.StringLiteral) {
        filePaths.push(removeQuotes(child.getText(sourceFile)));
      }
    });
  }
};

async function getImportFilePaths(
  dirName: string,
  excludes: string[]
): Promise<string[]> {
  const files = await readDir(dirName);
  const filePaths: string[] = [];
  for (const f of files) {
    if (!f.name) {
      continue;
    }
    if (f.isFile() && f.name.match(/\.(js|ts)x?$/)) {
      const body = await readFile(path.join(dirName, f.name));
      const sourceFile = ts.createSourceFile(
        f.name,
        dec.decode(body),
        ts.ScriptTarget.ES2020
      );
      sourceFile.forEachChild(crawlImport(filePaths, sourceFile));
    } else if (f.isDirectory() && !excludes.includes(f.name)) {
      const result = await getImportFilePaths(
        path.join(dirName, f.name),
        excludes
      );
      filePaths.push(...result);
    }
  }
  return filePaths;
}

export async function ensure(
  configFilePath: string,
  excludes: string[]
): Promise<void> {
  const imports = (await getImportFilePaths(cwd(), ['node_modules', 'vendor']))
    .filter(f => f.match(/vendor/))
    .map(f => f.replace(/^.+vendor\//, ''))
    .map(f => f.replace(/\//, '://'));
  for (const urlStr of imports) {
    await link(configFilePath, urlStr);
  }
}
