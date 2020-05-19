import { Config } from "./config.ts";

export type Store = {
  config: Config;
};

export function duplicateStore(s: Store): Store {
  return {
    config: {
      modules: [...s.config.modules],
      aliases: {
        ...s.config.aliases,
      },
    },
  };
}
