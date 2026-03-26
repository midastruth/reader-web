"use client";

import { useCallback } from "react";

import { ThSettingsRangeVariant } from "@/preferences";

import { ThAudioKeys } from "@/preferences/models";

import { StatefulNumberField } from "../../Settings/StatefulNumberField";
import { StatefulSlider } from "../../Settings/StatefulSlider";

import { useNavigator } from "@/core/Navigator/hooks";
import { usePlaceholder } from "../../Settings/hooks/usePlaceholder";
import { usePreferences } from "@/preferences/hooks/usePreferences";
import { useI18n } from "@/i18n/useI18n";

import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { setSkipInterval } from "@/lib/audioSettingsReducer";
import { defaultAudioSkipInterval } from "@/preferences/models/audio";

export interface StatefulAudioSkipIntervalProps {
  standalone?: boolean;
}

export const StatefulAudioSkipInterval = ({
  standalone = true
}: StatefulAudioSkipIntervalProps) => {
  const { t } = useI18n();
  const { preferences } = usePreferences();

  const skipInterval = useAppSelector(state => state.audioSettings.skipInterval);
  const dispatch = useAppDispatch();

  const { submitPreferences, getSetting } = useNavigator().media;

  const config = preferences.audio.keys[ThAudioKeys.skipInterval] ?? defaultAudioSkipInterval;

  const skipIntervalRangeConfig = {
    variant: config.variant,
    placeholder: config.placeholder,
    range: config.range,
    step: config.step
  };

  const placeholderText = usePlaceholder(skipIntervalRangeConfig.placeholder, skipIntervalRangeConfig.range);

  const updatePreference = useCallback(async (value: number | number[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    await submitPreferences({
      skipForwardInterval: val,
      skipBackwardInterval: val
    });
    dispatch(setSkipInterval(getSetting("skipForwardInterval")));
  }, [submitPreferences, getSetting, dispatch]);

  return (
    <>
    { skipIntervalRangeConfig.variant === ThSettingsRangeVariant.numberField
      ? <StatefulNumberField
        standalone={ standalone }
        label={ t("reader.playback.preferences.audio.skipInterval") }
        placeholder={ placeholderText }
        defaultValue={ undefined }
        value={ skipInterval }
        onChange={ updatePreference }
        onReset={ undefined }
        range={ skipIntervalRangeConfig.range || [1, 60] }
        step={ skipIntervalRangeConfig.step }
        steppers={{
          decrementLabel: t("common.actions.decrease"),
          incrementLabel: t("common.actions.increase")
        }}
        formatOptions={{ style: "unit", unit: "second" }}
        isWheelDisabled={ true }
        isVirtualKeyboardDisabled={ true }
      />
      : <StatefulSlider
        standalone={ standalone }
        displayTicks={ skipIntervalRangeConfig.variant === ThSettingsRangeVariant.incrementedSlider }
        label={ t("reader.playback.preferences.audio.skipInterval") }
        placeholder={ placeholderText }
        value={ skipInterval }
        onChange={ updatePreference }
        range={ skipIntervalRangeConfig.range }
        step={ skipIntervalRangeConfig.step }
        formatOptions={{ style: "unit", unit: "second" }}
      />
    }
    </>
  );
};
