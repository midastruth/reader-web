import { useCallback } from "react";

import { RSPrefs } from "@/preferences";

import { RSLayoutStrategy } from "@/models/layout";

import Locale from "../../resources/locales/en.json";

import { IAdvancedDisplayProps } from "@/models/settings";

import settingsStyles from "../assets/styles/readerSettings.module.css";

import { NumberFieldWrapper } from "./Wrappers/NumberFieldWrapper";

import { ReadingDisplayMaxChars } from "./ReadingDisplayMaxChars";
import { ReadingDisplayMinChars } from "./ReadingDisplayMinChars";

import { useEpubNavigator } from "@/hooks/useEpubNavigator";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setTmpLineLengths, setTmpMaxChars, setTmpMinChars } from "@/lib/settingsReducer";

// TMP Component that is not meant to be implemented AS-IS, for testing purposes
export const ReadingDisplayLineLengths: React.FC<IAdvancedDisplayProps> = ({ standalone = true }) => {
  const columnCount = useAppSelector(state => state.settings.columnCount);
  const layoutStrategy = useAppSelector(state => state.settings.layoutStrategy);
  const tmpLineLengths = useAppSelector(state => state.settings.tmpLineLengths);
  const min = tmpLineLengths[0];
  const optimal = tmpLineLengths[1];
  const max = tmpLineLengths[2];

  const dispatch = useAppDispatch();

  const { 
    getSetting,
    submitPreferences,
    preferencesEditor
  } = useEpubNavigator();

  const lineLengthRangeConfig = {
    range: preferencesEditor?.lineLength.supportedRange || [20, 100],
    step: preferencesEditor?.lineLength.step || 1
  }

  const updatePreference = useCallback(async (type: "min" | "optimal" | "max", value: number) => {
    switch(type) {
      case "min":
        await submitPreferences({
          minimalLineLength: value, 
          optimalLineLength: optimal, 
          maximalLineLength: max
        });
        dispatch(setTmpMinChars(false));
        break;
      case "optimal":
        await submitPreferences({
          minimalLineLength: min, 
          optimalLineLength: value, 
          maximalLineLength: max
        });
        break;
      case "max":
        await submitPreferences({
          minimalLineLength: min, 
          optimalLineLength: optimal, 
          maximalLineLength: value
        });
        dispatch(setTmpMaxChars(false));
        break;
      default:
        break;
    }
    const appliedValues = [
      getSetting("minimalLineLength"),
      getSetting("optimalLineLength"),
      getSetting("maximalLineLength")
    ];
    dispatch(setTmpLineLengths(appliedValues));
  }, [submitPreferences, getSetting, min, optimal, max, dispatch]);

  return(
    <>
    <NumberFieldWrapper
      standalone={ standalone }
      { ...(standalone ? { className: settingsStyles.readerSettingsGroup } : {}) }
      defaultValue={ getSetting("minimalLineLength") ?? lineLengthRangeConfig.range[0] }
      value={ tmpLineLengths[0] } 
      onChangeCallback={ async(value) => await updatePreference("min", value) } 
      label={ Locale.reader.layoutStrategy.minimalLineLength.title }
      steppers={{
        decrementLabel: Locale.reader.layoutStrategy.minimalLineLength.decrease,
        incrementLabel: Locale.reader.layoutStrategy.minimalLineLength.increase
      }}
      range={ [lineLengthRangeConfig.range[0], optimal || RSPrefs.typography.optimalLineLength] }
      step={ lineLengthRangeConfig.step }
      isDisabled={ layoutStrategy !== RSLayoutStrategy.columns && columnCount !== "2" }
    /> 
    <ReadingDisplayMinChars />

    <NumberFieldWrapper
      standalone={ standalone }
      { ...(standalone ? { className: settingsStyles.readerSettingsGroup } : {}) }
      defaultValue={ getSetting("optimalLineLength") } 
      value={ tmpLineLengths[1] } 
      onChangeCallback={ async(value) => await updatePreference("optimal", value) } 
      label={ Locale.reader.layoutStrategy.optimalLineLength.title }
      steppers={{
        decrementLabel: Locale.reader.layoutStrategy.optimalLineLength.decrease,
        incrementLabel: Locale.reader.layoutStrategy.optimalLineLength.increase
      }}
      range={ lineLengthRangeConfig.range }
      step={ lineLengthRangeConfig.step }
    /> 
    
    <NumberFieldWrapper
      standalone={ standalone }
      { ...(standalone ? { className: settingsStyles.readerSettingsGroup } : {}) }
      defaultValue={ getSetting("maximalLineLength") || lineLengthRangeConfig.range[1] } 
      value={ tmpLineLengths[2] } 
      onChangeCallback={ async(value) => await updatePreference("max", value) }
      label={ Locale.reader.layoutStrategy.maximalLineLength.title }
      steppers={{
        decrementLabel: Locale.reader.layoutStrategy.maximalLineLength.decrease,
        incrementLabel: Locale.reader.layoutStrategy.maximalLineLength.increase
      }}
      range={ [optimal || RSPrefs.typography.optimalLineLength, lineLengthRangeConfig.range[1]] }
      step={ lineLengthRangeConfig.step }
      isDisabled={ layoutStrategy !== RSLayoutStrategy.lineLength }
    /> 
    <ReadingDisplayMaxChars />
    </>
  )
}