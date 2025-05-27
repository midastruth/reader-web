import { PShortcut, ShortcutMetaKeywords } from "@/models/shortcut";

export const buildShortcut = (str: string) => {
  let shortcutObj: PShortcut = {
    key: "",
    char: "",
    modifiers: {
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      platformKey: false,
      shiftKey: false
    }
  }
  
  const shortcutArray = str.split(/\s*?[+-]\s*?/);

  shortcutArray.filter((val) => {
    if ((Object.values(ShortcutMetaKeywords) as string[]).includes(val)) {
      const trimmedKey = val.trim();
      shortcutObj.modifiers[trimmedKey] = true;
    } else {
      shortcutObj.char = val.trim().toUpperCase();
      shortcutObj.key = `Key${ val.trim().toUpperCase() }`;
    }
  });

  return shortcutObj.key ? shortcutObj : null;
}