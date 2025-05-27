import React, { useEffect, useRef, useState } from "react";

import { RSPrefs } from "@/preferences";

import { IReaderArrow } from "@/models/layout";

import Locale from "../resources/locales/en.json";

import arrowStyles from "./assets/styles/arrowButton.module.css";
import readerSharedUI from "./assets/styles/readerSharedUI.module.css";
import readerStateStyles from "./assets/styles/readerStates.module.css";

import LeftArrow from "./assets/icons/arrow_back.svg";
import RightArrow from "./assets/icons/arrow_forward.svg";

import { Button, Tooltip, TooltipTrigger } from "react-aria-components";

import { usePrevious } from "@/hooks/usePrevious";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setArrows } from "@/lib/readerReducer";

import { isActiveElement } from "@/helpers/focus";
import classNames from "classnames";

export const ArrowButton = (props: IReaderArrow) => {
  const button = useRef<HTMLButtonElement>(null);
  const isRTL = useAppSelector(state => state.publication.isRTL);
  const hasArrows = useAppSelector(state => state.reader.hasArrows);

  const isScroll = useAppSelector(state => state.settings.scroll);
  const wasScroll = usePrevious(isScroll);

  const dispatch = useAppDispatch();

  const [isHovering, setIsHovering] = useState(false);

  const switchedFromScrollable = () => {
    return wasScroll && !isScroll;
  }

  const label = (
    props.direction === "right" && !isRTL || 
    props.direction === "left" && isRTL
  ) 
    ? Locale.reader.navigation.goForward 
    : Locale.reader.navigation.goBackward;

  const handleClassNameFromState = () => {
    let className = "";
    if (!hasArrows && !switchedFromScrollable()) {
      className = readerStateStyles.immersiveHidden;
    }
    return className;
  };

  const handleClassNameFromSpaceProp = () => {
    let className = "";
    if (props.occupySpace) {
      className = arrowStyles.viewportLarge;
    }
    return className;
  };

  useEffect(() => {
    if ((props.disabled || (!hasArrows && !isHovering)) && isActiveElement(button.current)) {
      button.current!.blur();
    }
  });

  const blurOnEsc = (event: React.KeyboardEvent) => {    
    if (isActiveElement(button.current) && event.code === "Escape") {
      button.current!.blur();
    }
  };

  const handleOnPress = (cb: () => void) => {
    dispatch(setArrows(false));
    cb();
  }
  
  return (
    <>
    <TooltipTrigger 
      { ...(RSPrefs.theming.arrow.tooltipDelay 
        ? { 
            delay: RSPrefs.theming.arrow.tooltipDelay,
            closeDelay: RSPrefs.theming.arrow.tooltipDelay
          } 
        : {}
      )}
    >
      <Button
        ref={ button }
        aria-label={ label }
        onPress={ () => handleOnPress(props.onPressCallback) }
        onHoverChange={ (e) => setIsHovering(e) } 
        onKeyDown={ blurOnEsc }
        className={ classNames(props.className, handleClassNameFromSpaceProp(), handleClassNameFromState()) }
        isDisabled={ props.disabled }
        preventFocusOnPress={ true }
      >
        { props.direction === "left" ? 
          <LeftArrow aria-hidden="true" focusable="false" /> : 
          <RightArrow aria-hidden="true" focusable="false" />
        }
      </Button>
      <Tooltip
        className={ readerSharedUI.tooltip }
        placement={ props.direction === "left" ? "right" : "left" }>
        { label }
      </Tooltip>
    </TooltipTrigger>
    </>);
}