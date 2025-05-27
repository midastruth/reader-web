import { useCallback, useRef } from "react";

import { RSPrefs } from "@/preferences";

import Locale from "../../resources/locales/en.json";

import settingsStyles from "../assets/styles/readerSettings.module.css";

import { defaultLineHeights, IAdvancedDisplayProps } from "@/models/settings";
import { ReadingDisplayLineHeightOptions } from "@/models/layout";

import { SwitchWrapper } from "./Wrappers/SwitchWrapper";

import { useEpubNavigator } from "@/hooks/useEpubNavigator";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setPublisherStyles } from "@/lib/settingsReducer";

export const ReadingDisplayPublisherStyles: React.FC<IAdvancedDisplayProps> = ({ standalone = true }) => {
  const publisherStyles = useAppSelector(state => state.settings.publisherStyles);

  const lineHeight = useAppSelector(state => state.settings.lineHeight);
  const paragraphIndent = useAppSelector(state => state.settings.paragraphIndent);
  const paragraphSpacing = useAppSelector(state => state.settings.paragraphSpacing);
  const letterSpacing = useAppSelector(state => state.settings.letterSpacing);
  const wordSpacing = useAppSelector(state => state.settings.wordSpacing);

  const dispatch = useAppDispatch();

  const lineHeightOptions = useRef({
    [ReadingDisplayLineHeightOptions.publisher]: null,
    [ReadingDisplayLineHeightOptions.small]: RSPrefs.settings.spacing?.lineHeight?.[ReadingDisplayLineHeightOptions.small] || defaultLineHeights[ReadingDisplayLineHeightOptions.small],
    [ReadingDisplayLineHeightOptions.medium]: RSPrefs.settings.spacing?.lineHeight?.[ReadingDisplayLineHeightOptions.medium] || defaultLineHeights[ReadingDisplayLineHeightOptions.medium],
    [ReadingDisplayLineHeightOptions.large]: RSPrefs.settings.spacing?.lineHeight?.[ReadingDisplayLineHeightOptions.large] || defaultLineHeights[ReadingDisplayLineHeightOptions.large],
  });

  const { submitPreferences } = useEpubNavigator();

  const updatePreference = useCallback(async (isSelected: boolean) => {
    const values = isSelected ? 
    {
      lineHeight: null,
      paragraphIndent: null,
      paragraphSpacing: null,
      letterSpacing: null,
      wordSpacing: null
    } : 
    {
      lineHeight: lineHeight === ReadingDisplayLineHeightOptions.publisher 
        ? null 
        : lineHeightOptions.current[lineHeight as keyof typeof ReadingDisplayLineHeightOptions],
      paragraphIndent: paragraphIndent || 0,
      paragraphSpacing: paragraphSpacing || 0,
      letterSpacing: letterSpacing || 0,
      wordSpacing: wordSpacing || 0
    };
    await submitPreferences(values);

    dispatch(setPublisherStyles(isSelected ? true : false));
  }, [submitPreferences, dispatch, lineHeight, paragraphIndent, paragraphSpacing, letterSpacing, wordSpacing]);

  return(
    <>
    <SwitchWrapper 
      { ...(standalone ? { 
        className: settingsStyles.readerSettingsGroup
      } : {}) }
      label={ Locale.reader.settings.publisherStyles.label }
      onChangeCallback={ async (isSelected: boolean) => await updatePreference(isSelected) }
      isSelected={ publisherStyles }
    />
    </>
  )
}