import { useCallback } from "react";

import Locale from "../../resources/locales/en.json";

import settingsStyles from "../assets/styles/readerSettings.module.css";

import { IAdvancedDisplayProps } from "@/models/settings";
import { ReadingDisplayAlignOptions } from "@/models/layout";

import { SwitchWrapper } from "./Wrappers/SwitchWrapper";

import { useEpubNavigator } from "@/hooks/useEpubNavigator";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setHyphens } from "@/lib/settingsReducer";

// TMP Component that is not meant to be implemented AS-IS, for testing purposes
export const ReadingDisplayHyphens: React.FC<IAdvancedDisplayProps> = ({ standalone = true }) => {
  const hyphens = useAppSelector(state => state.settings.hyphens);
  const textAlign = useAppSelector(state => state.settings.textAlign);

  const dispatch = useAppDispatch();
  
  const { getSetting, submitPreferences } = useEpubNavigator();
  
  const updatePreference = useCallback(async (value: boolean) => {
    await submitPreferences({ 
      hyphens: value 
    });
  
    dispatch(setHyphens(getSetting("hyphens")));
  }, [submitPreferences, getSetting, dispatch]);

  return(
    <>
    <SwitchWrapper 
      { ...(standalone ? { 
        className: settingsStyles.readerSettingsGroup, 
        heading: Locale.reader.settings.hyphens.title 
      } : {}) }
      label={ Locale.reader.settings.hyphens.label }
      onChangeCallback={ async (isSelected: boolean) => await updatePreference(isSelected) }
      isSelected={ hyphens ?? false }
      isDisabled={ textAlign === ReadingDisplayAlignOptions.publisher }
    />
    </>
  )
}