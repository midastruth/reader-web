import React from "react";

import { RSPrefs } from "@/preferences";
import Locale from "../resources/locales/en.json";

import { ActionComponentVariant, ActionKeys, IActionComponentTrigger } from "@/models/actions";

import readerSharedUI from "./assets/styles/readerSharedUI.module.css";

import FullscreenCorners from "./assets/icons/fullscreen.svg";
import FullscreenExit from "./assets/icons/fullscreen_exit.svg";

import { OverflowMenuItem } from "./ActionTriggers/OverflowMenuItem";
import { ActionIcon } from "./ActionTriggers/ActionIcon";

import { useFullscreen } from "@/hooks/useFullscreen";

import { useAppDispatch } from "@/lib/hooks";
import { setHovering } from "@/lib/readerReducer";
import { isIOSish } from "@/helpers/keyboard/getPlatform";

export const FullscreenAction: React.FC<IActionComponentTrigger> = ({ variant }) => {
  // Note: Not using React Aria ToggleButton here as fullscreen is quite
  // difficult to control in isolation due to collapsibility + shortcuts

  const fs = useFullscreen();
  const dispatch = useAppDispatch();

  const label = fs.isFullscreen ? Locale.reader.fullscreen.close : Locale.reader.fullscreen.trigger;
  const icon = fs.isFullscreen ? FullscreenExit : FullscreenCorners;

  const handlePress = () => {
    fs.handleFullscreen();
    // Has to be dispatched manually, otherwise stays true… 
    dispatch(setHovering(false));
    // TODO: fix hover state on exit, if even possible w/o a lot of getting around…
  };

  // Per React doc/principles this isn’t common but FullScreen is quite an edge case cos’ of iPadOS…
  // And Actions is still a work in progress, with opportunities to rewrite/refactor
  // Note we don’t check window.matchMedia("(display-mode: standalone)").matches as this is not a PWA yet
  // And more values here: https://web.dev/learn/pwa/detection
  if (!document.fullscreenEnabled || isIOSish()) return null;

  return(
    <>
    { (variant && variant === ActionComponentVariant.menu) 
      ? <OverflowMenuItem 
          label={ label }
          SVG={ icon } 
          shortcut={ RSPrefs.actions.keys[ActionKeys.fullscreen].shortcut }
          onActionCallback={ fs.handleFullscreen } 
          id={ ActionKeys.fullscreen }
        />
      : <ActionIcon 
          className={ readerSharedUI.iconCompSm }
          visibility={ RSPrefs.actions.keys[ActionKeys.fullscreen].visibility }  
          ariaLabel={ label }
          SVG={ icon } 
          placement="bottom" 
          tooltipLabel={ Locale.reader.fullscreen.tooltip } 
          onPressCallback={ handlePress } 
        />
    } 
    </>
  )
}