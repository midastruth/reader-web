"use client";

import { useRef, useMemo } from "react";
import { ThLayoutUI, ThTextAlignOptions, ThLineHeightOptions } from "@/preferences/models";
import { ThColorScheme } from "@/core/Hooks/useColorScheme";
import { LineLengthStateObject, FontFamilyStateObject } from "@/lib/settingsReducer";
import { Locator } from "@readium/shared";

export interface ReadiumCSSSettings {
  columnCount: string;
  fontFamily: FontFamilyStateObject;
  fontSize: number;
  fontWeight: number;
  hyphens: boolean | null;
  letterSpacing: number | null;
  lineLength: LineLengthStateObject | null;
  lineHeight: ThLineHeightOptions | null;
  paragraphIndent: number | null;
  paragraphSpacing: number | null;
  publisherStyles: boolean;
  scroll: boolean;
  textAlign: ThTextAlignOptions | null;
  textNormalization: boolean;
  theme?: string;
  wordSpacing: number | null;
}

export interface EPubSettingsCache {
  settings: ReadiumCSSSettings;
  positionsList: Locator[];
}

export const useEpubSettingsCache = (
  textAlign: ThTextAlignOptions | null,
  columnCount: string,
  fontFamily: FontFamilyStateObject,
  fontSize: number,
  fontWeight: number,
  hyphens: boolean | null,
  letterSpacing: number | null,
  lineLength: LineLengthStateObject | null,
  lineHeight: ThLineHeightOptions | null,
  paragraphIndent: number | null,
  paragraphSpacing: number | null,
  publisherStyles: boolean,
  scroll: boolean,
  textNormalization: boolean,
  wordSpacing: number | null,
  theme: string | undefined,
  positionsList: Locator[]
) => {
  const cache = useRef<EPubSettingsCache>({
    settings: {
      columnCount,
      fontFamily,
      fontSize,
      fontWeight,
      hyphens,
      letterSpacing,
      lineHeight,
      lineLength,
      paragraphIndent,
      paragraphSpacing,
      publisherStyles,
      scroll: scroll,
      textAlign,
      textNormalization,
      theme,
      wordSpacing,
    },
    positionsList: positionsList || [],
  });

  const memoizedCache = useMemo(() => ({
    settings: {
      columnCount,
      fontFamily,
      fontSize,
      fontWeight,
      hyphens,
      letterSpacing,
      lineHeight,
      lineLength,
      paragraphIndent,
      paragraphSpacing,
      publisherStyles,
      scroll: scroll,
      textAlign,
      textNormalization,
      theme,
      wordSpacing,
    },
    positionsList: positionsList || [],
  }), [
    columnCount,
    fontFamily,
    fontSize,
    fontWeight,
    hyphens,
    letterSpacing,
    lineHeight,
    lineLength,
    paragraphIndent,
    paragraphSpacing,
    publisherStyles,
    scroll,
    textAlign,
    textNormalization,
    theme,
    wordSpacing,
    positionsList,
  ]);

  // Update synchronously to match original behavior
  cache.current = memoizedCache;

  return cache;
};
