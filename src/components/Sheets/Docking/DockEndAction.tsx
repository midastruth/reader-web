import { useCallback } from "react";

import { RSPrefs } from "@/preferences";
import Locale from "../../../resources/locales/en.json";

import readerSharedUI from "../../assets/styles/readerSharedUI.module.css";

import { ActionComponentVariant, IActionComponentTrigger } from "@/models/actions";
import { DockingKeys } from "@/models/docking";
import { LayoutDirection } from "@/models/layout";

import DockToLeft from "../../assets/icons/dock_to_right.svg";
import DocktoRight from "../../assets/icons/dock_to_left.svg";

import { ActionIcon } from "@/components/ActionTriggers/ActionIcon";
import { OverflowMenuItem } from "@/components/ActionTriggers/OverflowMenuItem";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { dockAction } from "@/lib/actionsReducer";
import { useActions } from "@/hooks/useActions";

export const DockEndAction: React.FC<IActionComponentTrigger> = ({ variant, associatedKey }) => {
  const direction = useAppSelector(state => state.reader.direction);
  const isRTL = direction === LayoutDirection.rtl;
  const localeKey = isRTL ? Locale.reader.app.docker.dockToLeft : Locale.reader.app.docker.dockToRight;

  const actions = useActions();
  const isDisabled = actions.whichDocked(associatedKey) === DockingKeys.end;

  const dispatch = useAppDispatch();
  
  const handlePress = useCallback(() => {
    if (associatedKey) {
      dispatch(dockAction({
        key: associatedKey,
        dockingKey: DockingKeys.end
      }))
    }
  }, [dispatch, associatedKey]);
  
  return(
    <>
    { (variant && variant === ActionComponentVariant.menu) 
      ? <OverflowMenuItem 
          label={ localeKey.trigger }
          SVG={ isRTL ? DockToLeft : DocktoRight } 
          shortcut={ RSPrefs.docking.keys[DockingKeys.end].shortcut }
          onActionCallback={ handlePress } 
          id={ `${ DockingKeys.end }-${ associatedKey }` }
          isDisabled={ isDisabled }
        />
      : <ActionIcon 
          className={ readerSharedUI.dockerButton }  
          ariaLabel={ localeKey.trigger }
          SVG={ isRTL ? DockToLeft : DocktoRight } 
          placement="bottom" 
          tooltipLabel={ localeKey.tooltip } 
          onPressCallback={ handlePress } 
          isDisabled={ isDisabled }
        />
    }
    </>
  )
}