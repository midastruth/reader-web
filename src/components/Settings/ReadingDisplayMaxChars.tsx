import { useCallback } from "react";

import { RSPrefs } from "@/preferences";

import Locale from "../../resources/locales/en.json";

import { RSLayoutStrategy } from "@/models/layout";

import settingsStyles from "../assets/styles/readerSettings.module.css";

import { SwitchWrapper } from "./Wrappers/SwitchWrapper";

import { useEpubNavigator } from "@/hooks/useEpubNavigator";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setTmpMaxChars } from "@/lib/settingsReducer";

// TMP Component that is not meant to be implemented AS-IS, for testing purposes
export const ReadingDisplayMaxChars = () => {
  const layoutStrategy = useAppSelector(state => state.settings.layoutStrategy);
  const lineLength = useAppSelector(state => state.settings.tmpLineLengths[2]);
  const maxChars = useAppSelector(state => state.settings.tmpMaxChars);
  const dispatch = useAppDispatch();
  
  const { submitPreferences } = useEpubNavigator();

  const updatePreference = useCallback(async (value: number | null | undefined) => {
    await submitPreferences({ 
      maximalLineLength: value
    });
  
    dispatch(setTmpMaxChars(value === null));
  }, [submitPreferences, dispatch]);

  return(
    <>
    { RSPrefs.typography.maximalLineLength &&
      <div className={ settingsStyles.readerSettingsGroup }>
        <SwitchWrapper 
          label={ Locale.reader.layoutStrategy.maxChars }
          onChangeCallback={ async (isSelected: boolean) => await updatePreference(isSelected ? null : lineLength || RSPrefs.typography.maximalLineLength) }
          isSelected={ maxChars }
          isDisabled={ layoutStrategy !== RSLayoutStrategy.lineLength }
        />
      </div>
    }
    </>
  )
}