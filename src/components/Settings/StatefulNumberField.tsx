"use client";

import readerSharedUI from "../assets/styles/thorium-web.button.module.css";
import settingsStyles from "./assets/styles/thorium-web.reader.settings.module.css";

import { ThNumberField, ThNumberFieldProps } from "@/core/Components/Settings/ThNumberField";

import { usePreferences } from "@/preferences/hooks/usePreferences";
import { useI18n } from "@/i18n/useI18n";

import classNames from "classnames";

export interface StatefulNumberFieldProps extends Omit<ThNumberFieldProps, "classNames"> {
  standalone?: boolean;
  resetLabel?: string;
  placeholder?: string;
}

export const StatefulNumberField = ({
  standalone,
  label,
  placeholder,
  value,
  resetLabel,
  ...props
}: StatefulNumberFieldProps) => {
  const { t } = useI18n();
  const { preferences } = usePreferences();

  return (
    <>
    <ThNumberField
      value={ value }
      { ...props }
      { ...(standalone ? { label: label } : { "aria-label": label }) }
      placeholder={ placeholder }
      className={ settingsStyles.readerSettingsNumberField }
      compounds={{
        wrapper: {
          className: classNames(
            settingsStyles.readerSettingsNumberFieldWrapper,
            standalone && settingsStyles.readerSettingsGroup
          )
        },
        group: {
          className: settingsStyles.readerSettingsGroupWrapper
        },
        label: {
          className: settingsStyles.readerSettingsLabel
        },
        stepper: {
          className: readerSharedUI.icon
        },
        input: {
          className: settingsStyles.readerSettingsInput,
        },
        reset: {
          className: classNames(readerSharedUI.icon, settingsStyles.readerSettingsResetButton),
          compounds: {
            tooltipTrigger: {
              delay: preferences.theming.arrow.tooltipDelay,
              closeDelay: preferences.theming.arrow.tooltipDelay
            },
            tooltip: {
              className: readerSharedUI.tooltip
            },
            label: resetLabel ?? t("reader.settings.reset")
          }
        }
      }}
      />
    </>
  );
};