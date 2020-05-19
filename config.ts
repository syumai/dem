import { Module } from "./module.ts";

export type Config = {
  modules: Module[];
  aliases: {
    [name: string]: string;
  };
};

export function validateConfig(config: Config) {
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
  if (typeof config.aliases !== "object") {
    throw new Error(
      `config.aliases type must be 'object'. actual: '${typeof config
        .aliases}'`,
    );
  }
}
