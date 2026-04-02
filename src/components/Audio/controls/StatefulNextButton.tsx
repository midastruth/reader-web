"use client";

import SkipNextIcon from "./assets/icons/skip_next.svg";

import { StatefulActionIcon } from "../../Actions/Triggers/StatefulActionIcon";
import audioStyles from "./assets/styles/thorium-web.audioPlayback.module.css";

import { useNavigator } from "@/core/Navigator";
import { useAppSelector } from "@/lib/hooks";
import { useI18n } from "@/i18n/useI18n";
import { useAudioPreferences } from "@/preferences";
import { ThAudioAffordance } from "@/preferences/audioPreferences";
import { Link } from "@readium/shared";

export const StatefulNextButton = ({ isDisabled }: { isDisabled?: boolean }) => {
  const { t } = useI18n();
  const { preferences } = useAudioPreferences();
  const { goForward, goLink } = useNavigator().media;
  const atEnd = useAppSelector(state => state.publication.atPublicationEnd);
  const nextItem = useAppSelector(state => state.publication.adjacentTimelineItems.next);

  const isTimeline = preferences.affordances.next === ThAudioAffordance.timeline;
  const label = isTimeline && nextItem?.title
    ? nextItem.title
    : t("reader.actions.goToNextResource.descriptive");

  const handlePress = () => isTimeline
    ? nextItem && goLink(new Link({ href: nextItem.href }), false, () => {})
    : goForward(false, () => {});

  return (
    <StatefulActionIcon
      onPress={ handlePress }
      isDisabled={ isDisabled || (isTimeline ? !nextItem : atEnd) }
      aria-label={ label }
      tooltipLabel={ label }
      className={ audioStyles.audioNextButton }
    >
      <SkipNextIcon aria-hidden="true" focusable="false" />
    </StatefulActionIcon>
  );
};
