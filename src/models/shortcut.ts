import { ActionKeys } from "./actions";

export interface IKey {
  [key: string]: string;
  longform: string;
  shortform: string;
}

export interface IMetaKey extends IKey {
  modifier: "altKey" | "ctrlKey" | "metaKey" | "shiftKey";
  symbol: "⌥" | "^" | "⌘" | "⊞" | "⇧";
}

export interface IPlatformModifier extends IKey {
  modifier: "ctrlKey" | "metaKey";
  symbol: "^" | "⌘";
}

export interface IMetaKeys {
  [key: string]: IMetaKey;
  altKey: IMetaKey;
  ctrlKey: IMetaKey;
  metaKey: IMetaKey;
  shiftKey: IMetaKey;
}

export enum ShortcutMetaKeywords {
  alt = "altKey",
  ctrl = "ctrlKey",
  meta = "metaKey",
  platform = "platformKey",
  shift = "shiftKey"
}

export enum ShortcutRepresentation {
  symbol = "symbol",
  short = "shortform",
  long = "longform"
};

export interface IShortcut {
  className?: string;
  rawForm: string;
  representation?: ShortcutRepresentation; 
  joiner?: string;
}

export interface PShortcut {
  key?: string;
  char?: string;
  modifiers: {
    [key: string]: boolean;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    platformKey: boolean;
    shiftKey: boolean;
  }
}

export interface PShortcuts {
  [key: string]: {
    actionKey: ActionKeys;
    modifiers: PShortcut["modifiers"];
  }
}