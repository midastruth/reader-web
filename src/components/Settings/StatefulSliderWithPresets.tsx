"use client";

import readerSharedUI from "../assets/styles/thorium-web.button.module.css";
import settingsStyles from "./assets/styles/thorium-web.reader.settings.module.css";

import { ThSliderWithPresets, ThSliderWithPresetsProps } from "@/core/Components/Settings/ThSliderWithPresets";

import { usePreferences } from "@/preferences/hooks/usePreferences";
import { useI18n } from "@/i18n/useI18n";

import classNames from "classnames";

export interface StatefulSliderWithPresetsProps extends Omit<ThSliderWithPresetsProps, "compounds"> {
  standalone?: boolean;
  placeholder?: string;
  resetLabel?: string;
  displayTicks?: boolean;
  hideOutput?: boolean;
}

export const StatefulSliderWithPresets = ({
  standalone,
  label,
  placeholder,
  displayTicks = false,
  hideOutput = false,
  value,
  resetLabel,
  presets,
  formatValue,
  ...props
}: StatefulSliderWithPresetsProps) => {
  const { t } = useI18n();
  const { preferences } = usePreferences();

  const style = {
    ...(displayTicks && props.range && props.step ? {
      "--th-slider-ticks": (() => {
        const [min, max] = [Math.min(...props.range), Math.max(...props.range)];
        const step = props.step || 1;
        const range = max - min;
        const totalIntervals = range / step;
        return Math.ceil(totalIntervals);
      })()
    } : {}),
    ...props.style
  };

  return (
    <ThSliderWithPresets
      presets={ presets }
      formatValue={ formatValue }
      value={ value }
      { ...props }
      { ...(standalone ? { label: label } : { "aria-label": label }) }
      placeholder={ placeholder }
      className={ classNames(
        settingsStyles.slider,
        displayTicks && settingsStyles.sliderWithTicks
      ) }
      style={ style }
      compounds={{
        wrapper: {
          className: classNames(
            settingsStyles.sliderWithPresetsWrapper,
            standalone && settingsStyles.group
          )
        },
        slider: {
          wrapper: {
            className: settingsStyles.sliderWrapper
          },
          label: {
            className: classNames(settingsStyles.label, settingsStyles.sliderLabel)
          },
          output: {
            className: settingsStyles.sliderOutput,
            ...(hideOutput && { style: { display: "none" } })
          },
          placeholder: {
            className: settingsStyles.sliderPlaceholder
          },
          track: {
            className: settingsStyles.sliderTrack
          },
          thumb: {
            className: settingsStyles.sliderThumb
          },
          reset: {
            className: classNames(readerSharedUI.icon, settingsStyles.resetButton),
            compounds: {
              tooltipTrigger: {
                delay: preferences.theming.arrow.tooltipDelay,
                closeDelay: preferences.theming.arrow.tooltipDelay
              },
              tooltip: {
                className: readerSharedUI.tooltip
              },
              label: resetLabel ?? t("common.actions.reset")
            }
          }
        },
        presetsList: {
          className: settingsStyles.sliderWithPresetsPresets
        },
        preset: {
          className: settingsStyles.sliderWithPresetsPreset
        }
      }}
    />
  );
};
