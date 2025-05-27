import Locale from "../resources/locales/en.json";

import { IBackButton } from "@/models/actions";
import { LayoutDirection } from "@/models/layout";

import ArrowLeft from "./assets/icons/arrow_back.svg";
import ArrowRight from "./assets/icons/arrow_forward.svg";

import readerSharedUI from "./assets/styles/readerSharedUI.module.css";

import { Button } from "react-aria-components";

import { useAppSelector } from "@/lib/hooks";

import classNames from "classnames";

export const BackButton = ({
  ref,
  className,
  label,
  onPressCallback
}: IBackButton) => {
  const isRTL = useAppSelector(state => state.reader.direction) === LayoutDirection.rtl;

  return (
    <>
    <Button 
      ref={ ref }
      className={ classNames(className, readerSharedUI.backButton) } 
      aria-label={ label || Locale.reader.app.back.trigger } 
      onPress={ onPressCallback }
    >
      { isRTL 
        ? <ArrowRight aria-hidden="true" focusable="false" /> 
        : <ArrowLeft aria-hidden="true" focusable="false" /> }
      { Locale.reader.app.back.trigger }
    </Button>
    </>
  )
}