import React from "react";

import { RSPrefs } from "@/preferences";
import { IShortcut, ShortcutRepresentation } from "@/models/shortcut";

import { Keyboard } from "react-aria-components";

import { useAppSelector } from "@/lib/hooks";
import { buildShortcut } from "@/helpers/keyboard/buildShortcut";
import { metaKeys } from "@/helpers/keyboard/getMetaKeys";

export const Shortcut: React.FC<IShortcut> = ({
  className,
  rawForm,
  representation = RSPrefs.shortcuts.representation || ShortcutRepresentation.symbol,
  joiner = RSPrefs.shortcuts.joiner || " + "
}) => {
  const platformModifier = useAppSelector(state => state.reader.platformModifier);

  const shortcutObj = buildShortcut(rawForm);

  if (shortcutObj) {
    let shortcutRepresentation = [];

    for (const prop in shortcutObj.modifiers) {
      if (shortcutObj.modifiers[prop]) {
        if (prop === "platformKey") {
          shortcutRepresentation.push(platformModifier[representation]);
        } else {
          const metaKey = metaKeys[prop];
          shortcutRepresentation.push(metaKey[representation]);
        }
      }
    }

    if (shortcutObj.char) {
      shortcutRepresentation.push(shortcutObj.char);
    }

    if (shortcutRepresentation.length > 0) {
      const displayShortcut = shortcutRepresentation.join(joiner);
      
      return (
        <Keyboard className={ className }>{ displayShortcut }</Keyboard>
      ) 
    } else {
      return (
        <></>
      )
    }
  }

  return (
    <></>
  );
}