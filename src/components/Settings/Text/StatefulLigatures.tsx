"use client";

import { useCallback } from "react";

import { ThTextSettingsKeys, ThSettingsKeys } from "@/preferences/models";
import { SETTINGS_KEY_TO_PREFERENCE } from "@/preferences/helpers/settingsKeyMapping";

import { StatefulSettingsItemProps } from "../models/settings";

import { StatefulSwitch } from "../StatefulSwitch";

import { useNavigator } from "@/core/Navigator";
import { useI18n } from "@/i18n/useI18n";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setLigatures } from "@/lib/settingsReducer";
import { setWebPubLigatures } from "@/lib/webPubSettingsReducer";

export const StatefulLigatures = ({ standalone = true }: StatefulSettingsItemProps) => {
  const { t } = useI18n();

  const profile = useAppSelector(state => state.reader.profile);
  const isWebPub = profile === "webPub";

  const ligatures = useAppSelector(state => isWebPub ? state.webPubSettings.ligatures : state.settings.ligatures) ?? true;
  const dispatch = useAppDispatch();

  const { getSetting, submitPreferences } = useNavigator().visual;

  const updatePreference = useCallback(async (value: boolean) => {
    const prefKey = SETTINGS_KEY_TO_PREFERENCE[ThSettingsKeys.ligatures] as "ligatures";
    await submitPreferences({ [prefKey]: value });
    const effectiveSetting = getSetting(prefKey);

    if (isWebPub) {
      dispatch(setWebPubLigatures(effectiveSetting));
    } else {
      dispatch(setLigatures(effectiveSetting));
    }
  }, [isWebPub, submitPreferences, getSetting, dispatch]);

  return(
    <>
    <StatefulSwitch
      standalone={ standalone }
      heading={ t("reader.preferences.ligatures.title") }
      label={ t("reader.preferences.ligatures.label") }
      onChange={ async (isSelected: boolean) => await updatePreference(isSelected) }
      isSelected={ ligatures ?? true }
    />
    </>
  )
}
