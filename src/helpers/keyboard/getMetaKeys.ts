import { IMetaKey, IMetaKeys, IPlatformModifier } from "@/models/shortcut";
import { isMacish } from "./getPlatform";

const altModifier: IMetaKey = {
  longform: "Option",
  shortform: "Alt",
  modifier: "altKey",
  symbol: "⌥"
}

const ctrlModifier: IMetaKey & IPlatformModifier = {
  longform: "Control",
  shortform: "Ctrl",
  modifier: "ctrlKey",
  symbol: "^"
}

const metaModifierMac: IMetaKey & IPlatformModifier = {
  longform: "Command",
  shortform: "Cmd",
  modifier: "metaKey",
  symbol: "⌘"   
}

const metaModifierWin: IMetaKey = {
  longform: "Windows",
  shortform: "Win",
  modifier: "metaKey",
  symbol: "⊞"
}

const shiftModifier: IMetaKey = {
  longform: "Shift",
  shortform: "Shift",
  modifier: "shiftKey",
  symbol: "⇧"
}

export const metaKeys: IMetaKeys = {
  altKey: altModifier,
  ctrlKey: ctrlModifier,
  metaKey: isMacish() ? metaModifierMac : metaModifierWin,
  shiftKey: shiftModifier
}

// Platform modifier differs from Mac to Windows so we have to get it dynamically

export const defaultPlatformModifier = ctrlModifier;

export const getPlatformModifier = (): IPlatformModifier => {
  if (isMacish()) {
    return metaModifierMac;
  } else {
    return ctrlModifier;
  }
}