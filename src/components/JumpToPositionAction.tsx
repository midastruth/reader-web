import React from "react";

import { RSPrefs } from "@/preferences";
import Locale from "../resources/locales/en.json";

import { ActionComponentVariant, ActionKeys, IActionComponentTrigger } from "@/models/actions";

import TargetIcon from "./assets/icons/point_scan.svg";

import { ActionIcon } from "./ActionTriggers/ActionIcon";
import { OverflowMenuItem } from "./ActionTriggers/OverflowMenuItem";

export const JumpToPositionAction: React.FC<IActionComponentTrigger> = ({ variant }) => {
  return(
    <>
    { (variant && variant === ActionComponentVariant.menu) 
      ? <OverflowMenuItem 
          label={ Locale.reader.jumpToPosition.trigger }
          SVG={ TargetIcon }
          shortcut={ RSPrefs.actions.keys[ActionKeys.jumpToPosition].shortcut }
          id={ ActionKeys.jumpToPosition }
          onActionCallback={ () => {} }
        />
      : <ActionIcon
          visibility={ RSPrefs.actions.keys[ActionKeys.jumpToPosition].visibility } 
          ariaLabel={ Locale.reader.jumpToPosition.trigger }
          SVG={ TargetIcon } 
          placement="bottom" 
          tooltipLabel={ Locale.reader.jumpToPosition.tooltip }
          onPressCallback={ () => {} }
        />
    }
    </>
  )
}