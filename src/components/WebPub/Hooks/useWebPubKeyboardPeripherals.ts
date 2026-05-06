import { useMemo } from "react";
import { IKeyboardPeripheralsConfig } from "@readium/navigator";
import { useActionsPreferences } from "@/preferences/hooks/useActionsPreferences";
import { toActionPeripheralType } from "@/helpers/peripherals";

export const useWebPubKeyboardPeripherals = (): IKeyboardPeripheralsConfig => {
  const { actionsKeys } = useActionsPreferences();

  return useMemo(() => {
    const config: IKeyboardPeripheralsConfig = [];

    for (const [key, tokens] of Object.entries(actionsKeys)) {
      const shortcut = tokens?.shortcut;
      if (shortcut) config.push({ type: toActionPeripheralType(key), keyCombos: shortcut.keyCombos });
    }

    return config;
  }, [actionsKeys]);
};
