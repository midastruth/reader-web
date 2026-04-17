import { ThSettingsKeys } from "@/preferences/models";

/**
 * Mapping from settings keys to their corresponding preference property names
 * This mapping is derived from the actual settings components
 */
export const SETTINGS_KEY_TO_PREFERENCE: Record<ThSettingsKeys, string> = {
  [ThSettingsKeys.columns]: "columnCount",
  [ThSettingsKeys.fontFamily]: "fontFamily",
  [ThSettingsKeys.fontWeight]: "fontWeight",
  [ThSettingsKeys.hyphens]: "hyphens",
  [ThSettingsKeys.layout]: "scroll",
  [ThSettingsKeys.letterSpacing]: "letterSpacing",
  [ThSettingsKeys.ligatures]: "ligatures",
  [ThSettingsKeys.lineHeight]: "lineHeight",
  [ThSettingsKeys.paragraphIndent]: "paragraphIndent",
  [ThSettingsKeys.paragraphSpacing]: "paragraphSpacing",
  [ThSettingsKeys.publisherStyles]: "publisherStyles",
  [ThSettingsKeys.spacingGroup]: "spacingGroup",
  [ThSettingsKeys.spacingPresets]: "spacingPresets",
  [ThSettingsKeys.textAlign]: "textAlign",
  [ThSettingsKeys.textGroup]: "textGroup",
  [ThSettingsKeys.textNormalize]: "textNormalization",
  [ThSettingsKeys.noRuby]: "noRuby",
  [ThSettingsKeys.theme]: "theme",
  [ThSettingsKeys.wordSpacing]: "wordSpacing",
  [ThSettingsKeys.zoom]: "zoom",
};
