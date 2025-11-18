"use client";

import settingsStyles from "./assets/styles/thorium-web.reader.settings.module.css";

import { ThSwitch, ThSwitchProps } from "@/core/Components/Settings/ThSwitch";

export interface StatefulSwitchProps extends Omit<ThSwitchProps, "classNames"> {
  standalone?: boolean;
}

export const StatefulSwitch = ({
  standalone,
  label,
  heading, 
  ...props
}: StatefulSwitchProps) => {
  return(
    <>
    <ThSwitch 
      { ...props }
      { ...(standalone ? { heading: heading } : {}) }
      label={ label }
      className={ settingsStyles.readerSettingsSwitch }
      compounds={{
        wrapper: {
          className: settingsStyles.readerSettingsGroup
        },
        heading: {
          className: settingsStyles.readerSettingsLabel
        },
        indicator: {
          className: settingsStyles.readerSettingsSwitchIndicator
        }
      }}
    />
    </>
  )
}