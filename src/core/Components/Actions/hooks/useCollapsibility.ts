"use client";

import { useMemo } from "react";

import { ThActionEntry } from "../ThActionsBar";

export type ThCollapsibility = boolean | Record<string, number | "all">;

export enum ThCollapsibilityVisibility {
  always = "always",
  partially = "partially",
  overflow = "overflow"
}

export interface CollapsiblePref {
  displayOrder: string[];
  collapse: ThCollapsibility;
  keys: {
    [key: string]: {
      [key: string]: any;
      visibility: ThCollapsibilityVisibility;
    };
  }
}

export const useCollapsibility = (items: ThActionEntry<string>[], prefs: CollapsiblePref, breakpoint?: string) => {
  const [actionIcons, menuItems] = useMemo(() => {
    const actionIcons: ThActionEntry<string>[] = [];
    const menuItems: ThActionEntry<string>[] = [];

    let countdown: number = 0;

    if (prefs.collapse) {
      // Handling number of items to collapse
      if (typeof prefs.collapse === "object" && !(prefs.collapse instanceof Boolean)) {
        if (breakpoint) {
          const prefForBreakpoint = prefs.collapse[breakpoint];
          if (prefForBreakpoint) {
            if (prefForBreakpoint === "all") {
              countdown = 0;
            } else if (!isNaN(prefForBreakpoint)) {
              if (prefForBreakpoint === items.length) {
                countdown = 0;
              } else if (prefForBreakpoint < items.length) {
                // We must take the overflow icon into account so that
                // it doesn’t contain only one partially visible item 
                countdown = items.length - (prefForBreakpoint - 1);
              }
            }
          }
        }
      }

      // Creating a shallow copy so that actionsOrder doesn’t mutate between rerenders
      [...items].reverse().forEach((item) => {
        const actionPref = prefs.keys[item.key];
        if (actionPref.visibility === ThCollapsibilityVisibility.overflow) {
          menuItems.unshift(item);
          --countdown;
        } else if (actionPref.visibility === ThCollapsibilityVisibility.partially) {
          if (countdown > 0) {
            menuItems.unshift(item);
            --countdown;
          } else {
            actionIcons.unshift(item);
          }
        } else {
          actionIcons.unshift(item);
        }
      });
    } else {
      // collapse set to false so we ignore visibility and don’t triage
      items.forEach((item) => {
        actionIcons.push(item);
      });
    }

    return [actionIcons, menuItems];
  }, [items, prefs, breakpoint]);

  return { ActionIcons: actionIcons, MenuItems: menuItems };
}