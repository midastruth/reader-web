import { RSPrefs } from "@/preferences";
import Locale from "../resources/locales/en.json";

import { ICloseButton } from "@/models/actions";

import readerSharedUI from "./assets/styles/readerSharedUI.module.css";

import Close from "./assets/icons/close.svg";

import { Button, Tooltip, TooltipTrigger } from "react-aria-components";

export const CloseButton = ({
  ref,
  className,
  label,
  onPressCallback,
  withTooltip
}: ICloseButton) => {
  
  if (withTooltip) {
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
          ref={ ref }
          className={ className || readerSharedUI.closeButton } 
          aria-label={ label || Locale.reader.app.docker.close.trigger } 
          onPress={ onPressCallback }
        >
          <Close aria-hidden="true" focusable="false" />  
        </Button>
        <Tooltip
          className={ readerSharedUI.tooltip }
          placement="bottom" 
          offset={ RSPrefs.theming.icon.tooltipOffset || 0 }
        >
          { withTooltip }
        </Tooltip>
      </TooltipTrigger>
      </>
    )
  } else {
    return (
      <>
      <Button 
        ref={ ref }
        className={ className || readerSharedUI.closeButton } 
        aria-label={ label || Locale.reader.app.docker.close.trigger } 
        onPress={ onPressCallback }
      >
        <Close aria-hidden="true" focusable="false" />
      </Button>
      </>
    )
  }
}