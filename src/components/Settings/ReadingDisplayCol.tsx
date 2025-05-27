import React, { useCallback } from "react";

import Locale from "../../resources/locales/en.json";

import settingsStyles from "../assets/styles/readerSettings.module.css";

import AutoLayoutIcon from "../assets/icons/document_scanner.svg";
import OneColIcon from "../assets/icons/article.svg";
import TwoColsIcon from "../assets/icons/menu_book.svg";

import { RadioGroup, Radio, Label } from "react-aria-components";

import { useEpubNavigator } from "@/hooks/useEpubNavigator";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setColumnCount } from "@/lib/settingsReducer";

export const ReadingDisplayCol = () => {
  const isScroll = useAppSelector(state => state.settings.scroll);
  const isFXL = useAppSelector(state => state.publication.isFXL);
  const columnCount = useAppSelector(state => state.settings.columnCount) || "auto";
  const dispatch = useAppDispatch();

  const { submitPreferences } = useEpubNavigator();

  const updatePreference = useCallback(async (value: string) => {
    const colCount = value === "auto" ? null : Number(value);

    await submitPreferences({ columnCount: colCount });
    
    // TODO: See how best to handle this for 2 -> 1 column if minimal null
    dispatch(setColumnCount(value));
  }, [submitPreferences, dispatch]);

  return (
    <>
    <RadioGroup 
      orientation="horizontal" 
      value={ columnCount } 
      onChange={ async (val: string) => await updatePreference(val) }
      className={ settingsStyles.readerSettingsGroup }
      isDisabled={ isScroll && !isFXL }
    >
      <Label className={ settingsStyles.readerSettingsLabel }>{ Locale.reader.settings.column.title }</Label>
      <div className={ settingsStyles.readerSettingsRadioWrapper }>
        <Radio 
          className={ settingsStyles.readerSettingsRadio } 
          value="auto" 
        >
          <AutoLayoutIcon aria-hidden="true" focusable="false" />
          <span>{ Locale.reader.settings.column.auto }</span>
        </Radio>
        <Radio 
          className={ settingsStyles.readerSettingsRadio } 
          value="1" 
        >
          <OneColIcon aria-hidden="true" focusable="false" />
          <span>{ Locale.reader.settings.column.one }</span>
        </Radio>
        <Radio 
          className={ settingsStyles.readerSettingsRadio } 
          value="2" 
        >
          <TwoColsIcon aria-hidden="true" focusable="false" />
          <span>{ Locale.reader.settings.column.two }</span>
        </Radio>
      </div>
    </RadioGroup>
    </>
  );
}