"use client";

import { ThSettingsRangePrefRequired, ThSettingsRangeVariant, ThSettingsRangePlaceholder } from "./settings";

export enum ThAudioKeys {
  theme = "theme",
  volume = "volume",
  playbackRate = "playbackRate",
  skipBackwardInterval = "skipBackwardInterval",
  skipForwardInterval = "skipForwardInterval",
  skipInterval = "skipInterval",
  autoPlay = "autoPlay",
}

export type ThAudioSettingsKeys = Exclude<ThAudioKeys, ThAudioKeys.volume | ThAudioKeys.playbackRate>;

export const defaultAudioVolume: ThSettingsRangePrefRequired = {
  variant: ThSettingsRangeVariant.slider,
  range: [0, 1],
  step: 0.1,
  placeholder: ThSettingsRangePlaceholder.range
}

export const defaultAudioPlaybackRate: ThSettingsRangePrefRequired = {
  variant: ThSettingsRangeVariant.sliderWithPresets,
  range: [0.5, 2],
  step: 0.05,
  placeholder: ThSettingsRangePlaceholder.range,
  presets: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
}

export const defaultAudioSkipBackwardInterval: ThSettingsRangePrefRequired = {
  variant: ThSettingsRangeVariant.slider,
  range: [5, 60],
  step: 5,
  placeholder: ThSettingsRangePlaceholder.range
}

export const defaultAudioSkipForwardInterval: ThSettingsRangePrefRequired = {
  variant: ThSettingsRangeVariant.slider,
  range: [5, 60],
  step: 5,
  placeholder: ThSettingsRangePlaceholder.range
}

export const defaultAudioSkipInterval: ThSettingsRangePrefRequired = {
  variant: ThSettingsRangeVariant.slider,
  range: [5, 60],
  step: 5,
  placeholder: ThSettingsRangePlaceholder.range
}
