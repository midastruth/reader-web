import { useCallback, useEffect, useState } from "react";

import { RSPrefs } from "@/preferences";

import { DockTypes, BreakpointsDockingMap, DockingKeys } from "@/models/docking";
import { BreakpointsSheetMap, SheetTypes } from "@/models/sheets";
import { ActionsStateKeys } from "@/models/state/actionsState";
import { ActionKeys } from "@/models/actions";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { makeBreakpointsMap } from "@/helpers/breakpointsMap";
import { dockAction, setActionOpen } from "@/lib/actionsReducer";

import { usePrevious } from "./usePrevious";
import { useActions } from "./useActions";

let dockingMap: Required<BreakpointsDockingMap> | null = null;

export const useDocking = (key: ActionsStateKeys) => {
  const staticBreakpoint = useAppSelector(state => state.theming.staticBreakpoint);
  const actionState = useAppSelector(state => state.actions.keys[key]);
  const dispatch = useAppDispatch();

  const actions = useActions();

  if (!dockingMap) {
    dockingMap = makeBreakpointsMap<BreakpointsDockingMap>({
      defaultValue: DockTypes.both, 
      fromEnum: DockTypes, 
      pref: RSPrefs.docking.dock, 
      disabledValue: DockTypes.none 
    });
  }
  const currentDockConfig = staticBreakpoint && dockingMap[staticBreakpoint];
  const dockablePref = RSPrefs.actions.keys[key].docked?.dockable || DockTypes.none;

  const defaultSheet = RSPrefs.actions.keys[key].sheet?.defaultSheet || SheetTypes.popover;

  const sheetMap = makeBreakpointsMap<BreakpointsSheetMap>({
    defaultValue: RSPrefs.actions.keys[key].sheet?.defaultSheet || SheetTypes.popover, 
    fromEnum: SheetTypes, 
    pref: RSPrefs.actions.keys[key].sheet?.breakpoints
  });
  const sheetPref = staticBreakpoint && sheetMap[staticBreakpoint] || defaultSheet;

  const [sheetType, setSheetType] = useState<SheetTypes>(defaultSheet);
  const previousSheetType = usePrevious(sheetType);

  // Checks whether the action can be docked: its pref should match the docking pref
  const canBeDocked = useCallback((slot: DockTypes.start | DockTypes.end) => {
      return (currentDockConfig === slot || currentDockConfig === DockTypes.both) 
          && (dockablePref === slot || dockablePref === DockTypes.both);
  }, [currentDockConfig, dockablePref]);

  // Checks whether the sheet pref is of Dock type 
  const isDockedSheetPref = useCallback((type?: SheetTypes.dockedStart | SheetTypes.dockedEnd) => {
    if (type) {
      return sheetPref === type;
    } else {
      return sheetPref === SheetTypes.dockedStart || sheetPref === SheetTypes.dockedEnd
    }
  }, [sheetPref]);
  
  // Builds the docker for the action based on all preferences
  const getDocker = useCallback((): DockingKeys[] => {
    // First let’s handle the cases where docker shouldn’t be used
    // The sheet is not dockable, per key.docked.dockable pref
    if (dockablePref === DockTypes.none) return [];
    // There’s no docking slot available, per docking.dock pref
    if (currentDockConfig === DockTypes.none) return [];
    // The sheet type is not compatible with docking
    if (sheetPref === SheetTypes.fullscreen || sheetPref === SheetTypes.bottomSheet) return [];

    // We can now build the docker from the display order
    let dockerKeys: DockingKeys[] = [];
    // In order for an action to be dockable, the dock slot has to exist
    // and the dockable preference of key.docked should match the values
    RSPrefs.docking.displayOrder.forEach((dockingKey: DockingKeys) => {
      switch(dockingKey) {
        case DockingKeys.transient:
          // We already handled both cases for none 
          dockerKeys.push(dockingKey);
          break;
        case DockingKeys.start:
          if (canBeDocked(DockTypes.start)) {
            dockerKeys.push(dockingKey);
          }
          break;
        case DockingKeys.end:
          if (canBeDocked(DockTypes.end)) {
            dockerKeys.push(dockingKey);
          }
          break;
        default:
          break;
      }
    });

    // If the action can only be transient, then it can’t be docked
    if (dockerKeys.length === 1 && dockerKeys[0] === DockingKeys.transient) return [];

    return dockerKeys;
  }, [currentDockConfig, sheetPref, dockablePref, canBeDocked]);

  const getSheetType = useCallback(() => {
    // First check the dockable pref is none to return early
    if (dockablePref === DockTypes.none) {
      // Sheet is of docked type, we return the default
      if (isDockedSheetPref()) {
        return defaultSheet;
      } else {
        // Sheet pref is not of docked type, we can return it
        return sheetPref;
      }
    };

    // We now need to check whether the user has docked the action themselves
    // ActionsReducer should has made sure there is no conflict to handle here 
    // by updating states of actions on docking
    switch (actionState.docking) {
      
      // if action.docking is transient we need to check the pref, 
      // it can be docked and in that case we need to pick the default
      case DockingKeys.transient:
        if (isDockedSheetPref()) {
          return defaultSheet;
        } else {
          return sheetPref;
        }
      
      // If action.docking is set to start/end then we check the docking slot is available
      case DockingKeys.start:
        if (canBeDocked(DockTypes.start)) {
          return SheetTypes.dockedStart;
        } else {
          // if the pref is not docked start, return the pref 
          // else return the default
          if (!isDockedSheetPref(SheetTypes.dockedStart)) {
            return sheetPref;
          } else {
            return defaultSheet;
          }
        }

      case DockingKeys.end:
        if (canBeDocked(DockTypes.end)) {
          return SheetTypes.dockedEnd;
        } else {
          // if the pref is not docked end, return the pref 
          // else return the default
          if (!isDockedSheetPref(SheetTypes.dockedEnd)) {
            return sheetPref;
          } else {
            return defaultSheet;
          }
        }
      
      // If action.docking is null then we rely on pref 
      // as it means the user did not pick another option
      case null:
        // We have to check sheetPref is compatible with docking prefs
        if (isDockedSheetPref(SheetTypes.dockedStart)) {
          if (canBeDocked(DockTypes.start)) {
            return SheetTypes.dockedStart;
          } else {
            return defaultSheet;
          }
        } else if (isDockedSheetPref(SheetTypes.dockedEnd)) {
          if (canBeDocked(DockTypes.end)) {
            return SheetTypes.dockedEnd;
          } else {
            return defaultSheet;
          }
        } else {
          return sheetPref;
        }
      default:
        return defaultSheet;
    }
  }, [dockablePref, sheetPref, defaultSheet, actionState.docking, canBeDocked, isDockedSheetPref]);

  // When docking or breakpoints-related prefs change, get the correct sheet type
  useEffect(() => {
    setSheetType(getSheetType());
  }, [sheetPref, currentDockConfig, actionState.docking, getSheetType]);

  // Dismiss/Close when sheetType has changed from docked to transient
  useEffect(() => {
    // This was not dismissed on breakpoint change, but by the user
    if (actionState.docking === DockingKeys.transient) return;

    if (sheetType !== SheetTypes.dockedStart && sheetType !== SheetTypes.dockedEnd) {
      if (previousSheetType === SheetTypes.dockedStart || previousSheetType === SheetTypes.dockedEnd) {
        dispatch(setActionOpen({
          key: ActionKeys[key],
          isOpen: false
        }));
      }
    }
  }, [dispatch, key, sheetType, previousSheetType, actionState.docking]);

  // on mount, check whether we should update states for docked sheets from pref
  useEffect(() => {
    if (actionState.isOpen === null) {
      if (sheetType === SheetTypes.dockedStart) {
        dispatch(dockAction({
          key: ActionKeys[key],
          dockingKey: DockingKeys.start
        }));
        dispatch(setActionOpen({
          key: ActionKeys[key],
          isOpen: true
        }));
      } else if (sheetType === SheetTypes.dockedEnd) {
        dispatch(dockAction({
          key: ActionKeys[key],
          dockingKey: DockingKeys.end
        }));
        dispatch(setActionOpen({
          key: ActionKeys[key],
          isOpen: true
        }));
      }
    }
  });

  // Edge case where the sheet has been opened/closed and
  // is of dockable type, but the dock panel is not populated
  // e.g. action was mounted as a different type of sheet (breakpoint),
  // and opened/closed. If the user resizes the window (another breakpoint) 
  // but we don’t dispatch docking, then it can’t be displayed 
  // since the docking slot has never been populated.
  useEffect(() => {
    // Action has been opened/closed by user
    // but it’s not been manually docked, 
    // which means the pref is used but 
    // has not be instantiated yet, and 
    // couldn’t be on first mount because
    // a different type was used in prefs
    if (actionState.isOpen !== null && actionState.docking === null) {
      if (sheetType === SheetTypes.dockedStart) {
        // Check if the action is docked in practice
        // if it isn’t dispatch docking of the action
        const dockingKey = actions.whichDocked(key);
        if (dockingKey !== DockingKeys.start) {
          dispatch(dockAction({
            key: ActionKeys[key],
            dockingKey: DockingKeys.start
          }));
        }
      } else if (sheetType === SheetTypes.dockedEnd) {
        // Check if the action is docked in practice
        // if it isn’t dispatch docking of the action
        const dockingKey = actions.whichDocked(key);
        if (dockingKey !== DockingKeys.end) {
          dispatch(dockAction({
            key: ActionKeys[key],
            dockingKey: DockingKeys.end
          }));
        }
      }
    }
  }, [dispatch, key, sheetType, actionState.isOpen, actionState.docking, actions]);

  return {
    getDocker,
    sheetType
  }
}