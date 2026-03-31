# Audio Customization

This document covers customization options available for the `StatefulPlayer` audio component. Audio uses its own preferences system, separate from EPUB/WebPub — see [Handling Preferences](./HandlingPreferences.md) for how to create and provide audio preferences.

> [!NOTE]
> Several concepts from the EPUB/WebPub `StatefulReader` do **not** apply to audio:
> - **Layout mode** (`ThLayoutUI`, `stacked`, `layered`): audio has its own fixed layout.
> - **Immersive mode** / **hovering state**: not applicable to audio.
> - **Scroll / paged mode**: not applicable to audio.
> - **Typography**, **affordances**, **pagination arrows**: not applicable to audio.

## Direction

Audio supports LTR/RTL layout direction via the optional `direction` property, using enum `ThLayoutDirection`.

## Locale

Set `locale` so React Aria derives the correct direction and language context.

## Theming

Audio shares the same theming system as the reader. You can configure themes, breakpoints, icon size, and spacing in `theming`. See the [Theming doc](../Theming.md) for details.

## Player Layout

The player supports two layouts that switch automatically:

- **Compact** — single-column, used when there is enough vertical space.
- **Expanded** — two-column (`start` / `end`), activated when compact no longer fits (detected via overflow). Uses logical properties so it is RTL-friendly.

Both layouts are configured independently under `theming.layout`. Available components come from `ThAudioPlayerComponent`:

- `cover`: the cover image
- `metadata`: title and author
- `progressBar`: the seekable progress bar
- `playbackControls`: previous, skip backward, play/pause, skip forward, next
- `mediaActions`: the primary actions bar (volume, playback rate, and other primary actions)

```typescript
import { ThAudioPlayerComponent } from "@edrlab/thorium-web/audio";

theming: {
  layout: {
    compact: {
      order: [
        ThAudioPlayerComponent.cover,
        ThAudioPlayerComponent.metadata,
        ThAudioPlayerComponent.playbackControls,
        ThAudioPlayerComponent.progressBar,
        ThAudioPlayerComponent.mediaActions
      ]
    },
    expanded: {
      // inline-start column (left in LTR, right in RTL)
      start: [
        ThAudioPlayerComponent.cover,
        ThAudioPlayerComponent.metadata
      ],
      // inline-end column
      end: [
        ThAudioPlayerComponent.playbackControls,
        ThAudioPlayerComponent.progressBar,
        ThAudioPlayerComponent.mediaActions
      ]
    }
  }
}
```

`compact.order` and `expanded.start`/`expanded.end` are fully independent — components can appear in a different sequence or grouping between the two layouts.

## Actions

### Primary Media Actions

Primary actions appear in the media actions bar (volume, playback rate, TOC, sleep timer, etc.). Configure their display order in `actions.primary.displayOrder` using enum `ThAudioActionKeys`.

### Secondary Actions (Header)

Secondary actions appear in the top header bar. Configure their display order, visibility, collapsibility, sheets, docking, and shortcuts in `actions.secondary`. See the main [Customization doc](../Customization.md#actions) for the shared action configuration options.

## Settings

Audio settings are configured through `settings.keys` and `settings.order`. See the [Settings doc](./Settings.md) for details.

## Docking

Audio supports the same docking system as the reader. See the [Docking doc](../Docking.md) for details.

## Content Protection

See the [Audio Protection doc](./Protection.md) for audio-specific content protection options.
