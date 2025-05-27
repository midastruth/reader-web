import React, { useCallback, useRef } from "react";

import { RSPrefs } from "@/preferences";

import Locale from "../../resources/locales/en.json";

import { ReadingDisplayLineHeightOptions } from "@/models/layout";
import { defaultLineHeights, IAdvancedDisplayProps } from "@/models/settings";

import settingsStyles from "../assets/styles/readerSettings.module.css";

import BookIcon from "../assets/icons/book.svg";
import SmallIcon from "../assets/icons/density_small.svg";
import MediumIcon from "../assets/icons/density_medium.svg";
import LargeIcon from "../assets/icons/density_large.svg";

import { RadioGroup, Radio, Label } from "react-aria-components";

import { useEpubNavigator } from "@/hooks/useEpubNavigator";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setLineHeight, setPublisherStyles } from "@/lib/settingsReducer";

export const ReadingDisplayLineHeight: React.FC<IAdvancedDisplayProps> = ({ standalone = true }) => {
  const publisherStyles = useAppSelector(state => state.settings.publisherStyles);
  const lineHeight = useAppSelector(state => state.settings.lineHeight);
  const dispatch = useAppDispatch();

  const { getSetting, submitPreferences } = useEpubNavigator();

  const lineHeightOptions = useRef({
    [ReadingDisplayLineHeightOptions.publisher]: null,
    [ReadingDisplayLineHeightOptions.small]: RSPrefs.settings.spacing?.lineHeight?.[ReadingDisplayLineHeightOptions.small] || defaultLineHeights[ReadingDisplayLineHeightOptions.small],
    [ReadingDisplayLineHeightOptions.medium]: RSPrefs.settings.spacing?.lineHeight?.[ReadingDisplayLineHeightOptions.medium] || defaultLineHeights[ReadingDisplayLineHeightOptions.medium],
    [ReadingDisplayLineHeightOptions.large]: RSPrefs.settings.spacing?.lineHeight?.[ReadingDisplayLineHeightOptions.large] || defaultLineHeights[ReadingDisplayLineHeightOptions.large],
  });

  const updatePreference = useCallback(async (value: string) => {
    const computedValue = value === ReadingDisplayLineHeightOptions.publisher
      ? null 
      : lineHeightOptions.current[value as keyof typeof ReadingDisplayLineHeightOptions];
    
    await submitPreferences({
      lineHeight: computedValue
    });

    const currentLineHeight = getSetting("lineHeight");
    const currentDisplayLineHeightOption = Object.entries(lineHeightOptions.current).find(([key, value]) => value === currentLineHeight)?.[0] as ReadingDisplayLineHeightOptions;

    dispatch(setLineHeight(currentDisplayLineHeightOption));
    dispatch(setPublisherStyles(false));
  }, [submitPreferences, getSetting, dispatch]);

  return (
    <>
     <RadioGroup 
      { ...(standalone ? { className: settingsStyles.readerSettingsGroup } : {}) }
      { ...(!standalone ? { "aria-label": Locale.reader.settings.fontFamily.title } : {}) }
      orientation="horizontal" 
      value={ publisherStyles ? ReadingDisplayLineHeightOptions.publisher : lineHeight } 
      onChange={ async (val: string) => await updatePreference(val) }
    >
      { standalone && <Label className={ settingsStyles.readerSettingsLabel }>
         { Locale.reader.settings.lineHeight.title }
        </Label>
      }
      <div className={ settingsStyles.readerSettingsRadioWrapper }>
      <Radio 
          className={ settingsStyles.readerSettingsRadio } 
          value={ ReadingDisplayLineHeightOptions.publisher } 
        >
          <BookIcon aria-hidden="true" focusable="false" />
          <span>{ Locale.reader.settings.lineHeight.publisher }</span>
        </Radio>
        <Radio 
          className={ settingsStyles.readerSettingsRadio } 
          value={ ReadingDisplayLineHeightOptions.small } 
        >
          <SmallIcon aria-hidden="true" focusable="false" />
          <span>{ Locale.reader.settings.lineHeight.small }</span>
        </Radio>
        <Radio 
          className={ settingsStyles.readerSettingsRadio } 
          value={ ReadingDisplayLineHeightOptions.medium } 
        >
          <MediumIcon aria-hidden="true" focusable="false" />
          <span>{ Locale.reader.settings.lineHeight.medium }</span>
        </Radio>
        <Radio 
          className={ settingsStyles.readerSettingsRadio } 
          value={ ReadingDisplayLineHeightOptions.large }
        >
          <LargeIcon aria-hidden="true" focusable="false" />
          <span>{ Locale.reader.settings.lineHeight.large }</span>
        </Radio>
      </div>
    </RadioGroup>
    </>
  );
}