import { useCallback } from "react";

import Locale from "../../resources/locales/en.json";

import settingsStyles from "../assets/styles/readerSettings.module.css";

import { IAdvancedDisplayProps } from "@/models/settings";
import { fontWeightRangeConfig } from "@readium/navigator";

import { SliderWrapper } from "./Wrappers/SliderWrapper";

import { useEpubNavigator } from "@/hooks/useEpubNavigator";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setFontWeight } from "@/lib/settingsReducer";

export const ReadingDisplayFontWeight: React.FC<IAdvancedDisplayProps> = ({ standalone = true }) => {
  const fontFamily = useAppSelector(state => state.settings.fontFamily);
  const fontWeight = useAppSelector(state => state.settings.fontWeight);
  const dispatch = useAppDispatch();

  const { getSetting, submitPreferences } = useEpubNavigator();

  const updatePreference = useCallback(async (value: number) => {
    await submitPreferences({ fontWeight: value });

    dispatch(setFontWeight(getSetting("fontWeight")));
  }, [submitPreferences, getSetting, dispatch]);

  return(
    <>
    <SliderWrapper
      { ...(standalone ? { className: settingsStyles.readerSettingsGroup } : {}) }
      defaultValue={ 400 } 
      value={ fontWeight } 
      onChangeCallback={ async(value) => await updatePreference(value) } 
      label={ Locale.reader.settings.fontWeight.title }
      range={ fontWeightRangeConfig.range }
      step={ fontWeightRangeConfig.step }
      isDisabled={ fontFamily === "publisher" }
      standalone={ standalone }
    /> 
    </>
  )
}