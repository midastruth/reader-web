"use client";

import fontStacks from "@readium/css/css/vars/fontStacks.json";

import { 
  ThLineHeightOptions, 
  ThSettingsRangePlaceholder, 
  ThSettingsRangeVariant, 
  ThSpacingPresetKeys, 
  ThSpacingSettingsKeys, 
  ThTextSettingsKeys 
} from "./enums";
import { ThActionsTokens, ThSettingsRangePref } from "../preferences";
import { ThCollapsibilityVisibility } from "@/core/Components/Actions/hooks/useCollapsibility";

export const defaultActionKeysObject: ThActionsTokens = {
  visibility: ThCollapsibilityVisibility.partially,
  shortcut: null
};

export const defaultTextSettingsMain = [ThTextSettingsKeys.fontFamily];

export const defaultTextSettingsSubpanel = [
  ThTextSettingsKeys.fontFamily,
  ThTextSettingsKeys.textAlign,
  ThTextSettingsKeys.hyphens,
  ThTextSettingsKeys.fontWeight,
  ThTextSettingsKeys.textNormalize
]

export const defaultSpacingSettingsMain = [
  ThSpacingSettingsKeys.spacingPresets
];

export const defaultSpacingSettingsSubpanel = [
  ThSpacingSettingsKeys.spacingPresets,
  ThSpacingSettingsKeys.lineHeight,
  ThSpacingSettingsKeys.paragraphSpacing,
  ThSpacingSettingsKeys.paragraphIndent,
  ThSpacingSettingsKeys.wordSpacing,
  ThSpacingSettingsKeys.letterSpacing
];

export const defaultSpacingPresetsOrder = [
  ThSpacingPresetKeys.publisher,
  ThSpacingPresetKeys.accessible,
  ThSpacingPresetKeys.custom,
  ThSpacingPresetKeys.tight,
  ThSpacingPresetKeys.balanced,
  ThSpacingPresetKeys.loose
]

export const defaultFontFamilyOptions = {
  publisher: null,
  oldStyle: fontStacks.RS__oldStyleTf,
  modern: fontStacks.RS__modernTf,
  sans: fontStacks.RS__sansTf,
  humanist: fontStacks.RS__humanistTf,
  monospace: fontStacks.RS__monospaceTf
}

export const defaultParagraphSpacing: Required<ThSettingsRangePref> = {
  variant: ThSettingsRangeVariant.numberField,
  placeholder: ThSettingsRangePlaceholder.range,
  range: [0, 3],
  step: 0.25
}

export const defaultParagraphIndent: Required<ThSettingsRangePref> = {
  variant: ThSettingsRangeVariant.numberField,
  placeholder: ThSettingsRangePlaceholder.range,
  range: [0, 2],
  step: 0.25
}

export const defaultWordSpacing: Required<ThSettingsRangePref> = {
  variant: ThSettingsRangeVariant.numberField,
  placeholder: ThSettingsRangePlaceholder.range,
  range: [0, 1],
  step: 0.1
}

export const defaultLetterSpacing: Required<ThSettingsRangePref> = {
  variant: ThSettingsRangeVariant.numberField,
  placeholder: ThSettingsRangePlaceholder.range,
  range: [0, 0.5],
  step: 0.05
}

export const defaultLineHeights = {
  [ThLineHeightOptions.small]: 1.3,
  [ThLineHeightOptions.medium]: 1.5,
  [ThLineHeightOptions.large]: 1.75
}

export const defaultZoom: Required<ThSettingsRangePref> = {
  variant: ThSettingsRangeVariant.numberField,
  placeholder: ThSettingsRangePlaceholder.range,
  range: [0.7, 4],
  step: 0.05
}

export const defaultSpacingPresets = {
  [ThSpacingPresetKeys.tight]: {
    [ThSpacingSettingsKeys.lineHeight]: ThLineHeightOptions.small,
    [ThSpacingSettingsKeys.paragraphSpacing]: 0,
    [ThSpacingSettingsKeys.paragraphIndent]: 1
  },
  [ThSpacingPresetKeys.balanced]: {
    [ThSpacingSettingsKeys.lineHeight]: ThLineHeightOptions.medium,
    [ThSpacingSettingsKeys.paragraphSpacing]: 0.75,
    [ThSpacingSettingsKeys.paragraphIndent]: 0
  },
  [ThSpacingPresetKeys.loose]: {
    [ThSpacingSettingsKeys.lineHeight]: ThLineHeightOptions.large,
    [ThSpacingSettingsKeys.paragraphSpacing]: 1.75,
    [ThSpacingSettingsKeys.paragraphIndent]: 0
  },
  [ThSpacingPresetKeys.accessible]: {
    [ThSpacingSettingsKeys.lineHeight]: ThLineHeightOptions.large,
    [ThSpacingSettingsKeys.paragraphSpacing]: 2.5,
    [ThSpacingSettingsKeys.paragraphIndent]: 0,
    [ThSpacingSettingsKeys.letterSpacing]: 0.1,
    [ThSpacingSettingsKeys.wordSpacing]: 0.3
  }
}