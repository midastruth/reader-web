import { ThPlugin } from "../PluginRegistry";
import { ThActionsKeys } from "@/preferences/models";
import { ThAudioKeys, ThAudioActionKeys } from "@/preferences/models/audio";

import { StatefulSettingsTrigger } from "../../Actions/Settings/StatefulSettingsTrigger";
import { StatefulAudioSettingsContainer } from "../../Actions/Settings/StatefulAudioSettingsContainer";
import { StatefulTocTrigger } from "../../Actions/Toc/StatefulTocTrigger";
import { StatefulTocContainer } from "../../Actions/Toc/StatefulTocContainer";
import { StatefulFullscreenTrigger } from "../../Actions/Fullscreen/StatefulFullscreenTrigger";

import { StatefulAudioSkipBackwardInterval } from "../../Audio/Settings/StatefulAudioSkipBackwardInterval";
import { StatefulAudioSkipForwardInterval } from "../../Audio/Settings/StatefulAudioSkipForwardInterval";
import { StatefulAudioSkipInterval } from "../../Audio/Settings/StatefulAudioSkipInterval";
import { StatefulAudioAutoPlay } from "../../Audio/Settings/StatefulAudioAutoPlay";
import { StatefulTheme } from "../../Settings/StatefulTheme";

import { StatefulAudioVolume } from "../../Audio/controls/Volume/StatefulAudioVolume";
import { StatefulAudioPlaybackRate } from "../../Audio/controls/PlaybackRate/StatefulAudioPlaybackRate";
import { StatefulAudioTocAction } from "../../Audio/controls/Toc/StatefulAudioTocAction";
import { StatefulSleepTimer } from "../../Audio/controls/SleepTimer/StatefulSleepTimer";

export const createAudioDefaultPlugin = (): ThPlugin => {
  return {
    id: "audio-core",
    name: "Audio Core Components",
    description: "Default components for Thorium Web Audio StatefulReader",
    version: "1.0.0",
    components: {
      actions: {
        [ThActionsKeys.settings]: {
          Trigger: StatefulSettingsTrigger,
          Target: StatefulAudioSettingsContainer
        },
        [ThActionsKeys.toc]: {
          Trigger: StatefulTocTrigger,
          Target: StatefulTocContainer
        },
        [ThActionsKeys.fullscreen]: {
          Trigger: StatefulFullscreenTrigger
        }
      },
      primaryAudioActions: {
        [ThAudioActionKeys.volume]:       StatefulAudioVolume,
        [ThAudioActionKeys.playbackRate]: StatefulAudioPlaybackRate,
        [ThAudioActionKeys.toc]:          StatefulAudioTocAction,
        [ThAudioActionKeys.sleepTimer]:   StatefulSleepTimer,
      },
      settings: {
        [ThAudioKeys.theme]: {
          Comp: StatefulTheme
        },
        [ThAudioKeys.skipInterval]: {
          Comp: StatefulAudioSkipInterval
        },
        [ThAudioKeys.skipBackwardInterval]: {
          Comp: StatefulAudioSkipBackwardInterval
        },
        [ThAudioKeys.skipForwardInterval]: {
          Comp: StatefulAudioSkipForwardInterval
        },
        [ThAudioKeys.autoPlay]: {
          Comp: StatefulAudioAutoPlay
        }
      }
    }
  };
};
