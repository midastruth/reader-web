"use client";

import React from "react";

import settingsStyles from "./assets/styles/thorium-web.reader.settings.module.css";

import { ThDropdown, ThDropdownProps } from "@/core/Components/Settings/ThDropdown/ThDropdown";

import classNames from "classnames";

export interface StatefulDropdownProps extends Omit<ThDropdownProps, "classNames"> {
  standalone?: boolean;
}

export const StatefulDropdown = ({
  standalone,
  label,
  className,
  compounds,
  ...props
}: StatefulDropdownProps) => {

  return (
    <ThDropdown
      { ...props }
      { ...(standalone ? { label } : { "aria-label": label }) }
      className={ classNames(
        settingsStyles.readerSettingsDropdown,
        standalone && settingsStyles.readerSettingsGroup,
        className
      ) }
        compounds={{
          label: {
            className: settingsStyles.readerSettingsLabel,
            ...(compounds?.label || {})
          },
          ...(React.isValidElement(compounds?.button) 
            ? { button: compounds.button }
            : {
                button: {
                  className: settingsStyles.readerSettingsDropdownButton,
                  ...(compounds?.button || {})
                }
              }),
          popover: {
            className: settingsStyles.readerSettingsDropdownPopover,
            placement: "bottom",
            ...(compounds?.popover || {})
          },
          ...(React.isValidElement(compounds?.listbox) 
            ? { listbox: compounds.listbox }
            : {
                listbox: {
                  className: settingsStyles.readerSettingsDropdownListbox,
                  ...(compounds?.listbox || {})
                },
                listboxItem: {
                  className: settingsStyles.readerSettingsDropdownListboxItem,
                  ...(compounds?.listboxItem || {})
                }
              })
        }}
      />
  );
};
