"use client";

import { useMemo, useRef } from "react";
import { AudioSettingsCache, useAudioSettingsCache } from "@/core/Hooks/Audio/useAudioSettingsCache";

export interface AudioStatelessCache extends AudioSettingsCache {
  sleepOnTrackEnd: boolean;
}

export const useAudioStatelessCache = (
  volume: number,
  playbackRate: number,
  preservePitch: boolean,
  skipBackwardInterval: number,
  skipForwardInterval: number,
  skipInterval: number,
  pollInterval: number,
  autoPlay: boolean,
  enableMediaSession: boolean,
  sleepOnTrackEnd: boolean
) => {
  const settingsCache = useAudioSettingsCache(
    volume,
    playbackRate,
    preservePitch,
    skipBackwardInterval,
    skipForwardInterval,
    skipInterval,
    pollInterval,
    autoPlay,
    enableMediaSession
  );

  const cache = useRef<AudioStatelessCache>({
    ...settingsCache.current,
    sleepOnTrackEnd,
  });

  const memoizedCache = useMemo(() => ({
    ...settingsCache.current,
    sleepOnTrackEnd,
  }), [settingsCache, sleepOnTrackEnd]);

  cache.current = memoizedCache;

  return cache;
};
