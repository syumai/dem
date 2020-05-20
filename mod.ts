const { cwd } = Deno;

import { Module } from "./module.ts";
import {
  ADD_MODULE,
  REMOVE_MODULE,
  ADD_LINK,
  REMOVE_LINK,
  ADD_ALIAS,
  REMOVE_ALIAS,
  UPDATE_MODULE,
  Action,
} from "./actions.ts";
import { mutateStore, mutateRepository } from "./mutations.ts";
import { Store } from "./store.ts";
import { Repository } from "./repository.ts";
import { getFormattedImportFilePaths } from "./ast.ts";

export class App {
  constructor(
    public store: Store,
    private repo: Repository,
  ) {}

  async init(): Promise<void> {
    await this.repo.saveConfig({
      modules: [],
      aliases: {},
    });
    console.log("successfully initialized dem.json");
  }

  async addModule(urlStr: string): Promise<void> {
    let module: Module;
    try {
      module = Module.parse(urlStr);
    } catch (e) {
      console.error(e.toString());
      return;
    }

    try {
      await this.commit([
        {
          type: ADD_MODULE,
          payload: { module },
        },
      ]);
    } catch (e) {
      console.error(e.toString());
      return;
    }

    console.log(
      `successfully added new module: ${module.toString()}, version: ${module.version}`,
    );
  }

  async removeModule(urlStr: string): Promise<void> {
    let module: Module;
    try {
      module = Module.parse(urlStr);
    } catch (e) {
      console.error(e.toString());
      return;
    }

    try {
      await this.commit([
        {
          type: REMOVE_MODULE,
          payload: {
            moduleProtocol: module.protocol,
            modulePath: module.path,
          },
        },
      ]);
    } catch (e) {
      console.error(e.toString());
      return;
    }

    console.log(`successfully removed module: ${urlStr}`);
  }

  async addLink(urlStr: string): Promise<void> {
    try {
      await this.commit([
        {
          type: ADD_LINK,
          payload: {
            link: urlStr,
          },
        },
      ]);
    } catch (e) {
      console.error(e.toString());
      return;
    }

    console.log(`successfully created link: ${urlStr}`);
  }

  async removeLink(urlStr: string): Promise<void> {
    try {
      await this.commit([
        {
          type: REMOVE_LINK,
          payload: {
            link: urlStr,
          },
        },
      ]);
    } catch (e) {
      console.error(e.toString());
      return;
    }

    console.log(`successfully removed link: ${urlStr}`);
  }

  async addAlias(aliasTargetPath: string, aliasPath: string): Promise<void> {
    try {
      await this.commit([
        {
          type: ADD_ALIAS,
          payload: {
            aliasPath,
            aliasTargetPath,
          },
        },
      ]);
    } catch (e) {
      console.error(e.toString());
      return;
    }

    console.log(
      `successfully created alias: ${aliasPath} => ${aliasTargetPath}`,
    );
  }

  async removeAlias(aliasPath: string): Promise<void> {
    try {
      await this.commit([
        {
          type: REMOVE_ALIAS,
          payload: {
            aliasPath,
          },
        },
      ]);
    } catch (e) {
      console.error(e.toString());
      return;
    }

    console.log(`successfully removed alias: ${aliasPath}`);
  }

  async updateModule(urlStr: string): Promise<void> {
    const updatedMod = Module.parse(urlStr);
    if (!updatedMod) {
      console.error(`failed to parse module: ${urlStr}`);
      return;
    }

    try {
      await this.commit([
        {
          type: UPDATE_MODULE,
          payload: {
            moduleProtocol: updatedMod.protocol,
            modulePath: updatedMod.path,
            moduleVersion: updatedMod.version,
          },
        },
      ]);
    } catch (e) {
      console.error(e.toString());
      return;
    }

    console.log(
      `successfully updated module: ${updatedMod.toString()}, version: ${updatedMod.version}`,
    );
  }

  async ensure(excludes: string[]): Promise<void> {
    const imports = await getFormattedImportFilePaths(cwd(), excludes);
    const actions: Action[] = [];
    for (const urlStr of imports) {
      let link = urlStr;
      if (this.store.config.aliases[urlStr]) {
        link = this.store.config.aliases[urlStr];
      }
      actions.push({
        type: ADD_LINK,
        payload: {
          link,
        },
      });
    }

    await this.commit(actions);
    console.log(`succeeded to resolve modules`);
  }

  async prune(excludes: string[]): Promise<void> {
    const imports = await getFormattedImportFilePaths(cwd(), excludes);

    // Detect removed links
    const removedLinks: string[] = [];
    const aliasValues = Object.values(this.store.config.aliases);
    for (const mod of this.store.config.modules) {
      for (const filePath of mod.files) {
        const modUrlStr = `${mod.protocol}://${mod.path}${filePath}`;
        if (!imports.includes(modUrlStr) && !aliasValues.includes(modUrlStr)) {
          removedLinks.push(modUrlStr);
        }
      }
    }

    const removeLinkActions: Action[] = [];
    // Remove links
    for (const link of removedLinks) {
      removeLinkActions.push({
        type: REMOVE_LINK,
        payload: {
          link,
        },
      });
    }

    try {
      this.store = mutateStore(this.store, removeLinkActions);
    } catch (e) {
      console.error(e.toString());
      return;
    }

    const removeModuleActions: Action[] = [];
    for (const mod of this.store.config.modules) {
      if (mod.files.length === 0) {
        removeModuleActions.push({
          type: REMOVE_MODULE,
          payload: {
            moduleProtocol: mod.protocol,
            modulePath: mod.path,
          },
        });
      }
    }

    try {
      this.store = mutateStore(this.store, removeModuleActions);
    } catch (e) {
      console.error(e.toString());
      return;
    }

    const actions: Action[] = [
      ...removeLinkActions,
      ...removeModuleActions,
    ];

    try {
      await mutateRepository(this.repo, this.store, actions);
    } catch (e) {
      console.error(e.toString());
      return;
    }

    await this.repo.saveConfig(this.store.config);
    console.log(`succeeded to prune modules`);
  }

  async commit(actions: Action[]) {
    this.store = mutateStore(this.store, actions);
    await mutateRepository(this.repo, this.store, actions);
    await this.repo.saveConfig(this.store.config);
  }
}
