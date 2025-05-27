import React from "react";

import { IOverflowMenuItemProp } from "@/models/actions";

import overflowMenuStyles from "../assets/styles/overflowMenu.module.css";

import { MenuItem, Text } from "react-aria-components";
import { Shortcut } from "../Shortcut";

export const OverflowMenuItem: React.FC<IOverflowMenuItemProp> = ({
  label,
  SVG, 
  shortcut,
  onActionCallback, 
  id,
  isDisabled
}) => {
  const menuItemLabelId = `${id}-label`;
  
  return(
    <>
    <MenuItem 
      id={ id } 
      className={ overflowMenuStyles.menuItem } 
      aria-labelledby={ menuItemLabelId } 
      onAction={ onActionCallback }
      isDisabled={ isDisabled }
    >
      <SVG aria-hidden="true" focusable="false" />
      <Text 
        className={ overflowMenuStyles.menuItemLabel } 
        slot="label"
        id={ menuItemLabelId }
      >
        { label }
      </Text>
      { shortcut && <Shortcut
        className={ overflowMenuStyles.menuItemKbdShortcut } 
        rawForm={ shortcut } 
      /> }
    </MenuItem>
    </>
  )
}