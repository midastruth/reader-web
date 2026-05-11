"use client";

import { useMemo } from "react";
import { IKeyboardPeripheralsConfig } from "@readium/navigator";
import { toActionPeripheralType } from "@/helpers/peripherals";
import { useAudioActionsPreferences } from "@/preferences/hooks/useActionsPreferences";

export const useAudioKeyboardPeripherals = (): IKeyboardPeripheralsConfig => {
  const { primaryActionsKeys, secondaryActionsKeys, primaryDisplayOrder, secondaryDisplayOrder } = useAudioActionsPreferences();

  return useMemo(() => {
    const config: IKeyboardPeripheralsConfig = [];
    const allKeys = { ...primaryActionsKeys, ...secondaryActionsKeys };

    for (const [key, tokens] of Object.entries(allKeys)) {
      const shortcut = tokens?.shortcut;
      const isInOrder = primaryDisplayOrder.includes(key) || secondaryDisplayOrder.includes(key);
      if (shortcut && isInOrder) config.push({ type: toActionPeripheralType(key), keyCombos: shortcut.keyCombos });
    }
    return config;
  }, [primaryActionsKeys, secondaryActionsKeys, primaryDisplayOrder, secondaryDisplayOrder]);
};
