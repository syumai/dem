import { Module } from "./module.ts";
const { readFile, writeFile } = Deno;

export type Config = {
  modules: Module[];
};

function validateConfig(config: Config) {
  if (typeof config !== "object") {
    throw new Error(`config type must be 'object'. actual: '${typeof config}'`);
  }
  if (!Array.isArray(config.modules)) {
    throw new Error(
      `version type must be Array. actual: '${typeof config.modules}'`,
    );
  }
  config.modules.forEach((mod, i) => {
    if (!mod.protocol || !mod.path || !mod.files) {
      throw new Error(
        `module format is invalid. index: ${i}, protocol: ${mod.protocol}, path: ${mod.path}`,
      );
    }
  });
}

export async function getConfig(filePath: string): Promise<Config | undefined> {
  const dec = new TextDecoder("utf-8");
  const jsonBody = dec.decode(await readFile(filePath));
  const config = JSON.parse(jsonBody) as Config;
  try {
    validateConfig(config);
  } catch (e) {
    console.error(e);
    return undefined;
  }
  config.modules = config.modules.map(
    (mod) => new Module(mod.protocol, mod.path, mod.version, mod.files),
  );
  return config;
}

export async function saveConfig(config: Config, filePath: string) {
  const enc = new TextEncoder();
  const jsonBody = JSON.stringify(config, undefined, 2);
  await writeFile(filePath, enc.encode(jsonBody));
}
