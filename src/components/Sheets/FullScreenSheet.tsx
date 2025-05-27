import React, { useRef } from "react";

import Locale from "../../resources/locales/en.json";

import { ISheet, SheetHeaderVariant } from "@/models/sheets";

import sheetStyles from "../assets/styles/sheet.module.css";
import readerSharedUI from "../assets/styles/readerSharedUI.module.css";

import { Dialog, Heading, Modal } from "react-aria-components";
import { BackButton } from "../BackButton";
import { CloseButton } from "../CloseButton";

import { useFirstFocusable } from "@/hooks/useFirstFocusable";

import classNames from "classnames";

export interface IFullScreenSheet extends ISheet {};

export const FullScreenSheet: React.FC<IFullScreenSheet> = ({
    id, 
    heading,
    headerVariant,
    className, 
    isOpen,
    onOpenChangeCallback, 
    onClosePressCallback,
    children,
    resetFocus,
    dismissEscapeKeyClose
  }) => {
  const fullScreenHeaderRef = useRef<HTMLDivElement | null>(null);
  const fullScreenBodyRef = useRef<HTMLDivElement | null>(null);
  const fullScreenCloseRef = useRef<HTMLButtonElement | null>(null);

  const firstFocusable = useFirstFocusable({
    withinRef: fullScreenBodyRef, 
    trackedState: isOpen, 
    fallbackRef: fullScreenCloseRef,
    updateState: resetFocus
  });

  return (
  <>
  { React.Children.toArray(children).length > 0 
    ? <Modal 
        isOpen={ isOpen }
        onOpenChange={ onOpenChangeCallback }
        isDismissable={ true }
        className={ classNames(sheetStyles.fullScreenSheet, className) }
        isKeyboardDismissDisabled={ dismissEscapeKeyClose }
        style={{
          "--sheet-sticky-header": fullScreenHeaderRef.current ? `${ fullScreenHeaderRef.current.clientHeight }px` : undefined
        }}
      >
        <Dialog className={ sheetStyles.sheetDialog }>
          <div 
            ref={ fullScreenHeaderRef }
            className={ sheetStyles.sheetHeader }
          >
            <Heading slot="title" className={ sheetStyles.sheetHeading }>{ heading }</Heading>

            { headerVariant === SheetHeaderVariant.previous
              ? <BackButton 
                ref={ fullScreenCloseRef }
                onPressCallback={ onClosePressCallback }
              />
              : <CloseButton
                ref={ fullScreenCloseRef }
                className={ readerSharedUI.closeButton } 
                label={ Locale.reader.app.docker.close.trigger } 
                onPressCallback={ onClosePressCallback }
              />
            }
          </div>
              
          <div 
            ref={ fullScreenBodyRef } 
            className={ sheetStyles.sheetBody }
          >
            { children }
          </div>
        </Dialog>
      </Modal>
  : <></> }
  </>
  )
}