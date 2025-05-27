import { ActionKeys } from "../actions";
import { Docked, DockingKeys } from "../docking";

export type ActionsStateKeys = Exclude<ActionKeys, ActionKeys.fullscreen>;
export type OverflowStateKeys = string;

export interface IActionStateObject {
  isOpen: boolean | null;
  docking: DockingKeys | null;
  dockedWidth?: number;
}

export interface IOverflowStateObject {
  isOpen: boolean;
}

export interface IActionStateDockPayload {
  type: string;
  payload: {
    key: ActionsStateKeys;
    dockingKey: DockingKeys;
  }
}

export interface IActionStateOpenPayload {
  type: string;
  payload: {
    key: ActionsStateKeys;
    isOpen: boolean;
  }
}

export interface IActionStateTogglePayload {
  type: string;
  payload: {
    key: ActionsStateKeys
  }
}

export interface IActionOverflowOpenPayload {
  type: string;
  payload: {
    key: OverflowStateKeys;
    isOpen: boolean;
  }
}

export interface IActionStateDockedPayload {
  type: string;
  payload: { 
    slot: DockingKeys.start | DockingKeys.end;
    docked: Docked;
  }
}

export interface IActionStateSlotPayload {
  type: string;
  payload: DockingKeys.start | DockingKeys.end;
}

export interface IActionStateSlotWidthPayload {
  type: string;
  payload: { 
    key: DockingKeys.start | DockingKeys.end;
    width: number;
  }
}

export interface IDockState {
  [DockingKeys.start]: Docked;
  [DockingKeys.end]: Docked;
}

export type IActionsState = {
  keys: {
    [key in ActionsStateKeys]: IActionStateObject;
  };
  dock: IDockState,
  overflow: {
    [key in OverflowStateKeys]: IOverflowStateObject;
  }
}