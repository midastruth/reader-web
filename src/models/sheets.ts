import { ReactNode, RefObject } from "react";
import { StaticBreakpoints } from "./staticBreakpoints";
import { ActionsStateKeys } from "./state/actionsState";
import { DockingKeys } from "./docking";

export enum SheetTypes {
  popover = "popover",
  fullscreen = "fullscreen",
  dockedStart = "docked start",
  dockedEnd = "docked end",
  bottomSheet = "bottomSheet"
}

export type BreakpointsSheetMap = {
  [key in StaticBreakpoints]?: SheetTypes;
}

export enum SheetHeaderVariant {
  close = "close",
  previous = "previous"
}

export interface ISheet {
  id: ActionsStateKeys;
  triggerRef: RefObject<HTMLElement | null>;
  heading: string;
  headerVariant?: SheetHeaderVariant;
  className: string;
  isOpen: boolean;
  onOpenChangeCallback: (isOpen: boolean) => void;
  onClosePressCallback: () => void;
  docker?: DockingKeys[];
  children?: ReactNode;
  resetFocus?: unknown;
  dismissEscapeKeyClose?: boolean;
}

export type BottomSheetDetent = "content-height" | "full-height";

export interface ISnappedPref {
  scrim?: boolean | string;
  maxWidth?: number | null;
  maxHeight?: number | BottomSheetDetent;
  peekHeight?: number | BottomSheetDetent;
  minHeight?: number | BottomSheetDetent;
}

export type SheetPref = BreakpointsSheetMap;

export interface IScrimPref {
  active: boolean;
  override?: string;
}