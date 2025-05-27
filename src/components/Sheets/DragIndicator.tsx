import { KeyboardEvent } from "react";

import sheetStyles from "../assets/styles/sheet.module.css";

import Indicator from "../assets/icons/horizontal_rule.svg";
import { Button } from "react-aria-components";

export const DragIndicatorButton = ({
  onPressCallback,
  onKeyUpCallback
}: {
  onPressCallback: () => void;
  onKeyUpCallback: (e: KeyboardEvent) => void;
}) => {
  return (
    <>
    <Button 
      className={ sheetStyles.dragIndicator }
      onPress={ onPressCallback }
      onKeyUp={ onKeyUpCallback }
    >
      <Indicator aria-hidden="true" focusable="false" />
    </Button>
    </>
  )
}