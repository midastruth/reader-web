import React, { useCallback, useRef } from "react";
import { createPortal } from "react-dom";

import { ISheet, SheetHeaderVariant } from "@/models/sheets";
import { DockingKeys } from "@/models/docking";
import { LayoutDirection } from "@/models/layout";

import sheetStyles from "../assets/styles/sheet.module.css";

import { Heading } from "react-aria-components";
import { Docker } from "./Docking/Docker";
import { BackButton } from "../BackButton";

import { FocusScope } from "react-aria";

import { useAppSelector } from "@/lib/hooks";

import { useFirstFocusable } from "@/hooks/useFirstFocusable";

import classNames from "classnames";

export interface IDockedSheet extends ISheet {
  flow: DockingKeys.start | DockingKeys.end | null;
}

export const DockedSheet: React.FC<IDockedSheet> = ({ 
    id,
    heading,
    headerVariant,
    className, 
    isOpen,
    onClosePressCallback,
    docker, 
    flow,
    children,
    resetFocus
  }) => {
  const dockPortal = flow && document.getElementById(flow);
  const dockedSheetHeaderRef = useRef<HTMLDivElement | null>(null);
  const dockedSheetBodyRef = useRef<HTMLDivElement | null>(null);
  const dockedSheetCloseRef = useRef<HTMLButtonElement | null>(null);

  const direction = useAppSelector(state => state.reader.direction);

  const firstFocusable = useFirstFocusable({
    withinRef: dockedSheetBodyRef, 
    trackedState: isOpen, 
    fallbackRef: dockedSheetCloseRef,
    updateState: resetFocus
  }); 

  const classFromFlow = useCallback(() => {
    if (flow === DockingKeys.start) {
      return direction === LayoutDirection.ltr ? sheetStyles.dockedSheetLeftBorder : sheetStyles.dockedSheetRightBorder;
    } else if (flow === DockingKeys.end) {
      return direction === LayoutDirection.ltr ? sheetStyles.dockedSheetRightBorder : sheetStyles.dockedSheetLeftBorder;
    }
  }, [flow, direction]);

  return (
    <>
    { React.Children.toArray(children).length > 0 
      ? <>
        { isOpen && dockPortal && createPortal(
        <FocusScope 
          contain={ false }
          autoFocus={ true } 
          restoreFocus={ true }
        >
          <div 
            className={ classNames(sheetStyles.dockedSheet, className, classFromFlow()) }
            style={{
              "--sheet-sticky-header": dockedSheetHeaderRef.current ? `${ dockedSheetHeaderRef.current.clientHeight }px` : undefined
            }}
          >
            <div 
              ref={ dockedSheetHeaderRef }
              className={ sheetStyles.sheetHeader }
            >             
              <Heading slot="title" className={ sheetStyles.sheetHeading }>{ heading }</Heading>

              { headerVariant === SheetHeaderVariant.previous 
                ? <BackButton 
                  ref={ dockedSheetCloseRef }
                  onPressCallback={ onClosePressCallback }
                /> 
                : <Docker 
                  id={ id }
                  keys={ docker || [] }
                  ref={ dockedSheetCloseRef }
                  onCloseCallback={ onClosePressCallback }
                />
              } 
            </div>
              
            <div 
              ref={ dockedSheetBodyRef } 
              className={ sheetStyles.sheetBody }
            >
              { children }
            </div>
          </div>
        </FocusScope>
        , dockPortal) 
        }
        </>
      : <></> }
    </>
  )
}