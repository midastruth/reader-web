import { useCallback } from "react";

import { RSPrefs } from "@/preferences";

import Locale from "../../resources/locales/en.json";

import { 
  defaultSpacingSettingsMain, 
  defaultSpacingSettingsSubpanel, 
  ISettingsMapObject, 
  SettingsContainerKeys, 
  SpacingSettingsKeys 
} from "@/models/settings";

import { ReadingDisplayGroupWrapper } from "./Wrappers/ReadingDisplayGroupWrapper";

import { ReadingDisplayLetterSpacing } from "./ReadingDisplayLetterSpacing";
import { ReadingDisplayLineHeight } from "./ReadingDisplayLineHeight";
import { ReadingDisplayParaIndent } from "./ReadingDisplayParaIndent";
import { ReadingDisplayParaSpacing } from "./ReadingDisplayParaSpacing";
import { ReadingDisplayPublisherStyles } from "./ReadingDisplayPublisherStyles";
import { ReadingDisplayWordSpacing } from "./ReadingDisplayWordSpacing";

import { useAppDispatch } from "@/lib/hooks";
import { setSettingsContainer } from "@/lib/readerReducer";

const SpacingSettingsMap: { [key in SpacingSettingsKeys]: ISettingsMapObject } = {
  [SpacingSettingsKeys.letterSpacing]: {
    Comp: ReadingDisplayLetterSpacing
  },
  [SpacingSettingsKeys.lineHeight]: {
    Comp: ReadingDisplayLineHeight
  },
  [SpacingSettingsKeys.paraIndent]: {
    Comp: ReadingDisplayParaIndent
  },
  [SpacingSettingsKeys.paraSpacing]: {
    Comp: ReadingDisplayParaSpacing
  },
  [SpacingSettingsKeys.publisherStyles]: {
    Comp: ReadingDisplayPublisherStyles
  },
  [SpacingSettingsKeys.wordSpacing]: {
    Comp: ReadingDisplayWordSpacing
  }
}

export const ReadingDisplaySpacing = () => {
  const dispatch = useAppDispatch();
  
  const setSpacingContainer = useCallback(() => {
    dispatch(setSettingsContainer(SettingsContainerKeys.spacing));
  }, [dispatch]);

  return (
    <>
     <ReadingDisplayGroupWrapper 
      heading={ Locale.reader.settings.spacing.title }
      moreLabel={ Locale.reader.settings.spacing.advanced.trigger }
      moreTooltip={ Locale.reader.settings.spacing.advanced.tooltip }
      onMorePressCallback={ setSpacingContainer }
      settingsMap={ SpacingSettingsMap }
      prefs={ RSPrefs.settings.spacing }
      defaultPrefs={ {
        main: defaultSpacingSettingsMain, 
        subPanel: defaultSpacingSettingsSubpanel
      }}
    />
    </>
  );
}

export const ReadingDisplaySpacingContainer = () => {
  const displayOrder = RSPrefs.settings.spacing?.subPanel || defaultSpacingSettingsSubpanel;

  return(
    <>
    { displayOrder.map((key: SpacingSettingsKeys) => {
      const { Comp } = SpacingSettingsMap[key];
      return <Comp key={ key } standalone={ true } />;
    }) }
    </>
  )
}