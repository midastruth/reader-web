"use client";

import audioStyles from "./assets/styles/thorium-web.audioControls.module.css";

import { ThActionsBar } from "@/core/Components/Actions/ThActionsBar";
import { usePlugins } from "@/components/Plugins/PluginProvider";

import { useI18n } from "@/i18n/useI18n";
import { useAppSelector } from "@/lib";
import { usePreferences } from "@/preferences/hooks/usePreferences";

export const StatefulAudioMediaControls = () => {
  const { t } = useI18n();
  const { preferences } = usePreferences();
  const { primaryAudioActionsMap } = usePlugins();
  const isTrackReady = useAppSelector(state => state.player.isTrackReady);
  const isStalled = useAppSelector(state => state.player.isStalled);
  const isDisabled = !isTrackReady || isStalled;

  const displayOrder = preferences.actions.audio.primary.displayOrder;

  return (
    <ThActionsBar className={ audioStyles.audioMediaControls } aria-label={ t("audio.player.mediaControls") }>
      { displayOrder.map(key => {
        const Component = primaryAudioActionsMap[key];
        if (!Component) return null;
        return <Component key={ key } isDisabled={ isDisabled } />;
      }) }
    </ThActionsBar>
  );
};
