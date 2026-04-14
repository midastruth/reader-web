"use client";

import React, { Fragment } from "react";

const MENU_DEPENDENCIES = ["Trigger"];

import { ThActionEntry, ThActionsBar, ThActionsBarProps, ThActionsTriggerVariant } from "./ThActionsBar";
import { ThMenu, THMenuProps } from "../Menu/ThMenu";

import { useObjectRef } from "react-aria";
import { CollapsiblePref, useCollapsibility } from "./hooks/useCollapsibility";

export interface ThCollapsibleActionsBarProps extends ThActionsBarProps {
  id: string;
  items: ThActionEntry<string>[];
  prefs: CollapsiblePref;
  breakpoint?: string;
  targetPlacement?: "top" | "bottom";
  children?: never;
  compounds?: {
    menu: THMenuProps<string> | React.ReactElement<typeof ThMenu>;
  }
}

export const ThCollapsibleActionsBar = ({
  ref,
  id,
  items,
  prefs,
  breakpoint,
  targetPlacement = "bottom",
  compounds,
  ...props
}: ThCollapsibleActionsBarProps) => {
  const resolvedRef = useObjectRef(ref);
  const Actions = useCollapsibility(items, prefs, breakpoint, resolvedRef);

  const isSpaceFit = prefs.collapse === true;

  return (
    <>
    <ThActionsBar
      ref={ resolvedRef }
      { ...props }
    >
      { isSpaceFit && (
        // Hidden measurement clone — always renders all items so widths are stable.
        // Absolutely positioned so it is out of flow; aria-hidden to exclude from AT.
        // getGhostRef observes the wrapper for icon-size changes (e.g. app-level zoom).
        <span ref={ Actions.getGhostRef } aria-hidden="true" style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", display: "flex", gap: "2px" }}>
          { items.map(({ Trigger, key }) =>
            <span key={ key } ref={ Actions.getItemRef(key) }>
              <Trigger variant={ ThActionsTriggerVariant.button } { ...props } />
            </span>
          )}
        </span>
      )}

      { Actions.ActionIcons.map(({ Trigger, Target, key, associatedKey }) =>
          <Fragment key={ key }>
            <Trigger
              key={ `${ key }-trigger` }
              variant={ ThActionsTriggerVariant.button }
              { ...(associatedKey ? { associatedKey: associatedKey } : {}) }
              { ...props }
            />
            { Target && <Target key={ `${ key }-container` } triggerRef={ resolvedRef } placement={ targetPlacement } /> }
          </Fragment>
        )
      }

      { React.isValidElement(compounds?.menu)
        ? (React.cloneElement(compounds.menu, {
          id: id,
          triggerRef: resolvedRef,
          items: Actions.MenuItems,
          dependencies: MENU_DEPENDENCIES,
        } as THMenuProps<string>))
        : (<ThMenu
          id={ id }
          triggerRef={ resolvedRef }
          items={ Actions.MenuItems }
          dependencies={ MENU_DEPENDENCIES }
          { ...compounds?.menu }
        />
      )}
    </ThActionsBar>
    </>
  )
}
