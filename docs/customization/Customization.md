# Customization

This project has been designed to be highly customizable from the start, with [multiple options configurable in its Preferences](../src/preferences.ts). This should help change a significant amount of features without having to fork and modify components. 

## Direction

The App UI supports both Left-to-Right (LTR) and Right-to-Left (RTL) languages through optional property `direction`. It will switch the entire layout, including the docking panels, independently of the publication’s reading progression.

Values can be `ltr` or `rtl` and a `LayoutDirection` enum is available as well. 

## Locale

For direction to work properly, the `locale` has to be set as well, since React Aria Components require this locale to derive the correct direction. If you don’t set it, then the user’s system/browser locale will be used, with the risk of resulting to a conflicting `dir` being used. 

## Typography

The `typography` object can be used to set the following properties:

- `pageGutter`;
- `optimalLineLength`; 
- `minimalLineLength`;
- `maximalLineLength`;
- `layoutStrategy`.

For instance: 

```
typography: {
  minimalLineLength: 35,
  optimalLineLength: 65,
  maximalLineLength: 75,
  pageGutter: 20,
  layoutStrategy: RSLayoutStrategy.margin
}
```

### Page Gutter

The `padding` to add to `body` in publications, in `px`.

### Optimal Line Length

The optimal line length used for value `auto` when the publication is paginated, in `ch` (number of characters). 

This will be used to switch from one to two columns, taking page gutter into account.

### Minimal Line Length (optional)

The minimal line length a column of text can never go below when `n >= 2` columns are set by the user, in `ch`. 

If the value is `undefined`, then optimal line length is the minimal line length. The algorithm will also check this value is not higher than the optimal line length and apply the same logic.

If it’s `null` then this means it is disabled entirely, and there is no lower limit. This can be used to enforce `n` columns, even on smaller screens.

### Maximal Line Length (optional)

The maximal line length a column of text can reach in `ch`. 

If the value is `undefined`, then optimal line length is the maximal line length. The algorithm will also check this value is higher than the optimal line length and apply the same logic.

If it’s `null` then this means it is disabled entirely, and there is no upper limit. This can be used to enforce the line of text is as long as its container or column when the count is set by the user.

### Layout Strategy (optional)

The strategy that should be used to lay out reflowable contents. 

It is using the `RSLayoutStrategy` enum (`margin`, `lineLength`, `columns`).

- `margin` prioritizes optimal line length and whitespace; 
- `lineLength` prioritizes maximal line length and uses optimal as a floor to add some fluidity;
- `columns` prioritizes minimal line length and the number of columns. This is only compatible with `colCount: "auto"`

These strategies are part of the Preferences API and can be switched dynamically if needed.

## Scroll

The `scroll` preference is used to configure the scroll affordances at the top and bottom of each resource when in scrollable layout.

### Affordances

You can set what top and bottom affordances should display with properties:

- `topAffordance`;
- `bottomAffordance`.

They are using the `ScrollAffordancePref` enum (`none`, `prev`, `next`, `both`).

For instance if you want nothing in the top slot you can set: 

```
scroll: {
  topAffordance: ScrollAffordancePref.none,
  bottomAffordance: ScrollAffordancePref.both,
  ...
}
```

Or if you want a link to the previous resource at the top, and the next at the bottom:

```
scroll: {
  topAffordance: ScrollAffordancePref.prev,
  bottomAffordance: ScrollAffordancePref.next,
  ...
}
```

### Position to scroll back to (WIP)

TBD.

For the previous affordance, you can set the position it should go back to using `backTo` and the `ScrollBackTo` enum (`top`, `bottom`, `untouched`).

## Theming

See the [dedicated Theming doc](./Theming.md).

You can configure `breakpoints`, that are re-used multiple times throughout preferences, in `theming`. 

This document also explains in depth how you can add your own themes, customize, or remove existing ones. Without having to add or modify any component.

## Shortcuts (WIP)

TBD.

**Please note support for shortcuts is very basic at the moment, and is consequently limited.** Any contribution to improve it will be greatly appreciated.

You can set the `representation` of the special keys displayed in the shortcut component with enum `ShortcutRepresentation` (`symbol`, `short`, `long`).

For instance, for key `Option` on Mac, `symbol` is `⌥`, `short` is `alt`, and `long` is `Option`.

You can also configure an optional `joiner` string that will be added between keys.

For instance:

```
shortcuts: {
  representation: ShortcutRepresentation.short,
  joiner: "+"
}
```

Will display shortcuts as `Alt+Shift+{ Key }`.

## Actions

Action Components can be a simple trigger (e.g. fullscreen), or a combination of a trigger and a sheet/container (e.g. Settings, Toc). This should explain why a lot of their properties are optional when configured in `keys`.

### Display Order

You can customize the order of the actions in the `displayOrder` array, and remove them as well if you don’t want to expose some. 

Enum `ActionKeys` is provided to keep things consistent across the entire codebase.

For instance:

```
actions: {
  ...
  displayOrder: [
    ActionKeys.settings,
    ActionKeys.toc,
    ActionKeys.fullscreen
  ]
}
```

### Collapsibility and Visibility

You can enable collapsibility i.e. an overflow menu will be used based on your configuration, and set the visibility of eact action. More details in the dedicated [Collapsibility doc](Collapsibility.md).

### Keys

The `keys` object contains the configuration for each `action`, with optional properties that can be used when the action’s is not just a trigger, but also has a sheet/container:

- `sheet` to specify the type of sheet the action’s container should use:
  - as a `defaultSheet` (`fullscreen`, `popover`, or `bottomSheet`);
  - as an override of this default for specific breakpoints in a `breakpoints` object (value is a key of `SheetTypes` enum).
- `docked`: the configuration for docking. See the [docking doc](./Docking.md) for further details.
- `snapped`: the configuration for snap points. See the [snap points doc](Snappoints.md) for further details.

For instance, if you want a popover sheet for Settings, except in the smaller breakpoint, you would do:

```
keys: {
  ...
  [ActionKeys.settings]: {
    ...
    sheet: {
      defaultSheet: SheetTypes.popover,
      breakpoints: {
        [StaticBreakpoints.compact]: SheetTypes.bottomSheet
      }
    }
  }
}
```

This means a bottom sheet will be used when the breakpoint is `compact`, and a popover in all other breakpoints.

### Shortcut (WIP)

TBD.

**Please note support for shortcuts is very basic at the moment, and is consequently limited.** Any contribution to improve it will be greatly appreciated.

You can configure a shortcut for each action by setting property `shortcut`.

Its value can be:

- `null`, if you don’t want to assign a shortcut to the action;
- a `string` that must meet several requirements due to current limitations.

These limitations are:

- modifier keys must use a value in the `ShortcutMetaKeywords` enum to be recognized;
- keys must be separated by `+` or `-`;
- only a single alpha character is allowed in addition to modifier keys.

For instance:

```
[ActionKeys.toc]: {
  ...
  shortcut: `${ ShortcutMetaKeywords.shift }+${ ShortcutMetaKeywords.alt }+T`
}
```

Will toggle the Table of contents’ container when combination `Shift, Option, T` is pressed.

Note `ShortcutMetaKeywords.platform` is provided as an alias mapping to the Command/Meta Key on MacOS, and Control Key on other platforms.

## Docking

Docking is partly similar to actions in the sense it has its own special docking actions you can configure: display order, collapsibility and visibility.

See the [dedicated Docking doc](./Docking.md) for more details.

## Settings

Settings can be set and or nested in a specific order for both reflowable and Fixed-Layout EPUB. Some settings’ values can also be customized.

See [Settings doc](./Settings.md) for more details.