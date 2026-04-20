"use client";

import { useCallback } from "react";

import { ThTextSettingsKeys, ThSettingsKeys } from "@/preferences/models";
import { SETTINGS_KEY_TO_PREFERENCE } from "@/preferences/helpers/settingsKeyMapping";

import { StatefulSettingsItemProps } from "../models/settings";

import { StatefulSwitch } from "../StatefulSwitch";

import { useNavigator } from "@/core/Navigator";
import { useI18n } from "@/i18n/useI18n";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setNoRuby } from "@/lib/settingsReducer";
import { setWebPubNoRuby } from "@/lib/webPubSettingsReducer";

export const StatefulNoRuby = ({ standalone = true }: StatefulSettingsItemProps) => {
  const { t } = useI18n();

  const profile = useAppSelector(state => state.reader.profile);
  const isWebPub = profile === "webPub";

  const noRuby = useAppSelector(state => isWebPub ? state.webPubSettings.noRuby : state.settings.noRuby) ?? false;
  const dispatch = useAppDispatch();

  const { getSetting, submitPreferences } = useNavigator().visual;

  const updatePreference = useCallback(async (value: boolean) => {
    const prefKey = SETTINGS_KEY_TO_PREFERENCE[ThSettingsKeys.noRuby] as "noRuby";
    await submitPreferences({ [prefKey]: value });
    const effectiveSetting = getSetting(prefKey);

    if (isWebPub) {
      dispatch(setWebPubNoRuby(effectiveSetting));
    } else {
      dispatch(setNoRuby(effectiveSetting));
    }
  }, [isWebPub, submitPreferences, getSetting, dispatch]);

  return(
    <>
    <StatefulSwitch
      standalone={ standalone }
      heading={ t("reader.preferences.noRuby.title") }
      label={ t("reader.preferences.noRuby.label") }
      onChange={ async (isSelected: boolean) => await updatePreference(isSelected) }
      isSelected={ noRuby ?? false }
    />
    </>
  )
}
