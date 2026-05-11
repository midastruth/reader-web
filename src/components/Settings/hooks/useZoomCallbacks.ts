import { useCallback } from "react";

import { ThSettingsKeys } from "@/preferences/models";
import { usePreferences } from "@/preferences/hooks/usePreferences";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setFontSize } from "@/lib/settingsReducer";
import { setWebPubZoom } from "@/lib/webPubSettingsReducer";
import { useEffectiveRange } from "./useEffectiveRange";
import { EpubPreferencesEditor, WebPubPreferencesEditor } from "@readium/navigator";

type ZoomNavigator = {
  getSetting: (key: any) => number | null | undefined;
  submitPreferences: (prefs: any) => Promise<void>;
  preferencesEditor?: any;
};

export const useZoomCallbacks = (navigator: ZoomNavigator) => {
  const { getSetting, submitPreferences, preferencesEditor } = navigator;
  const { preferences } = usePreferences();
  const readerProfile = useAppSelector(state => state.reader.profile);
  const isFXL = useAppSelector(state => state.publication.isFXL);
  const dispatch = useAppDispatch();

  const isWebPub = readerProfile === "webPub";

  const supportedRange = isWebPub
    ? (preferencesEditor as WebPubPreferencesEditor)?.zoom?.supportedRange
    : isFXL
      ? (preferencesEditor as any)?.zoom?.supportedRange
      : (preferencesEditor as EpubPreferencesEditor)?.fontSize?.supportedRange;

  const zoomConfig = preferences.settings.keys[ThSettingsKeys.zoom];
  const { range } = useEffectiveRange(zoomConfig.range, supportedRange);
  const [min, max] = range;
  const step = zoomConfig.step ?? 0.05;

  const zoomIn = useCallback(async () => {
    if (isWebPub) {
      const next = Math.min(max, (getSetting("zoom") ?? 1) + step);
      await submitPreferences({ zoom: next });
      dispatch(setWebPubZoom(getSetting("zoom")));
    } else {
      const next = Math.min(max, (getSetting("fontSize") ?? 1) + step);
      await submitPreferences({ fontSize: next });
      dispatch(setFontSize(getSetting("fontSize")));
    }
  }, [isWebPub, getSetting, max, step, submitPreferences, dispatch]);

  const zoomOut = useCallback(async () => {
    if (isWebPub) {
      const next = Math.max(min, (getSetting("zoom") ?? 1) - step);
      await submitPreferences({ zoom: next });
      dispatch(setWebPubZoom(getSetting("zoom")));
    } else {
      const next = Math.max(min, (getSetting("fontSize") ?? 1) - step);
      await submitPreferences({ fontSize: next });
      dispatch(setFontSize(getSetting("fontSize")));
    }
  }, [isWebPub, getSetting, min, step, submitPreferences, dispatch]);

  return { zoomIn, zoomOut };
};
