import { ThCollapsibility, ThCollapsibilityVisibility } from "@/core/Components/Actions/hooks/useCollapsibility";
import { BreakpointsMap } from "@/core/Hooks/useBreakpoints";

export type ThBottomSheetDetent = "content-height" | "full-height";

export interface ThActionsTokens {
  visibility: ThCollapsibilityVisibility;
  shortcut: string | null;
  sheet?: {
    defaultSheet: Exclude<ThSheetTypes, ThSheetTypes.dockedStart | ThSheetTypes.dockedEnd>;
    breakpoints: BreakpointsMap<ThSheetTypes>;
  };
  docked?: ThActionsDockedPref;
  snapped?: ThActionsSnappedPref;
};

export interface ThActionsDockedPref {
  dockable: ThDockingTypes,
  dragIndicator?: boolean,
  width?: number,
  minWidth?: number,
  maxWidth?: number
}

export interface ThActionsSnappedPref {
  scrim?: boolean | string;
  maxWidth?: number | null;
  maxHeight?: number | ThBottomSheetDetent;
  peekHeight?: number | ThBottomSheetDetent;
  minHeight?: number | ThBottomSheetDetent;
}

export interface ThDockingPref<T extends string> {
  displayOrder: T[];
  collapse: ThCollapsibility;
  dock: BreakpointsMap<ThDockingTypes> | boolean; 
  keys: {
    [key in T]: Pick<ThActionsTokens, "visibility" | "shortcut">;
  }
};

export enum ThActionsKeys {
  fullscreen = "fullscreen",
  jumpToPosition = "jumpToPosition",
  settings = "settings",
  toc = "toc"
}

export enum ThDockingKeys {
  start = "dockingStart",
  end = "dockingEnd",
  transient = "dockingTransient"
}

export enum ThDockingTypes {
  none = "none",
  both = "both",
  start = "start",
  end = "end"
}

export enum ThSheetTypes {
  popover = "popover",
  fullscreen = "fullscreen",
  dockedStart = "docked start",
  dockedEnd = "docked end",
  bottomSheet = "bottomSheet"
}

export enum ThSheetHeaderVariant {
  close = "close",
  previous = "previous"
}

export const defaultActionKeysObject: ThActionsTokens = {
  visibility: ThCollapsibilityVisibility.partially,
  shortcut: null
};