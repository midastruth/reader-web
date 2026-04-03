"use client";

import { useCallback } from "react";

import { Dialog, Popover } from "react-aria-components";

import { ThAudioKeys, ThAudioActionKeys } from "@/preferences/models";
import { ThSlider } from "@/core/Components/Settings/ThSlider";
import { useFirstFocusable } from "@/core/Components/Containers/hooks/useFirstFocusable";
import { StatefulActionContainerProps } from "../../../Actions/models/actions";

import audioStyles from "../assets/styles/thorium-web.audioActions.module.css";

import { useNavigator } from "@/core/Navigator";
import { useAudioPreferences } from "@/preferences/hooks/useAudioPreferences";
import { useI18n } from "@/i18n/useI18n";
import { useEffectiveRange } from "../../../Settings/hooks/useEffectiveRange";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setVolume } from "@/lib/audioSettingsReducer";
import { setActionOpen } from "@/lib/actionsReducer";
import { useRef } from "react";

export const StatefulAudioVolumeContainer = ({ triggerRef }: StatefulActionContainerProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const volume = useAppSelector(state => state.audioSettings.volume);
  const isOpen = useAppSelector(state => state.actions.keys[ThAudioActionKeys.volume]?.isOpen ?? false);

  const { t } = useI18n();
  const { preferences } = useAudioPreferences();

  const dispatch = useAppDispatch();
  const { submitPreferences, getSetting, preferencesEditor } = useNavigator().media;

  const config = preferences.settings.keys[ThAudioKeys.volume];
  const { range } = useEffectiveRange(config.range, preferencesEditor?.volume?.supportedRange);

  const updatePreference = useCallback(async (value: number | number[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    await submitPreferences({ volume: val });
    const effectiveVolume = getSetting("volume");
    dispatch(setVolume(effectiveVolume));
  }, [submitPreferences, getSetting, dispatch]);

  useFirstFocusable({
    withinRef: contentRef,
    trackedState: isOpen,
    action: { type: "focus" }
  });

  return (
    <Popover
      triggerRef={ triggerRef }
      isOpen={ isOpen }
      onOpenChange={ (open) => dispatch(setActionOpen({ key: ThAudioActionKeys.volume, isOpen: open })) }
      placement="top"
      className={ audioStyles.audioControlPopover }
    >
      <Dialog aria-label={ t("reader.playback.preferences.audio.volume") } className={ audioStyles.audioControlPopoverDialog }>
        <ThSlider
          aria-label={ t("reader.playback.preferences.audio.volume") }
          className={ audioStyles.audioVolumeSlider }
          orientation="vertical"
          range={ range }
          step={ config.step }
          value={ volume }
          onChange={ updatePreference }
          compounds={ {
            wrapper: { ref: contentRef },
            track: { className: audioStyles.audioVolumeSliderTrack },
            thumb: { className: audioStyles.audioVolumeSliderThumb },
            output: { style: () => ({ display: "none" }) }
          } }
        />
      </Dialog>
    </Popover>
  );
};
