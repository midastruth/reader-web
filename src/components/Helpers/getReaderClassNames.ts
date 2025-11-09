import { ThLayoutUI } from "@/preferences";
import readerStyles from "../assets/styles/reader.module.css";
import classNames from "classnames";

interface ReaderStyleOptions {
  layoutUI: ThLayoutUI;
  isScroll: boolean;
  isImmersive?: boolean;
  isHovering?: boolean;
  isFXL?: boolean;
  breakpoint?: string;
}

const LAYOUT_CLASSES = {
  [ThLayoutUI.stacked]: "thoriumWebStackedUI",
  [ThLayoutUI.layered]: "thoriumWebLayeredUI",
} as const;

export function getReaderClassNames(options: ReaderStyleOptions): string {
  const {
    layoutUI,
    isScroll,
    isImmersive = false,
    isHovering = false,
    isFXL = false,
    breakpoint,
  } = options;

  return classNames(
    readerStyles.thoriumWebReaderShell,
    isScroll ? "thoriumWebIsScroll" : "thoriumWebIsPaged",
    isImmersive && "thoriumWebIsImmersive",
    isHovering && "thoriumWebIsHovering",
    isFXL ? "thoriumWebIsFXL" : "thoriumWebIsReflow",
    LAYOUT_CLASSES[layoutUI],
    breakpoint ? `thoriumWebIs${ breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1) }` : undefined
  );
}