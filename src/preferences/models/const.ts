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
import { ThActionsTokens, ThSettingsRangePref, FontCollection } from "../preferences";
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

export const readiumCSSFontCollection: FontCollection = {
  oldStyle: {
    id: "oldStyle",
    name: "Old Style",
    label: "reader.preferences.fontFamily.oldStyle.descriptive",
    source: { type: "system" },
    spec: {
      family: fontStacks.RS__oldStyleTf,
      weights: { type: "static", values: [400, 700] },
      fallbacks: []
    }
  },
  modern: {
    id: "modern",
    name: "Modern",
    label: "reader.preferences.fontFamily.modern.descriptive",
    source: { type: "system" },
    spec: {
      family: fontStacks.RS__modernTf,
      weights: { type: "static", values: [400, 700] },
      fallbacks: []
    }
  },
  sans: {
    id: "sans",
    name: "Sans",
    label: "reader.preferences.fontFamily.sans",
    source: { type: "system" },
    spec: {
      family: fontStacks.RS__sansTf,
      weights: { type: "static", values: [400, 700] },
      fallbacks: []
    }
  },
  humanist: {
    id: "humanist",
    name: "Humanist",
    label: "reader.preferences.fontFamily.humanist.descriptive",
    source: { type: "system" },
    spec: {
      family: fontStacks.RS__humanistTf,
      weights: { type: "static", values: [400, 700] },
      fallbacks: []
    }
  },
  monospace: {
    id: "monospace",
    name: "Monospace",
    label: "reader.preferences.fontFamily.monospace",
    source: { type: "system" },
    spec: {
      family: fontStacks.RS__monospaceTf,
      weights: { type: "static", values: [400, 700] },
      fallbacks: []
    }
  }
};

export const defaultFontCollection: FontCollection = {
  literata: {
    id: "literata",
    name: "Literata",
    source: { type: "custom", provider: "google" },
    spec: {
      family: "Literata",
      styles: ["normal", "italic"],
      weights: { type: "range", min: 200, max: 900, step: 20 },
      fallbacks: ["serif"]
    }
  },
  atkinson: {
    id: "atkinson",
    name: "Atkinson Hyperlegible Next",
    source: { type: "custom", provider: "google" },
    spec: {
      family: "Atkinson Hyperlegible Next",
      styles: ["normal", "italic"],
      weights: { type: "range", min: 200, max: 800, step: 20 },
      fallbacks: ["sans-serif"]
    }
  },
  luciole: {
    id: "luciole",
    name: "Luciole",
    source: { 
      type: "custom", 
      provider: "local", 
      variant: "static",
      files: [
        { path: "/fonts/Luciole/Luciole-Regular.woff2", weight: 400, style: "normal" },
        { path: "/fonts/Luciole/Luciole-Italic.woff2", weight: 400, style: "italic" },
        { path: "/fonts/Luciole/Luciole-Bold.woff2", weight: 700, style: "normal" },
        { path: "/fonts/Luciole/Luciole-BoldItalic.woff2", weight: 700, style: "italic" }
      ]
    },
    spec: {
      family: "Luciole",
      styles: ["normal", "italic"],
      weights: { type: "static", values: [400, 700] },
      fallbacks: ["sans-serif"]
    }
  },
  ...readiumCSSFontCollection,
  iAWriterDuo: {
    id: "iAWriterDuo",
    name: "IA Writer Duo",
    source: { 
      type: "custom", 
      provider: "local", 
      variant: "static",
      files: [
        { path: "/fonts/iAWriterDuo/IAWriterDuoS-Regular.woff2", weight: 400, style: "normal" },
        { path: "/fonts/iAWriterDuo/IAWriterDuoS-Bold.woff2", weight: 700, style: "normal" },
        { path: "/fonts/iAWriterDuo/IAWriterDuoS-Italic.woff2", weight: 400, style: "italic" },
        { path: "/fonts/iAWriterDuo/IAWriterDuoS-BoldItalic.woff2", weight: 700, style: "italic" }
      ]
    },
    spec: {
      family: "IA Writer Duo",
      styles: ["normal", "italic"],
      weights: { type: "static", values: [400, 700] },
      fallbacks: ["monospace"]
    }
  },
  openDyslexic: {
    id: "openDyslexic",
    name: "Open Dyslexic",
    source: { 
      type: "custom", 
      provider: "local", 
      variant: "static",
      files: [
        { path: "/fonts/OpenDyslexic/OpenDyslexic-Regular.otf", weight: 400, style: "normal" },
        { path: "/fonts/OpenDyslexic/OpenDyslexic-Italic.otf", weight: 400, style: "italic" },
        { path: "/fonts/OpenDyslexic/OpenDyslexic-Bold.otf", weight: 700, style: "normal" },
        { path: "/fonts/OpenDyslexic/OpenDyslexic-BoldItalic.otf", weight: 700, style: "italic" }
      ]
    },
    spec: {
      family: "OpenDyslexic",
      styles: ["normal", "italic"],
      weights: { type: "static", values: [400, 700] },
      fallbacks: ["sans-serif"]
    }
  },
  accessibleDfA: {
    id: "accessibleDfA",
    name: "Accessible DfA",
    source: { 
      type: "custom", 
      provider: "local", 
      variant: "static",
      files: [
        { path: "/fonts/AccessibleDfA/AccessibleDfA-Regular.woff2", weight: 400, style: "normal" },
        { path: "/fonts/AccessibleDfA/AccessibleDfA-Italic.woff2", weight: 400, style: "italic" },
        { path: "/fonts/AccessibleDfA/AccessibleDfA-Bold.woff2", weight: 700, style: "normal" }
      ]
    },
    spec: {
      family: "Accessible DfA",
      styles: ["normal", "italic"],
      weights: { type: "static", values: [400, 700] },
      fallbacks: ["sans-serif"]
    }
  }
};

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