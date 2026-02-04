"use client";

import { useContext } from "react";
import { ThPreferencesContext } from "../ThPreferencesContext";
import { CustomizableKeys, DefaultKeys, ThPreferences } from "../preferences";
import { createFontService } from "../services/fonts";

export function usePreferences<K extends CustomizableKeys = DefaultKeys>() {
  const context = useContext(ThPreferencesContext);
  
  if (!context) {
    throw new Error("usePreferences must be used within a ThPreferencesProvider");
  }
  
  const fontService = createFontService(context.preferences.settings.fontFamily.fonts);
  
  return {
    preferences: context.preferences as ThPreferences<K>,
    updatePreferences: context.updatePreferences as (prefs: ThPreferences<K>) => void,
    
    getFontInjectables: fontService.getInjectables,
    
    // Get metadata for a specific font
    getFontMetadata: fontService.getFontMetadata
  };
}