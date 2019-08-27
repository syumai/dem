const { mkdir, writeFile, remove: removeFile } = Deno;

import { getConfig, saveConfig, Config } from './config.ts';
import { moduleEquals, parseModule, Module } from './module.ts';
import * as path from './vendor/https/deno.land/std/fs/path.ts';

const vendorDirectoryPath = 'vendor';

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
  const addedMod = parseModule(urlStr);
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
  // NOTE: is it correct to use localeCompare here?
  config.modules.sort((modA, modB) => modA.path.localeCompare(modB.path));
  await saveConfig(config, configFilePath);
  console.log(
    `successfully added new module: ${addedMod.protocol}://${addedMod.path}, version: ${addedMod.version}`
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
    const prefix = `${mod.protocol}://${mod.path}`;
    return urlStr.startsWith(prefix);
  });
  if (!foundMod) {
    console.error(`module not found for: ${urlStr}`);
    return;
  }

  const filePath = urlStr.split(`${foundMod.protocol}://${foundMod.path}`)[1];
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
  const script = `export * from '${foundMod.protocol}://${foundMod.path}@${foundMod.version}${filePath}';\n`;

  await mkdir(dp, true);
  await writeFile(fp, enc.encode(script));

  if (!foundMod.files.includes(filePath)) {
    foundMod.files.push(filePath);
    foundMod.files.sort((a, b) => a.localeCompare(b));
    saveConfig(config, configFilePath);
  }

  console.log(
    `successfully created alias: ${foundMod.protocol}://${foundMod.path}@${foundMod.version}${filePath}`
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
  const updatedMod = parseModule(urlStr);
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
    const script = `export * from '${updatedMod.protocol}://${updatedMod.path}@${updatedMod.version}${filePath}';`;
    await writeFile(fp, enc.encode(script));
  }
  foundMod.version = updatedMod.version;

  await saveConfig(config, configFilePath);
  console.log(
    `successfully updated module: ${updatedMod.protocol}://${updatedMod.path}, version: ${updatedMod.version}`
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
    const prefix = `${mod.protocol}://${mod.path}`;
    return urlStr.startsWith(prefix);
  });
  if (!foundMod) {
    console.error(`module not found for: ${urlStr}`);
    return;
  }

  // Remove aliases
  const filePath = urlStr.split(`${foundMod.protocol}://${foundMod.path}`)[1];
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
  // Validate added module.
  const config = await getConfig(configFilePath);
  if (!config) {
    console.error(`failed to get config: ${configFilePath}`);
    return;
  }
  let foundModIndex = 0;
  let foundMod: Module;
  for (const mod of config.modules) {
    const prefix = `${mod.protocol}://${mod.path}`;
    if (urlStr.startsWith(prefix)) {
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
  const filePath = urlStr.split(`${foundMod.protocol}://${foundMod.path}`)[1];
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
