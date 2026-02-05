# Settings

Settings can be customized extensively, and even nested in advanced components. The values for some settings can be customized as well.

## Display Order

You can customize the order of the actions in the `reflowOrder` or `fxlOrder` arrays, and remove them as well if you don’t want to expose some. 

Enum `ThSettingsKeys` is provided to keep things consistent across the entire codebase.

For instance:

```
settings: {
  ...
  reflowOrder: [
    ThSettingsKeys.zoom,
    ThSettingsKeys.fontFamily,
    ThSettingsKeys.theme,
    ThSettingsKeys.lineHeight,
    ThSettingsKeys.layout,
    ThSettingsKeys.columns
  ],
  fxlOrder: [
    ThSettingsKeys.zoom,
    ThSettingsKeys.theme,
    ThSettingsKeys.columns
  ]
}
```

Note that if you are using a standalone component in an Advanced component (either in `main` or `displayOrder`), it will be filtered so that it is not rendered twice.

### Standalone components

All settings components are standalone by default, which means you can organise them as you see fit to build your own Settings panel.

### Advanced components

`ThSettingsKeys.text` and `ThSettingsKeys.spacing` are two advanced components in which you can nest other components.

Enums `ThTextSettingsKeys` and `ThSpacingSettingsKeys` list which components can be nested in these two.

When used, a button will be added to access the nested components.


## Keys

The `keys` object is used to configure settings:

- `fontFamily`;
- `letterSpacing`;
- `lineHeight`;
- `paragraphIndent`;
- `paragraphSpacing`;
- `wordSpacing`;
- `zoom`.

### FontFamily

The `fontFamily` key accepts a `ThFontFamilyPref` object which can be one of two types:

1. A default font collection:
   ```typescript
   {
     default: FontCollection;
   }
   ```

2. A font collection for specific languages:
   ```typescript
   {
     [languageKey: string]: {
       fonts: FontCollection;
       supportedLanguages: string[];
     }
   }
   ```

Where:

- `FontCollection` is a record mapping font IDs to `FontDefinition` objects
- Each `FontDefinition` includes:
  - `id`: Unique identifier for the font
  - `name`: Display name of the font
  - `label`: Optional internationalized label
  - `source`: Font source configuration
  - `spec`: Font specification including family, fallbacks, weights, widths, styles, and display.

Example:

```typescript
{
  default: {
    "variable-system-font": {
      id: "variable-system-font",
      name: "Variable System Font",
      source: { type: "system" },
      spec: {
        family: "Variable System Font",
        fallbacks: ["Arial", "Helvetica", "sans-serif"],
        weights: { type: "range", min: 100, max: 900, step: 100 },
        widths: { min: 100, max: 200, step: 10 },
        styles: ["normal", "italic"],
        display: "swap"
      }
    }
  },
  "serif-font": {
    id: "serif-font",
    name: "Serif Font",
    source: { type: "system" },
    spec: {
      family: "Serif Font",
      fallbacks: ["Times New Roman", "Georgia", "serif"],
      weights: { type: "static", values: [400, 700] },
      styles: ["normal", "italic"]
    }
  }
}
```

#### Additional Collections

Additional collections can override the default collection depending on the language of the publication. You should use them explicitly for that purpose, and they can support multiple languages if needed.

For instance, this can be used if you want to provide a list of fonts for a specific language that does not use the same script as the default collection e.g. Arabic with a default collection of Latin scripts.

Example:

```typescript
{
  default: { /* ... */ },
  "arabic-farsi": {
    fonts: { /* ... */ },
    supportedLanguages: ["ar", "fa"]
  }
}

```

Then if the publication is in Arabic or Farsi, the "arabic-farsi" collection will be used for the font family setting, and the value the user sets will be specifically stored for this language, so that it does not override other collections.

This can be useful if you have a large catalogue containing books in multiple languages, and you want to provide a list of fonts specific to some languages.

#### Using Google Fonts

You can include Google Fonts in your font collection by manually defining the font configuration. Here's how to do it:

##### Manual Configuration

