import settingsStyles from "../../assets/styles/readerSettings.module.css";

import { ISettingsSliderProps } from "@/models/settings";

import { Label, Slider, SliderOutput, SliderProps, SliderThumb, SliderTrack } from "react-aria-components";

import classNames from "classnames";

export const SliderWrapper: React.FC<SliderProps & ISettingsSliderProps> = ({
  standalone, 
  className,
  label,
  defaultValue,
  value,
  onChangeCallback,
  range,
  step,
  format,
  ...props
}) => {
  return(
    <>
    <Slider 
      className={ classNames(settingsStyles.readerSettingsSlider, className) }
      defaultValue={ defaultValue }
      value={ value }
      minValue={ Math.min(...range) }
      maxValue={ Math.max(...range) }
      step={ step }
      formatOptions={ format }
      onChange={ onChangeCallback }
      { ...(!standalone ? { "aria-label": label } : {}) }
      { ...props }
    >
      { standalone && <Label className={ classNames(settingsStyles.readerSettingsLabel, settingsStyles.readerSettingsSliderLabel) }>{ label }</Label> }
      <SliderOutput className={ settingsStyles.readerSettingsSliderOutput } />
      <SliderTrack className={ settingsStyles.readerSettingsSliderTrack }>
        <SliderThumb className={ settingsStyles.readerSettingsSliderThumb } />
      </SliderTrack>
    </Slider>
    </>
  )
}