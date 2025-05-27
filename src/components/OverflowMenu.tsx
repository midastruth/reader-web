import React, { useRef } from "react";

import Locale from "../resources/locales/en.json";

import { ActionComponentVariant, ActionVisibility, IOverflowMenu } from "@/models/actions";

import overflowMenuStyles from "./assets/styles/overflowMenu.module.css";

import MenuIcon from "./assets/icons/more_vert.svg";

import { Menu, MenuTrigger, Popover } from "react-aria-components";
import { ActionIcon } from "./ActionTriggers/ActionIcon";

import { useAppDispatch } from "@/lib/hooks";
import { toggleImmersive } from "@/lib/readerReducer";
import { setOverflow } from "@/lib/actionsReducer";

export const OverflowMenu = ({ 
  id,
  className, 
  actionFallback,
  display,
  actionItems,
  triggerRef
}: IOverflowMenu) => {
  const dispatch = useAppDispatch();

  const toggleMenuState = (value: boolean) => {
    dispatch(setOverflow({
      key: id,
      isOpen: value
    }));
  }

  if (actionItems.length > 0 && (display)) {
    return (
      <>
      <MenuTrigger onOpenChange={ (val) => toggleMenuState(val) }>
        <ActionIcon 
          className={ className ? className : overflowMenuStyles.activeButton }
          ariaLabel={ Locale.reader.overflowMenu.active.trigger }
          SVG={ MenuIcon } 
          placement="bottom"
          tooltipLabel={ Locale.reader.overflowMenu.active.tooltip } 
          visibility={ ActionVisibility.always }
        />
        <Popover
          placement="bottom"
          className={ overflowMenuStyles.overflowPopover }
        >
          <Menu 
            id={ id }
            selectionMode="none" 
            className={ overflowMenuStyles.overflowMenu }
            dependencies={ ["Trigger"] }
          >
            { actionItems.map(({ Trigger, key, associatedKey, ...props }) => 
              <Trigger 
                key={ `${ key }-menuItem` } 
                variant={ ActionComponentVariant.menu }
                { ...(associatedKey ? { associatedKey: associatedKey } : {}) } 
                { ...props }
              />
            )}
          </Menu>
        </Popover>
      </MenuTrigger>
      { actionItems.map(({ Container, key }) => 
        Container && <Container key={ `${ key }-container` } triggerRef={ triggerRef } />
      )}
      </>
    )
  } else {
    if (actionFallback) {
      return(
        <>
        <ActionIcon 
          className={ className ? className : overflowMenuStyles.hintButton } 
          ariaLabel={ Locale.reader.overflowMenu.hint.trigger }
          SVG={ MenuIcon } 
          placement="bottom"
          tooltipLabel={ Locale.reader.overflowMenu.hint.tooltip } 
          visibility={ ActionVisibility.always }
          onPressCallback={ () => { dispatch(toggleImmersive()) } }
          preventFocusOnPress={ true }
        />
      </>
      )
    } else {
      return(<></>)
    }
  }
}