import { useCallback, useEffect, useState } from "react";

import { ActionVisibility, IActionPref, IActionsItem } from "@/models/actions";
import { IDockingPref } from "@/models/docking";

import { useAppSelector } from "@/lib/hooks";

export const useCollapsibility = (items: IActionsItem[], prefs: IActionPref & IDockingPref) => {
  const [ActionIcons, setActionIcons] = useState<IActionsItem[]>([]);
  const [MenuItems, setMenuItems] = useState<IActionsItem[]>([]);
  const staticBreakpoint = useAppSelector(state => state.theming.staticBreakpoint);

  const triageActions = useCallback(() => {
    const actionIcons: IActionsItem[] = [];
    const menuItems: IActionsItem[] = [];

    let countdown: number = 0;

    if (prefs.collapse) {
      // Handling number of items to collapse
      if (typeof prefs.collapse === "object" && !(prefs.collapse instanceof Boolean)) {
        if (staticBreakpoint) {
          const prefForBreakpoint = prefs.collapse[staticBreakpoint];
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
      [...items].slice().reverse().map((item) => {
        const actionPref = prefs.keys[item.key];
        if (actionPref.visibility === ActionVisibility.overflow) {
          menuItems.unshift(item);
          --countdown;
        } else if (actionPref.visibility === ActionVisibility.partially) {
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
      items.map((item) => {
        actionIcons.push(item);
      });
    }

    setActionIcons(actionIcons);
    setMenuItems(menuItems);
  }, [items, prefs, staticBreakpoint]);

  useEffect(() => {
    triageActions();
  }, [staticBreakpoint, triageActions, items, prefs]);

  return {
    ActionIcons,
    MenuItems
  }
}