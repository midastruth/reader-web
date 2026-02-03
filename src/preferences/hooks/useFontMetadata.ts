"use client";

import { useCallback, useContext } from "react";
import { ThPreferencesContext } from "../ThPreferencesContext";
import { getFontMetadata, FontMetadata } from "../utils/fontService";

export const useFontMetadata = () => {
  const context = useContext(ThPreferencesContext);
  
  if (!context) {
    throw new Error("useFontMetadata must be used within a ThPreferencesProvider");
  }
  
  const fonts = context.preferences.settings.fontFamily.fonts;

  return useCallback((fontId: string): FontMetadata => {
    return getFontMetadata(fontId, fonts);
  }, [fonts]);
};
