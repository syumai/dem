import { Module } from "./module.ts";
export const ADD_MODULE = "ADD_MODULE" as const;
export const REMOVE_MODULE = "REMOVE_MODULE" as const;
export const ADD_LINK = "ADD_LINK" as const;
export const REMOVE_LINK = "REMOVE_LINK" as const;
export const ADD_ALIAS = "ADD_ALIAS" as const;
export const REMOVE_ALIAS = "REMOVE_ALIAS" as const;
export const UPDATE_MODULE = "UPDATE_MODULE" as const;

export interface AddModuleAction {
  type: typeof ADD_MODULE;
  payload: {
    module: Module;
  };
}

export interface RemoveModuleAction {
  type: typeof REMOVE_MODULE;
  payload: {
    moduleProtocol: string;
    modulePath: string;
  };
}

export interface AddLinkAction {
  type: typeof ADD_LINK;
  payload: {
    link: string;
  };
}

export interface RemoveLinkAction {
  type: typeof REMOVE_LINK;
  payload: {
    link: string;
  };
}

export interface AddAliasAction {
  type: typeof ADD_ALIAS;
  payload: {
    aliasTargetPath: string;
    aliasPath: string;
  };
}

export interface RemoveAliasAction {
  type: typeof REMOVE_ALIAS;
  payload: {
    aliasPath: string;
  };
}

export interface UpdateModuleAction {
  type: typeof UPDATE_MODULE;
  payload: {
    moduleProtocol: string;
    modulePath: string;
    moduleVersion: string;
  };
}

export type Action =
  | AddModuleAction
  | RemoveModuleAction
  | AddLinkAction
  | RemoveLinkAction
  | AddAliasAction
  | RemoveAliasAction
  | UpdateModuleAction;
