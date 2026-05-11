import { useMemo } from "react";
import { IKeyboardPeripheralsConfig } from "@readium/navigator";
import { useActionsPreferences } from "@/preferences/hooks/useActionsPreferences";
import { useFullscreen } from "@/core/Hooks/useFullscreen";
import { useFilteredPreferenceKeys } from "@/preferences/hooks/useFilteredPreferenceKeys";
import { NavPeripheralType, toActionPeripheralType, ZOOM_IN_KEY_COMBOS, ZOOM_OUT_KEY_COMBOS } from "@/helpers/peripherals";
import { ThActionsKeys } from "@/preferences/models";
import { useActionComponentStatus } from "@/core/Components/Actions/hooks/useActionComponentStatus";

export const useWebPubKeyboardPeripherals = (): IKeyboardPeripheralsConfig => {
  const { actionsKeys } = useActionsPreferences();
  const { isSupported: isFullscreenSupported } = useFullscreen();
  const { webPubActionKeys } = useFilteredPreferenceKeys();

  const { isComponentAvailable: isFullscreenAvailable }     = useActionComponentStatus({ actionKey: ThActionsKeys.fullscreen,      orderArray: webPubActionKeys, additionalCondition: isFullscreenSupported });
  const { isComponentAvailable: isTocAvailable }            = useActionComponentStatus({ actionKey: ThActionsKeys.toc,             orderArray: webPubActionKeys });
  const { isComponentAvailable: isSettingsAvailable }       = useActionComponentStatus({ actionKey: ThActionsKeys.settings,        orderArray: webPubActionKeys });
  const { isComponentAvailable: isJumpToPositionAvailable } = useActionComponentStatus({ actionKey: ThActionsKeys.jumpToPosition,  orderArray: webPubActionKeys });

  return useMemo(() => {
    const actionAvailability: Record<string, boolean> = {
      [ThActionsKeys.fullscreen]:      isFullscreenAvailable,
      [ThActionsKeys.toc]:             isTocAvailable,
      [ThActionsKeys.settings]:        isSettingsAvailable,
      [ThActionsKeys.jumpToPosition]:  isJumpToPositionAvailable,
    };

    const config: IKeyboardPeripheralsConfig = [
      { type: NavPeripheralType.zoomIn,  keyCombos: [...ZOOM_IN_KEY_COMBOS]  },
      { type: NavPeripheralType.zoomOut, keyCombos: [...ZOOM_OUT_KEY_COMBOS] },
    ];

    for (const [key, tokens] of Object.entries(actionsKeys)) {
      const shortcut = tokens?.shortcut;
      const isAvailable = actionAvailability[key] ?? true;
      if (shortcut && isAvailable) config.push({ type: toActionPeripheralType(key), keyCombos: shortcut.keyCombos });
    }

    return config;
  }, [actionsKeys, isFullscreenAvailable, isTocAvailable, isSettingsAvailable, isJumpToPositionAvailable]);
};
