"use client";

import React from "react";

import overflowMenuStyles from "../assets/styles/thorium-web.overflow.module.css";

import { Text } from "react-aria-components";
import { StatefulShortcut } from "./StatefulShortcut";

import { ThMenuItem, ThMenuItemProps } from "@/core/Components/Menu/ThMenuItem";
import type { ThShortcutConfig } from "@/preferences/models/actions";

export interface StatefulOverflowMenuItemProps extends Omit<ThMenuItemProps, "shortcut"> {
  shortcut?: ThShortcutConfig | null
}

export const StatefulOverflowMenuItem = ({
  id,
  label,
  SVGIcon,
  shortcut = undefined,
  ...props
}: StatefulOverflowMenuItemProps) => {
  const menuItemLabelId = `${id}-label`;
  
  return(
    <>
    <ThMenuItem 
      id={ id } 
      label={ label }
      className={ overflowMenuStyles.menuItem } 
      aria-labelledby={ menuItemLabelId } 
      { ...props }
    >
      { SVGIcon && <SVGIcon aria-hidden="true" focusable="false" /> }
      <Text 
        className={ overflowMenuStyles.menuItemLabel } 
        slot="label"
        id={ menuItemLabelId }
      >
        { label }
      </Text>
      { shortcut && <StatefulShortcut
        className={ overflowMenuStyles.menuItemShortcut }
        combo={ shortcut }
      /> }
    </ThMenuItem>
    </>
  )
}