```typescript
const googleFonts = {
  "roboto": {
    id: "roboto",
    name: "Roboto",
    source: {
      type: "custom",
      provider: "google"
    },
    spec: {
      family: "Roboto",
      fallbacks: ["Arial", "sans-serif"],
      weights: {
        type: "static",
        values: [300, 400, 500, 700]
      },
      styles: ["normal", "italic"],
      display: "swap"
    }
  },
  "open-sans": {
    id: "open-sans",
    name: "Open Sans",
    source: {
      type: "custom",
      provider: "google"
    },
    spec: {
      family: "Open Sans",
      fallbacks: ["Helvetica", "sans-serif"],
      weights: {
        type: "range",
        min: 300,
        max: 800
      },
      styles: ["normal", "italic"],
      display: "swap"
    }
  }
};

// Use in your settings
const settings = {
  // ... other settings
  keys: {
    [ThSettingsKeys.fontFamily]: {
      default: googleFonts
    }
  }
};
```

##### Using the Helper Function (Alternative)

For convenience, you can use the `createDefinitionsFromGoogleFonts` helper.

- `cssUrl` (string, required): The Google Fonts CSS URL or the entire `link` you copy from their page
- `options` (object, optional): Configuration options
  - `order` (string[]): Controls the display order of fonts in the UI, requires derived `id`
  - `fallbacks` (Record<string, string[]>): Custom fallback fonts for each font family, requires derived `id`
  - `display` (string): Controls font-display behavior
  - `weightStep` (number): For variable fonts, controls weight granularity
  - `widthStep` (number): For variable width fonts, controls width granularity

Derived `id` is the font family name in lowercase, with spaces replaced by hyphens.

Example:

```typescript
import { createDefinitionsFromGoogleFonts } from "@edrlab/thorium-web/preferences";

const googleFonts = createDefinitionsFromGoogleFonts({
  cssUrl: "https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Roboto:ital,wght@0,300..700;1,300..700",
  
  options: {
    order: ["roboto", "open-sans"],
    
    fallbacks: {
      "roboto": ["Arial", "sans-serif"],
      "open-sans": ["Helvetica", "sans-serif"]
    }
  }
});
```

#### Using Local Fonts

You can use local fonts, either static or variable, that are served from the same origin as your app. For convenience, you can use the `createDefinitionFromStaticFonts` helper for static fonts.

##### Using the Helper for Static Fonts

```typescript
import { createDefinitionFromStaticFonts } from "@edrlab/thorium-web/preferences";

const myCustomFont = createDefinitionFromStaticFonts({
  id: "my-custom-font",
  name: "My Custom Font",
  family: "My Custom Font", // optional, defaults to name
  fallbacks: ["Arial", "sans-serif"], // optional, defaults to ["sans-serif"],
  files: [
    { path: "/fonts/my-custom-font-regular.woff2", weight: 400, style: "normal" },
    { path: "/fonts/my-custom-font-italic.woff2", weight: 400, style: "italic" },
    { path: "/fonts/my-custom-font-bold.woff2", weight: 700, style: "normal" },
    { path: "/fonts/my-custom-font-bold-italic.woff2", weight: 700, style: "italic" }
  ]
});

// Use in your settings
const settings = {
  // ... other settings
  keys: {
    [ThSettingsKeys.fontFamily]: {
      default: {
        "my-custom-font": myCustomFont
      }
    }
  }
};
```

##### Manual Configuration

You can also define the configuration manually if you prefer:

```typescript
const myCustomFont: FontDefinition = {
  id: "my-custom-font",
  name: "My Custom Font",
  source: {
    type: "custom",
    provider: "local",
    variant: "static",
    files: [
      { path: "/fonts/my-custom-font-regular.woff2", weight: 400, style: "normal" },
      { path: "/fonts/my-custom-font-italic.woff2", weight: 400, style: "italic" },
      { path: "/fonts/my-custom-font-bold.woff2", weight: 700, style: "normal" },
      { path: "/fonts/my-custom-font-bold-italic.woff2", weight: 700, style: "italic" }
    ]
  },
  spec: {
    family: "My Custom Font",
    fallbacks: ["Arial", "sans-serif"],
    weights: {
      type: "static",
      values: [400, 700]
    },
    styles: ["normal", "italic"]
  }
};

// Use in your settings
const settings = {
  // ... other settings
  keys: {
    [ThSettingsKeys.fontFamily]: {
      default: {
        "my-custom-font": myCustomFont
      }
    }
  }
};
```

