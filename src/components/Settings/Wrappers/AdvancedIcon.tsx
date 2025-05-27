import React, { useRef } from "react";

import { RSPrefs } from "@/preferences";

import { IAdvancedIconProps } from "@/models/settings";

import readerSharedUI from "../../assets/styles/readerSharedUI.module.css";

import SettingIcon from "../../assets/icons/settings.svg";

import { Button, Tooltip, TooltipTrigger, ButtonProps } from "react-aria-components";

import { isActiveElement } from "@/helpers/focus";

import classNames from "classnames";

export const AdvancedIcon: React.FC<Pick<ButtonProps, "preventFocusOnPress"> & IAdvancedIconProps> = ({
  className,
  ariaLabel, 
  placement,
  tooltipLabel,
  onPressCallback,
  isDisabled,
  ...props
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const blurOnEsc = (event: React.KeyboardEvent) => {
  // TODO: handle Tooltip cos first time you press esc, it’s the tooltip that is closed.
    if (triggerRef.current && isActiveElement(triggerRef.current) && event.code === "Escape") {
      triggerRef.current.blur();
    }
  };
  
  return (
    <>
    <TooltipTrigger
      { ...(RSPrefs.theming.icon.tooltipDelay 
        ? { 
            delay: RSPrefs.theming.icon.tooltipDelay,
            closeDelay: RSPrefs.theming.icon.tooltipDelay
          } 
        : {}
      )}
    >
      <Button 
        ref={ triggerRef }
        className={ classNames(readerSharedUI.icon, className) } 
        aria-label={ ariaLabel } 
        onPress={ onPressCallback }
        onKeyDown={ blurOnEsc } 
        isDisabled={ isDisabled }
        { ...props }
      >
        <SettingIcon aria-hidden="true" focusable="false" />  
      </Button>
      <Tooltip
        className={ readerSharedUI.tooltip }
        placement={ placement } 
        offset={ RSPrefs.theming.icon.tooltipOffset || 0 }
      >
        { tooltipLabel }
      </Tooltip>
    </TooltipTrigger>
    </>
  )
};