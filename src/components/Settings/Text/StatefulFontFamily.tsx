"use client";

import { CSSProperties, Key, useCallback, useRef } from "react";

import { StatefulSettingsItemProps } from "../models/settings";

import settingsStyles from "../assets/styles/thorium-web.reader.settings.module.css";

import { StatefulDropdown } from "../StatefulDropdown";
import { ListBox, ListBoxItem } from "react-aria-components";

import { useNavigator } from "@/core/Navigator";
import { useI18n } from "@/i18n/useI18n";
import { usePreferences } from "@/preferences/hooks/usePreferences";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setFontFamily } from "@/lib/settingsReducer";
import { setWebPubFontFamily } from "@/lib/webPubSettingsReducer";

// Map of which properties have direct strings vs descriptive labels
const fontFamilyLabelMap = {
  publisher: "direct",
  oldStyle: "descriptive",
  modern: "descriptive", 
  sans: "direct",
  humanist: "descriptive",
  monospace: "direct"
} as const;

export const StatefulFontFamily = ({ standalone = true }: StatefulSettingsItemProps) => {
  const { preferences, getFontMetadata } = usePreferences();
  const { t } = useI18n();

  const getFontFamilyLabel = useCallback((property: keyof typeof fontFamilyLabelMap) => {
    const config = fontFamilyLabelMap[property];
    const labelPath = `reader.preferences.fontFamily.${ property }`;
    
    if (config === "direct") {
      return t(labelPath);
    } else {
      return t(`${ labelPath }.${ config }`);
    }
  }, [t]);

  const profile = useAppSelector(state => state.reader.profile);
  const isWebPub = profile === "webPub";

  const fontFamily = useAppSelector(state => isWebPub ? state.webPubSettings.fontFamily : state.settings.fontFamily) ?? "publisher";
  
  const fontFamilyOptions = useRef([
    {
      id: "publisher",
      label: getFontFamilyLabel("publisher" as keyof typeof fontFamilyLabelMap),
      value: null
    },
    ...Object.entries(preferences.settings.fontFamily.fonts).map(([id, font]) => {
      const metadata = getFontMetadata(id);
      return {
        id,
        label: getFontFamilyLabel(id as keyof typeof fontFamilyLabelMap),
        value: metadata.fontStack || metadata.fontFamily
      };
    })
  ]);
  
  const dispatch = useAppDispatch();

  const { getSetting, submitPreferences } = useNavigator();

  const updatePreference = useCallback(async (key: Key | null) => {
    if (!key || key === fontFamily) return;

    const selectedOption = fontFamilyOptions.current.find((option) => option.id === key) as {
      id: keyof ReturnType<typeof getFontPreferences> | "publisher";
      label: string;
      value: string | null;
    };
    
    if (selectedOption) {
      await submitPreferences({ fontFamily: selectedOption.value });
      
      const currentSetting = getSetting("fontFamily");
      const fontPreferences = getFontPreferences();
      const entry = Object.entries(fontPreferences).find(([id]) => {
        const metadata = getFontMetadata(id);
        return metadata.fontStack === currentSetting || 
               metadata.fontFamily === currentSetting;
      });
      
      if (entry) {
        const [selectedOptionId] = entry;
        if (isWebPub) {
          dispatch(setWebPubFontFamily(selectedOptionId));
        } else {
          dispatch(setFontFamily(selectedOptionId));
        }
      }
    }
  }, [isWebPub, fontFamily, submitPreferences, getSetting, getFontPreferences, getFontMetadata, dispatch]);

  return (
    <StatefulDropdown
      standalone={ standalone }
      label={ t("reader.preferences.fontFamily.title") }
      selectedKey={ fontFamily }
      onSelectionChange={ async (key) => await updatePreference(key) }
      compounds={ {
        listbox: (
          <ListBox
            className={ settingsStyles.dropdownListbox }
            items={ fontFamilyOptions.current }
          >
            { (item) => (
              <ListBoxItem
                className={ settingsStyles.dropdownListboxItem }
                id={ item.id }
                key={ item.id }
                textValue={ item.value || undefined }
                style={{ fontFamily: item.value || undefined } as CSSProperties}
              >
                { item.label }
              </ListBoxItem>
            )}
          </ListBox>
        )
      }}
    />
  )
}