##### Variable Fonts

For variable fonts, use this structure:

```typescript
const myVariableFont: FontDefinition = {
  id: "my-variable-font",
  name: "My Variable Font",
  source: {
    type: "custom",
    provider: "local",
    variant: "variable",
    files: [
      { 
        path: "/fonts/my-variable-font.woff2",
        style: "normal" 
      }
    ]
  },
  spec: {
    family: "My Variable Font",
    fallbacks: ["sans-serif"],
    weights: {
      type: "range",
      min: 100,
      max: 900,
      step: 20
    },
    styles: ["normal"]
  }
};

// Use in your settings
const settings = {
  // ... other settings
  keys: {
    [ThSettingsKeys.fontFamily]: {
      default: {
        "my-custom-font": myCustomFont
      }
    }
  }
};
```

### LineHeight

The `lineHeight` key accepts a `ThSettingsRadioPref` object with the following structure:

```typescript
{
  // Whether unsetting the value is allowed, this will provide a Publisher option
  allowUnset?: boolean; 
  keys: {
    [key in ThLineHeightOptions]: number;
  }
}
```

Where `ThLineHeightOptions` can be one of:

- `small`: 1.3 (130% line height)
- `medium`: 1.5 (150% line height)
- `large`: 1.75 (175% line height)

Example:

```typescript
{
  allowUnset: false,
  keys: {
    small: 1.3,
    medium: 1.5,
    large: 1.75
  }
}
```

The `publisher` option (whose value is `null`) is automatically handled separately and doesn't need to be included in the configuration.

### Ranges

- `letterSpacing`;
- `paragraphIndent`;
- `paragraphSpacing`;
- `wordSpacing`;
- `zoom`.

These ranges expect:

- `variant` (optional): from enum `ThSettingsRangeVariant` (`slider`, `incrementedSlider` or `numberfield`)
- `placeholder` (optional): the placeholder text, as enum `ThSettingsRangePlaceholder`, `string`, or an object with `key` and `fallback` properties – the `key` should be a key from your translation files, and the `fallback` is the default value if the translation key is not found
- `range` (optional): the min and max values, as `[number, number]`
- `step` (optional): the step value, as `number`

## Configuration Example

```typescript
settings: {
  reflowOrder: [
    ThSettingsKeys.zoom,
    ThSettingsKeys.textGroup,
    ThSettingsKeys.theme,
    ThSettingsKeys.spacingGroup,
    ThSettingsKeys.layout,
    ThSettingsKeys.columns
  ],
  fxlOrder: [
    ThSettingsKeys.theme,
    ThSettingsKeys.columns
  ],
  keys: {
    ...,
    [ThSettingsKeys.letterSpacing]: {
      variant: ThSettingsRangeVariant.slider,
      range: [0, 0.5],
      step: 0.05
    },
    [ThSettingsKeys.wordSpacing]: {
      variant: ThSettingsRangeVariant.numberField,
      range: [0, 1],
      step: 0.1
    },
    [ThSettingsKeys.zoom]: {
      variant: ThSettingsRangeVariant.numberField,
      range: [0.7, 4],
      step: 0.05
    },
    [ThSettingsKeys.lineHeight]: {
      [ThLineHeightOptions.small]: 1.3,
      [ThLineHeightOptions.medium]: 1.5,
      [ThLineHeightOptions.large]: 1.75
    }
  },
  text: {
    main: [ThTextSettingsKeys.fontFamily],
    subPanel: [
      ThTextSettingsKeys.fontFamily,
      ThTextSettingsKeys.fontWeight,
      ThTextSettingsKeys.textAlign,
      ThTextSettingsKeys.hyphens,
      ThTextSettingsKeys.textNormalize
    ]
  },
  spacing: {
    main: [ThSpacingSettingsKeys.spacingPresets],
    subPanel: [
      ThSpacingSettingsKeys.spacingPresets,
      ThSpacingSettingsKeys.lineHeight,
      ThSpacingSettingsKeys.wordSpacing,
      ThSpacingSettingsKeys.letterSpacing,
      ThSpacingSettingsKeys.paragraphSpacing,
      ThSpacingSettingsKeys.paragraphIndent
    ]
  }
}
```

