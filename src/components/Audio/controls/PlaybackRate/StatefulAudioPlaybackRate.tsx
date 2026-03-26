"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useFirstFocusable } from "@/core/Components/Containers/hooks/useFirstFocusable";

import { Dialog, ListBox, ListBoxItem, Popover, Select } from "react-aria-components";

import SpeedIcon from "../assets/icons/speed.svg";

import { ThAudioKeys, ThSettingsRangeVariant } from "@/preferences/models";
import { StatefulActionIcon } from "../../../Actions/Triggers/StatefulActionIcon";
import { StatefulSliderWithPresets } from "../../../Settings/StatefulSliderWithPresets";

import audioStyles from "../assets/styles/thorium-web.audioControls.module.css";

import { useNavigator } from "@/core/Navigator/hooks";
import { usePreferences } from "@/preferences/hooks/usePreferences";
import { useI18n } from "@/i18n/useI18n";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setPlaybackRate } from "@/lib/audioSettingsReducer";

export const StatefulAudioPlaybackRate = ({ isDisabled }: { isDisabled: boolean }) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useFirstFocusable({
    withinRef: contentRef,
    trackedState: isOpen,
    action: { type: "focus" }
  });

  const { t } = useI18n();
  const { preferences } = usePreferences();
  const playbackRate = useAppSelector(state => state.audioSettings.playbackRate);
  const dispatch = useAppDispatch();
  const { submitPreferences, getSetting } = useNavigator().media;

  const config = preferences.audio.keys[ThAudioKeys.playbackRate];

  const values = useMemo(() => {
    const min = Math.min(...config.range);
    const max = Math.max(...config.range);
    const count = Math.round((max - min) / config.step) + 1;
    return Array.from({ length: count }, (_, i) =>
      Math.round((min + i * config.step) * 100) / 100
    );
  }, [config.range, config.step]);

  const updatePreference = useCallback(async (value: number) => {
    await submitPreferences({ playbackRate: value });
    dispatch(setPlaybackRate(getSetting("playbackRate")));
  }, [submitPreferences, getSetting, dispatch]);

  if (config.variant === ThSettingsRangeVariant.sliderWithPresets) {
    return (
      <>
        <StatefulActionIcon
          ref={ triggerRef }
          tooltipLabel={ t("reader.playback.preferences.playbackRate.descriptive") }
          placement="top"
          onPress={ () => setIsOpen(prev => !prev) }
          isDisabled={ isDisabled }
          className={ audioStyles.audioPlaybackRateButton }
        >
          <SpeedIcon aria-hidden="true" focusable="false" />
          <span className={ audioStyles.audioPlaybackRateLabel } aria-hidden="true">{ playbackRate }×</span>
        </StatefulActionIcon>
        <Popover
          triggerRef={ triggerRef }
          isOpen={ isOpen }
          onOpenChange={ setIsOpen }
          placement="top"
          className={ audioStyles.audioControlPopover }
        >
          <Dialog className={ audioStyles.audioControlPopoverDialog }>
            <div ref={ contentRef } className={ audioStyles.audioPlaybackRateSliderContent }>
              <StatefulSliderWithPresets
                aria-label={ t("reader.playback.preferences.playbackRate.descriptive") }
                presets={ config.presets || [] }
                formatValue={ (v) => `${v}×` }
                value={ playbackRate }
                onChange={ (v) => updatePreference(Array.isArray(v) ? v[0] : v) }
                range={ config.range }
                step={ config.step }
              />
            </div>
          </Dialog>
        </Popover>
      </>
    );
  }

  return (
    <Select
      aria-label={ t("reader.playback.preferences.playbackRate.descriptive") }
      isDisabled={ isDisabled }
      selectedKey={ String(playbackRate) }
      onSelectionChange={ (key) => updatePreference(Number(key)) }
    >
      <StatefulActionIcon
        tooltipLabel={ t("reader.playback.preferences.playbackRate.descriptive") }
        placement="top"
        className={ audioStyles.audioPlaybackRateButton }
      >
        <SpeedIcon aria-hidden="true" focusable="false" />
        <span className={ audioStyles.audioPlaybackRateLabel } aria-hidden="true">{ playbackRate }×</span>
      </StatefulActionIcon>
      <Popover
        placement="top"
        className={ audioStyles.audioControlPopover }
      >
        <ListBox
          className={ audioStyles.audioPlaybackRateListbox }
        >
          { values.map((v) => (
            <ListBoxItem
              key={ String(v) }
              id={ String(v) }
              className={ audioStyles.audioPlaybackRateListboxItem }
            >
              { v }×
            </ListBoxItem>
          )) }
        </ListBox>
      </Popover>
    </Select>
  );
};
