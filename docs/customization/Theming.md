# Theming

The `theming` property is responsible for the look and feel of the app, as it allows to specify a large amount of properties:

- breakpoints;
- layout defaults and constraints;
- arrows and icons; 
- themes.

## Breakpoints

Object `breakpoints` can be used to customize the media queries that will be used to target different widths. It is taking inspiration from [Material Design’s Window-size classes](https://m3.material.io/foundations/layout/applying-layout/window-size-classes). 

The property is in enum `StaticBreakpoints` and the value a `number` (in `px`). This value represents the `max-width` for each breakpoint. 

If the value is set to `null` then the breakpoint is simply ignored and the next one (if any) will be used to construct a range.

For instance:

```
theming: {
  ...
  breakpoints: {
    [StaticBreakpoints.compact]: 600,
    [StaticBreakpoints.medium]: 840, 
    [StaticBreakpoints.expanded]: null,
    [StaticBreakpoints.large]: 1600,
    [StaticBreakpoints.xLarge]: null
  }
}
```

Here we nullify the `expanded` breakpoint, which means it won’t be used. We will directly switch from `medium` to `large`. 

Note that applying a number to `xLarge` will effectively constrain the Media Query to this max value. In other words, if your screen/window is larger than this value, then all breakpoints will be false. This is why it will almost always be `null`.

These static breakpoints will be reused for docking, collapsibility, sheets/containers, etc.

## Layout

Object `layout` allows to configure:

- the border `radius` of button icons and sheets/containers (in `px`);
- the `spacing` of components (in `px`) when applicable e.g. padding and spacing of sheets/containers;
- `defaults` for:
  - `dockingWidth` or the size of dock panels by default (in `px`);
  - `scrim` or the CSS-valid string value for the bottom sheet’s underlay `background` – is overridable in each action’s `snapped` preference.
- `constraints` for some components:
  - the `max-width` of the bottom sheet component – is overridable in each action’s `snapped` preference;
  - the `max-width` of the popover sheet component.

For instance: 

```
theming: {
  ...
  layout: {
    radius: 0,
    spacing: 20,
    defaults: {
      dockingWidth: 300,
      scrim: "rgba(0, 0, 0, 0.2)"
    },
    constraints: {
      [SheetTypes.bottomSheet]: 600,
      [SheetTypes.popover]: 400
    }
  }
}
```
This means:

- your actions’ triggers and containers won’t have any border radius;
- they’ll use 20px as a reference for padding and their sections’ margins;
- the default for the docking width is 300 pixels;
- the default scrim is color black with 20% alpha;
- the bottom sheets are constrained to 600 pixels, unless overridden for an action;
- the popover sheets are constrained to 400 pixels.

## Arrows and icons

Object `arrow` allows to configure the `size` and `offset` (in `px`), as well as the `tooltipDelay` (in `ms`), of the left and right `arrow` used to progress through paged resources.

Object `icon` allows to configure the `size` and `tooltipOffset` (in `px`), as well as the `tooltipDelay` (in `ms`), of icon buttons throughout the UI.

For instance:

```
theming: {
  ...
  icon: {
    size: 24,
    tooltipOffset: 10,
    tooltipDelay: 500
  }
}
```

Will make the icons 24-pixel wide and tall, their tooltip will be placed 10 pixels from their reference, and their delay will be 500ms.

## Themes

Object `themes` allows to customize the themes used and provided to users in Settings. 

As a matter of fact, this user setting is created dynamically from these preferences, which means creating a theme takes 4 steps:

- add it to the `ThemeKeys` enum in [models/theme](../src/models/theme.ts);
- add their display string to `settings.themes` in [resources/locales](../src//resources/locales/en.json);
- add it to `reflowOrder` and/or `fxlOrder`;
- add and configure them in `themes.keys`.

Your custom theme is now available without having to create or modify a component. 

### Display Order

You can set the display order of themes for formats/renditions the Reader supports:

- `reflowOrder` for reflowable EPUB;
- `fxlOrder` for Fixed-Layout EPUB.

Note `ThemeKeys.auto` is a special case that maps the theme to the OS’ preference (light or dark), it’s not a theme *per se.*

For instance, to provide light and dark mode (and the `auto` option mentioned above) for Fixed-Layout EPUB:

```
theming: {
  theme: {
    ...
    fxlOrder: [
      ThemeKeys.auto,
      ThemeKeys.light,
      ThemeKeys.dark
    ]
  }
}
```

### Keys and Tokens

The `keys` object contains the themes (key of `ThemeKeys` enum as a property) and their tokens, whose value is a CSS-valid string:

- `background`: the color of the background
- `text`: the color of the text
- `link`: the color of links
- `visited`: the color of visited links
- `subdue`: the color of subdued elements such as borders
- `disable`: the color on `:disabled`
- `hover`: the color of the background on `:hover`
- `onHover`: the color of the text on `:hover`
- `select`: the color of the background on `::selection`
- `onSelect`: the color of the text on `::selection`
- `focus`: the color of the outline on `:focus-visible`
- `elevate`: the drop shadow of containers
- `immerse`: the opacity of immersive mode (value in the range `[0...1]` as a string)