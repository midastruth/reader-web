import { SheetTypes } from "./sheets";

import fontStacks from "@readium/css/css/vars/fontStacks.json";

export enum LayoutDirection {
  ltr = "ltr",
  rtl = "rtl"
}

export interface ILayoutDefaults {
  dockingWidth: number;
  scrim: string;
}

export type Constraints = Extract<SheetTypes, SheetTypes.bottomSheet | SheetTypes.popover>;

export enum ReadingDisplayLayoutOptions { 
  scroll = "scroll_option",
  paginated = "page_option"
}

export enum RSLayoutStrategy {
  margin = "margin",
  lineLength = "lineLength",
  columns = "columns"
}

export const ReadingDisplayFontFamilyOptions = {
  publisher: null,
  oldStyle: fontStacks.RS__oldStyleTf,
  modern: fontStacks.RS__modernTf,
  sans: fontStacks.RS__sansTf,
  humanist: fontStacks.RS__humanistTf,
  monospace: fontStacks.RS__monospaceTf
}

export enum ReadingDisplayAlignOptions {
  publisher = "publisher",
  start = "start",
  justify = "justify"
}

export enum ReadingDisplayLineHeightOptions {
  publisher = "publisher",
  small = "small",
  medium = "medium",
  large = "large"
}

export interface IReaderArrow {
  direction: "left" | "right";
  occupySpace: boolean;
  className?: string;
  disabled: boolean;
  onPressCallback: () => void;
}