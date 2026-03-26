"use client";

import { useCallback } from "react";

import { Button, ButtonProps } from "react-aria-components";

import { HTMLAttributesWithRef } from "../customTypes";
import { ThSlider, ThSliderProps } from "./ThSlider";

export interface ThSliderWithPresetsProps extends Omit<ThSliderProps, "compounds"> {
  presets: number[];
  formatValue?: (value: number) => string;
  compounds?: {
    /**
     * Props for the outer wrapper div (contains slider + presets).
     */
    wrapper?: HTMLAttributesWithRef<HTMLDivElement>;
    /**
     * Compounds forwarded to the inner ThSlider.
     */
    slider?: ThSliderProps["compounds"];
    /**
     * Props for the presets list element.
     */
    presetsList?: HTMLAttributesWithRef<HTMLUListElement>;
    /**
     * Props for each preset list item element.
     */
    presetsItem?: HTMLAttributesWithRef<HTMLLIElement>;
    /**
     * Props applied to each preset button.
     */
    preset?: Omit<ButtonProps, "onPress" | "children">;
  };
}

export const ThSliderWithPresets = ({
  presets,
  formatValue,
  value,
  onChange,
  compounds,
  range,
  step,
  ...props
}: ThSliderWithPresetsProps) => {
  const currentValue = Array.isArray(value) ? value[0] : value;

  const handlePresetPress = useCallback((presetValue: number) => {
    onChange?.([presetValue]);
  }, [onChange]);

  return (
    <div { ...compounds?.wrapper }>
      <ThSlider
        value={ value }
        onChange={ onChange }
        range={ range }
        step={ step }
        compounds={ compounds?.slider }
        { ...props }
      />
      <ul { ...compounds?.presetsList }>
        { presets.map((presetValue) => (
          <li key={ presetValue } { ...compounds?.presetsItem }>
            <Button
              { ...compounds?.preset }
              data-selected={ currentValue === presetValue || undefined }
              onPress={ () => handlePresetPress(presetValue) }
            >
              { formatValue ? formatValue(presetValue) : String(presetValue) }
            </Button>
          </li>
        )) }
      </ul>
    </div>
  );
};
