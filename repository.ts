import { Config, validateConfig } from "./config.ts";
import { Module } from "./module.ts";

export type Repository = {
  addModule(module: Module): Promise<void>;
  removeModule(moduleName: string): Promise<void>;
  addLink(link: string): Promise<void>;
  removeLink(moduleName: string, linkName: string): Promise<void>;
  addAlias(aliasTargetPath: string, aliasPath: string): Promise<void>;
  removeAlias(aliasPath: string): Promise<void>;
  updateLink(
    moduleProtocol: string,
    modulePath: string,
    moduleVersion: string,
  ): Promise<void>;
  loadConfig(): Promise<Config>;
  saveConfig(config: Config): void;
};

const dec = new TextDecoder("utf-8");
const enc = new TextEncoder();

export class StorageRepository {
  constructor(private filePath: string) {}

  async addModule(module: Module): Promise<void> {
    // TODO: implement
  }

  async removeModule(moduleName: string): Promise<void> {
    // TODO: implement
  }

  async addLink(link: string): Promise<void> {
    // TODO: implement
  }

  async removeLink(moduleName: string, linkName: string): Promise<void> {
    // TODO: implement
  }

  async addAlias(aliasTargetPath: string, aliasPath: string): Promise<void> {
    // TODO: implement
  }

  async removeAlias(aliasPath: string): Promise<void> {
    // TODO: implement
  }

  async updateLink(
    moduleProtocol: string,
    modulePath: string,
    moduleVersion: string,
  ): Promise<void> {
    // TODO: implement
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
