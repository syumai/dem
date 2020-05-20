import { Config, validateConfig } from "./config.ts";
import { Module } from "./module.ts";
import * as path from "./vendor/https/deno.land/std/path/mod.ts";
import { sprintf } from "./vendor/https/deno.land/std/fmt/sprintf.ts";
import { createURL } from "./net.ts";

const vendorDirectoryPath = "vendor";

export type Repository = {
  removeModule(moduleProtocol: string, modulePath: string): Promise<void>;
  addLink(
    moduleProtocol: string,
    modulePath: string,
    moduleVersion: string,
    filePath: string,
    hasDefaultExport: boolean,
  ): Promise<void>;
  removeLink(
    moduleProtocol: string,
    modulePath: string,
    filePath: string,
  ): Promise<void>;
  addAlias(
    moduleProtocol: string,
    modulePath: string,
    filePath: string,
    aliasPath: string,
    hasDefaultExport: boolean,
  ): Promise<void>;
  removeAlias(aliasPath: string): Promise<void>;
  updateLink(
    moduleProtocol: string,
    modulePath: string,
    moduleVersion: string,
    filePath: string,
    hasDefaultExport: boolean,
  ): Promise<void>;
  loadConfig(): Promise<Config>;
  saveConfig(config: Config): void;
};

const dec = new TextDecoder("utf-8");
const enc = new TextEncoder();

export class StorageRepository {
  constructor(private filePath: string) {}

  async removeModule(
    moduleProtocol: string,
    modulePath: string,
  ): Promise<void> {
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
  }

  async addLink(
    moduleProtocol: string,
    modulePath: string,
    moduleVersion: string,
    filePath: string,
    hasDefaultExport: boolean,
  ): Promise<void> {
    const directoryPath = path.dirname(filePath);
    const fp = path.join(
      vendorDirectoryPath,
      moduleProtocol,
      modulePath,
      filePath,
    );
    const dp = path.join(
      vendorDirectoryPath,
      moduleProtocol,
      modulePath,
      directoryPath,
    );
    const url = createURL(moduleProtocol, modulePath, moduleVersion, filePath);
    let script = sprintf('export * from "%s";\n', url);
    if (hasDefaultExport) {
      script += sprintf('export { default } from "%s";\n', url);
    }

    // create directories and file
    await Deno.mkdir(dp, { recursive: true });
    await Deno.writeFile(fp, enc.encode(script));
  }

  async removeLink(
    moduleProtocol: string,
    modulePath: string,
    filePath: string,
  ): Promise<void> {
    const fp = path.join(
      vendorDirectoryPath,
      moduleProtocol,
      modulePath,
      filePath,
    );

    try {
      await Deno.remove(fp, { recursive: false });
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        throw new Error(`link already removed: ${fp}`);
      } else {
        throw new Error(`failed to remove directory: ${fp}, ${e}`);
      }
    }
  }

  async addAlias(
    moduleProtocol: string,
    modulePath: string,
    filePath: string,
    aliasPath: string,
    hasDefaultExport: boolean,
  ): Promise<void> {
    const aliasDirectoryPath = path.dirname(aliasPath);
    const fp = path.join(
      vendorDirectoryPath,
      aliasPath,
    );
    const dp = path.join(
      vendorDirectoryPath,
      aliasDirectoryPath,
    );
    const aliasTargetPath = `./${moduleProtocol}/${modulePath}/${filePath}`;
    let script = sprintf('export * from "%s";\n', aliasTargetPath);
    if (hasDefaultExport) {
      script += sprintf('export { default } from "%s";\n', aliasTargetPath);
    }

    // create directories and file
    await Deno.mkdir(dp, { recursive: true });
    await Deno.writeFile(fp, enc.encode(script));
  }

  async removeAlias(aliasPath: string): Promise<void> {
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
  }

  async updateLink(
    moduleProtocol: string,
    modulePath: string,
    moduleVersion: string,
    filePath: string,
    hasDefaultExport: boolean,
  ): Promise<void> {
    const fp = path.join(
      vendorDirectoryPath,
      moduleProtocol,
      modulePath,
      filePath,
    );
    const url = createURL(moduleProtocol, modulePath, moduleVersion, filePath);
    let script = sprintf('export * from "%s";\n', url);
    if (hasDefaultExport) {
      script += sprintf('export { default } from "%s";\n', url);
    }
    await Deno.writeFile(fp, enc.encode(script));
  }

  async loadConfig(): Promise<Config> {
    const jsonBody = dec.decode(await Deno.readFile(this.filePath));
    const configObj = JSON.parse(jsonBody);
    if (!configObj.aliases) {
      configObj.aliases = {};
    }
    const config = configObj as Config;
    // throws error
    validateConfig(config);
    config.modules = config.modules.map(
      (mod) => new Module(mod.protocol, mod.path, mod.version, mod.files),
    );
    return config;
  }

  async saveConfig(config: Config) {
    const jsonBody = JSON.stringify(config, undefined, 2);
    await Deno.writeFile(this.filePath, enc.encode(jsonBody));
  }
}