## Text (optional)

The text object is responsible for the advanced Text Component, which provides an extra container to display more options.

### Main (optional)

The `main` property accepts an array of `ThTextSettingsKeys`. These components will be displayed in the SettingsPanel, with a button to access the components in `displayOrder`.

If all nestable components are listed in `main`, then the Text component behaves as if all its nested components are standalone, and will not create a button to access them – as they are already accessible.

### SubPanel (optional)

The `subPanel` property accepts and array of the keys for components to display in the “sub-panel”, and their order. Note components listed in `main` will not automatically be added to this array.

### Header (optional)

The `header` property accepts a `ThSheetHeaderVariant` to display a header in the SettingsPanel.

## Spacing (optional)

The spacing object is responsible for the advanced Spacing Component, which provides an extra container to display more options.

### Main (optional)

The `main` property accepts an array of `ThSpacingSettingsKeys`. These components will be displayed in the SettingsPanel, with a button to access the components in `displayOrder`.

If all nestable components are listed in `main`, then the Spacing component behaves as if all its nested components are standalone, and will not create a button to access them – as they are already accessible.

### SubPanel (optional)

The `subPanel` property accepts and array of the keys for components to display in the “sub-panel”, and their order. Note components listed in `main` will not automatically be added to this array.

### Header (optional)

The `header` property accepts a `ThSheetHeaderVariant` to display a header in the SettingsPanel.

### Presets (optional)

The `presets` property accepts an object with the following properties:

- `reflowOrder`: an array of `ThSpacingPresetKeys` to display in the SettingsPanel, in the order they are listed;
- `keys`: an object with the presets and their configurations.

For instance:

```typescript
...
spacing:
  ...
  presets: {
    reflowOrder: [
      ThSpacingPresetKeys.publisher,
      ThSpacingPresetKeys.accessible,
      ThSpacingPresetKeys.custom,
      ThSpacingPresetKeys.tight,
      ThSpacingPresetKeys.balanced,
      ThSpacingPresetKeys.loose
    ],
    keys: {
      [ThSpacingPresetKeys.tight]: {
        [ThSettingsKeys.lineHeight]: ThLineHeightOptions.small,
        [ThSettingsKeys.paragraphSpacing]: 0,
        [ThSettingsKeys.paragraphIndent]: 1
      },
      [ThSpacingPresetKeys.balanced]: {
        [ThSettingsKeys.lineHeight]: ThLineHeightOptions.medium,
      },
      [ThSpacingPresetKeys.loose]: {
        [ThSettingsKeys.lineHeight]: ThLineHeightOptions.large,
        [ThSettingsKeys.paragraphSpacing]: 1.5
      },
      [ThSpacingPresetKeys.accessible]: {
        [ThSettingsKeys.lineHeight]: ThLineHeightOptions.large,
        [ThSettingsKeys.paragraphSpacing]: 3,
        [ThSettingsKeys.paragraphIndent]: 0,
        [ThSettingsKeys.letterSpacing]: 0.1,
        [ThSettingsKeys.wordSpacing]: 0.3
      }
    }
  }
}
```

#### Display Order

The `reflowOrder` array controls the display order of spacing presets in the settings panel. Presets not included in this array will not be available to users.

Note that `ThSpacingPresetKeys.publisher` and `ThSpacingPresetKeys.custom` are special presets that do not accept configuration in the `keys` object:
- `ThSpacingPresetKeys.publisher` uses the original publisher's spacing settings
- `ThSpacingPresetKeys.custom` allows users to customize their own preset through the UI

#### Keys

The `keys` object contains the spacing presets (excluding `ThSpacingPresetKeys.publisher` and `ThSpacingPresetKeys.custom`) and their configurations. Each preset can configure the following settings:

- `ThSettingsKeys.lineHeight` - Controls line spacing using `ThLineHeightOptions` (small, medium, large)
- `ThSettingsKeys.paragraphSpacing` - Space between paragraphs (number value)
- `ThSettingsKeys.paragraphIndent` - First line indentation (number value)
- `ThSettingsKeys.letterSpacing` - Space between letters (number value)
- `ThSettingsKeys.wordSpacing` - Space between words (number value)