import React from "react";

import { ISettingsNumberFieldProps } from "@/models/settings";

import readerSharedUI from "../../assets/styles/readerSharedUI.module.css";
import settingsStyles from "../../assets/styles/readerSettings.module.css";

import PlusIcon from "../../assets/icons/add.svg";
import MinusIcon from "../../assets/icons/remove.svg";

import { Button, Group, Input, Label, NumberField, NumberFieldProps } from "react-aria-components";

import classNames from "classnames";

export const NumberFieldWrapper: React.FC<NumberFieldProps & ISettingsNumberFieldProps> = ({
  standalone, 
  className,
  label,
  defaultValue,
  value,
  onChangeCallback,
  range,
  step,
  steppers,
  format,
  virtualKeyboardDisabled,
  readOnly,
  ...props
}) => {

  return (
    <NumberField 
      className={ classNames(settingsStyles.readerSettingsNumberField, className) }
      defaultValue={ defaultValue }
      value={ value }
      minValue={ Math.min(...range) }
      maxValue={ Math.max(...range) }
      step={ step }
      formatOptions={ format } 
      onChange={ onChangeCallback }
      decrementAriaLabel={ steppers.decrementLabel }
      incrementAriaLabel={ steppers.incrementLabel }
      { ...(!standalone ? { "aria-label": label } : {}) }
      { ...props }
    >
      { standalone && <Label className={ settingsStyles.readerSettingsLabel }>
          { label }
        </Label>
      }

      <Group className={ settingsStyles.readerSettingsGroupWrapper }>
        <Button 
          slot="decrement" 
          className={ readerSharedUI.icon }
        >
          { steppers.decrementIcon 
            ? <steppers.decrementIcon aria-hidden="true" focusable="false" /> 
            : <MinusIcon aria-hidden="true" focusable="false" /> }
        </Button>

        <Input 
          className={ settingsStyles.readerSettingsInput } 
          readOnly={ readOnly } 
          { ...(virtualKeyboardDisabled ? { inputMode: "none" } : {}) } 
        />

        <Button 
          slot="increment" 
          className={ readerSharedUI.icon }
        >
          { steppers.incrementIcon 
            ? <steppers.incrementIcon aria-hidden="true" focusable="false" /> 
            : <PlusIcon aria-hidden="true" focusable="false" /> }
        </Button>
      </Group>
    </NumberField>
  );
};