"use client";

import React, { useCallback, useState } from "react";

import audioStyles from "./assets/styles/thorium-web.audioProgressBar.module.css";

import { ThAudioProgress } from "@/core/Components/Audio/ThAudioProgress";

import { useNavigator } from "@/core/Navigator";
import { useAppSelector } from "@/lib";
import { useI18n } from "@/i18n/useI18n";

export const StatefulAudioProgressBar = () => {
  const { t } = useI18n();

  const tocEntry = useAppSelector(state => state.publication.unstableTimeline?.toc?.currentEntry);
  const currentChapter = tocEntry?.title;

  const isStalled = useAppSelector(state => state.player.isStalled);
  const isTrackReady = useAppSelector(state => state.player.isTrackReady);
  const seekableRanges = useAppSelector(state => state.player.seekableRanges);

  const { currentTime, duration, seek, currentLocator, timeline } = useNavigator().media;

  const current = currentTime();
  const total = duration();

  const [hoverLabel, setHoverLabel] = useState<string | undefined>(undefined);

  const handleSeek = useCallback((time: number) => {
    seek(time);
  }, [seek]);

  const handleHoverProgression = useCallback((progression: number | null) => {
    if (progression === null) {
      setHoverLabel(undefined);
      return;
    }
    const locator = currentLocator();
    const tl = timeline();
    if (!locator || !tl) return;
    const item = tl.itemAtProgression(locator.href, progression, total);
    setHoverLabel(item?.title);
  }, [currentLocator, timeline, total]);

  return (
    <ThAudioProgress
      currentTime={ current }
      duration={ total }
      onSeek={ handleSeek }
      currentChapter={ currentChapter || "​" } // Zero-width space to prevent shift
      isDisabled={ !isTrackReady || isStalled }
      seekableRanges={ seekableRanges }
      hoverLabel={ hoverLabel }
      onHoverProgression={ handleHoverProgression }
      compounds={{
        wrapper: {
          className: audioStyles.audioProgressControl,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Escape") (document.activeElement as HTMLElement)?.blur();
          }
        },
        chapter: {
          className: audioStyles.audioProgressChapter
        },
        slider: {
          className: audioStyles.audioProgressSlider,
          "aria-label": t("audio.player.progress")
        },
        track: {
          className: audioStyles.audioProgressTrack
        },
        thumb: {
          className: audioStyles.audioProgressThumb
        },
        elapsedTime: {
          className: audioStyles.audioProgressElapsedTime
        },
        remainingTime: {
          className: audioStyles.audioProgressRemainingTime
        },
        seekableRange: {
          className: audioStyles.audioProgressSeekableRange
        },
        tooltip: {
          className: audioStyles.audioProgressTooltip
        }
      }}
    />
  );
};
