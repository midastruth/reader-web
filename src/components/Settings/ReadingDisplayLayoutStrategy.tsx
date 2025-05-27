import { useCallback, useEffect } from "react";

import Locale from "../../resources/locales/en.json";

import { RSLayoutStrategy } from "@/models/layout";
import { LayoutStrategy } from "@readium/navigator";

import settingsStyles from "../assets/styles/readerSettings.module.css";

import FitIcon from "../assets/icons/fit_width.svg";
import RangeIcon from "../assets/icons/arrow_range.svg";
import AddColumnIcon from "../assets/icons/add_column_right.svg";

import { Label, Radio, RadioGroup } from "react-aria-components";
import { ReadingDisplayLineLengths } from "./ReadingDisplayLineLengths";

import { useEpubNavigator } from "@/hooks/useEpubNavigator";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setLayoutStrategy } from "@/lib/settingsReducer";

export const ReadingDisplayLayoutStrategy = () => {
  const layoutStrategy = useAppSelector(state => state.settings.layoutStrategy);
  const isScroll = useAppSelector(state => state.settings.scroll);
  const columnCount = useAppSelector(state => state.settings.columnCount);
  const dispatch = useAppDispatch();

  const { getSetting, submitPreferences } = useEpubNavigator();

  const updatePreference = useCallback(async (value: string) => {
    await submitPreferences({ layoutStrategy: value as unknown as LayoutStrategy });

    dispatch(setLayoutStrategy(getSetting("layoutStrategy")));
  }, [submitPreferences, getSetting, dispatch]);

  useEffect(() => {
    const updateIfNeeded = async () => {
      if (columnCount !== "auto" && layoutStrategy === RSLayoutStrategy.columns) {
        await updatePreference(RSLayoutStrategy.lineLength);
      }
    };
    updateIfNeeded();
  }, [columnCount, layoutStrategy, updatePreference]);

  return(
    <>
    <RadioGroup 
      orientation="horizontal" 
      value={ layoutStrategy } 
      onChange={ async (val: string) => await updatePreference(val) } 
      className={ settingsStyles.readerSettingsGroup }
    >
      <Label className={ settingsStyles.readerSettingsLabel }>{ Locale.reader.layoutStrategy.title }</Label>
      <div className={ settingsStyles.readerSettingsRadioWrapper }>
        <Radio 
          className={ settingsStyles.readerSettingsRadio } 
          value={ RSLayoutStrategy.margin } 
          id={ RSLayoutStrategy.margin } 
        >
          <FitIcon aria-hidden="true" focusable="false" />
          <span>{ Locale.reader.layoutStrategy.margin }</span>
        </Radio>
        <Radio 
          className={ settingsStyles.readerSettingsRadio } 
          value={ RSLayoutStrategy.lineLength } 
          id={ RSLayoutStrategy.lineLength } 
        >
          <RangeIcon aria-hidden="true" focusable="false" />
          <span>{ Locale.reader.layoutStrategy.lineLength }</span>
        </Radio>
        <Radio 
          className={ settingsStyles.readerSettingsRadio } 
          value={ RSLayoutStrategy.columns } 
          id={ RSLayoutStrategy.columns } 
          isDisabled={ isScroll || columnCount !== "auto" } 
        >
          <AddColumnIcon aria-hidden="true" focusable="false" />
          <span>{ Locale.reader.layoutStrategy.columns }</span>
        </Radio>
      </div>
    </RadioGroup>
    <ReadingDisplayLineLengths />
    </>
  )
}