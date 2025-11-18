import { ThLayoutUI } from "@/preferences";
import readerStyles from "../assets/styles/thorium-web.reader.app.module.css";
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
  [ThLayoutUI.stacked]: "thorium_web_stackedUI",
  [ThLayoutUI.layered]: "thorium_web_layeredUI",
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
    readerStyles.shell,
    isScroll ? "thorium_web_isScroll" : "thorium_web_isPaged",
    isImmersive && "thorium_web_isImmersive",
    isHovering && "thorium_web_isHovering",
    isFXL ? "thorium_web_isFXL" : "thorium_web_isReflow",
    LAYOUT_CLASSES[layoutUI],
    breakpoint ? `thorium_web_is${ breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1) }` : undefined
  );
}