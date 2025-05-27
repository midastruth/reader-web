import { useCallback } from "react";

import { RSPrefs } from "@/preferences";

import Locale from "../../resources/locales/en.json";

import settingsStyles from "../assets/styles/readerSettings.module.css";

import { 
  defaultParagraphSpacing, 
  IAdvancedDisplayProps, 
  SettingsRangeVariant 
} from "@/models/settings";

import { NumberFieldWrapper } from "./Wrappers/NumberFieldWrapper";
import { SliderWrapper } from "./Wrappers/SliderWrapper";

import { useEpubNavigator } from "@/hooks/useEpubNavigator";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setParagraphSpacing, setPublisherStyles } from "@/lib/settingsReducer";

export const ReadingDisplayParaSpacing: React.FC<IAdvancedDisplayProps> = ({ standalone = true }) => {
  const paragraphSpacing = useAppSelector(state => state.settings.paragraphSpacing);
  const paragraphSpacingRangeConfig = {
    variant: RSPrefs.settings.spacing?.paragraphSpacing?.variant ?? defaultParagraphSpacing.variant,
    range: RSPrefs.settings.spacing?.paragraphSpacing?.range ?? defaultParagraphSpacing.range,
    step: RSPrefs.settings.spacing?.paragraphSpacing?.step ?? defaultParagraphSpacing.step
  };
  const dispatch = useAppDispatch();

  const { getSetting, submitPreferences } = useEpubNavigator();

  const updatePreference = useCallback(async (value: number) => {
    await submitPreferences({
      paragraphSpacing: value
    });

    dispatch(setParagraphSpacing(getSetting("paragraphSpacing")));
    dispatch(setPublisherStyles(false));
  }, [submitPreferences, getSetting, dispatch]);

  return (
    <>
    { paragraphSpacingRangeConfig.variant === SettingsRangeVariant.numberField 
      ? <NumberFieldWrapper 
        standalone={ standalone }
        { ...(standalone ? { className: settingsStyles.readerSettingsGroup } : {}) }
        defaultValue={ 0 } 
        value={ paragraphSpacing || 0 } 
        onChangeCallback={ async(value) => await updatePreference(value) } 
        label={ Locale.reader.settings.paraSpacing.title }
        range={ paragraphSpacingRangeConfig.range }
        step={ paragraphSpacingRangeConfig.step }
        steppers={{
          decrementLabel: Locale.reader.settings.paraSpacing.decrease,
          incrementLabel: Locale.reader.settings.paraSpacing.increase
        }}
        format={{
          signDisplay: "exceptZero",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }} 
        isWheelDisabled={ true }
        virtualKeyboardDisabled={ true }
      />
      : <SliderWrapper
        standalone={ standalone }
        { ...(standalone ? { className: settingsStyles.readerSettingsGroup } : {}) }
        defaultValue={ 0 } 
        value={ paragraphSpacing || 0 } 
        onChangeCallback={ async(value) => await updatePreference(value) } 
        label={ Locale.reader.settings.paraSpacing.title }
        range={ paragraphSpacingRangeConfig.range }
        step={ paragraphSpacingRangeConfig.step }
        format={{
          signDisplay: "exceptZero",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }}
      /> 
    }
    </>
  )
}