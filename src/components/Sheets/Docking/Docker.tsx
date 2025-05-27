import React, { useCallback } from "react";

import { RSPrefs } from "@/preferences";
import Locale from "../../../resources/locales/en.json";

import dockerStyles from "../../assets/styles/docking.module.css";
import readerSharedUI from "../../assets/styles/readerSharedUI.module.css";

import { DockingKeys, IDocker } from "@/models/docking";
import { IActionsItem, IActionsMapObject } from "@/models/actions";

import { Toolbar } from "react-aria-components";

import { CloseButton } from "../../CloseButton";
import { ActionsWithCollapsibility } from "@/components/ActionsWithCollapsibility";
import { DockStartAction } from "./DockStartAction";
import { DockEndAction } from "./DockEndAction";
import { PopoverSheetAction } from "./PopoverSheetAction";

const DockingActionsMap: { [key in DockingKeys]: IActionsMapObject } = {
  [DockingKeys.start]: {
    trigger: DockStartAction
  },
  [DockingKeys.end]: {
    trigger: DockEndAction
  },
  [DockingKeys.transient]: {
    trigger: PopoverSheetAction
  }
};

export const Docker = ({
  id,
  keys,
  ref,
  onCloseCallback
}: IDocker) => {

  const listActionItems = useCallback(() => {
    const actionsItems: IActionsItem[] = [];

    keys.map((key) => {
      actionsItems.push({
        Trigger: DockingActionsMap[key].trigger,
        key: key,
        associatedKey: id
      })
    });

    return actionsItems;
  }, [keys, id]);

  return(
    <>
    <Toolbar className={ dockerStyles.dockerWrapper }>
      <ActionsWithCollapsibility 
        id={ `${ id }-docker-overflowMenu` }
        items={ listActionItems() }
        className={ dockerStyles.docker } 
        overflowMenuClassName={ readerSharedUI.dockerButton }
        prefs={ RSPrefs.docking }
        label={ Locale.reader.app.docker.wrapper }
      />

      <CloseButton 
        ref={ ref }
        className={ readerSharedUI.dockerButton } 
        label={ Locale.reader.app.docker.close.trigger } 
        onPressCallback={ onCloseCallback }
        withTooltip={ Locale.reader.app.docker.close.tooltip }
      />
    </Toolbar>
    </>
  )
}

