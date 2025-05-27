import React, { useCallback, useEffect, useRef } from "react";

import { RSPrefs } from "@/preferences";
import Locale from "../resources/locales/en.json";

import { 
  ActionComponentVariant, 
  ActionKeys, 
  IActionComponentContainer, 
  IActionComponentTrigger 
} from "@/models/actions";
import { 
  defaultSpacingSettingsMain, 
  defaultSpacingSettingsSubpanel, 
  defaultTextSettingsMain, 
  defaultTextSettingsSubpanel, 
  ISettingsMapObject, 
  SettingsContainerKeys, 
  SettingsKeys, 
  SpacingSettingsKeys, 
  TextSettingsKeys 
} from "@/models/settings";
import { SheetHeaderVariant } from "@/models/sheets";

import settingsStyles from "./assets/styles/readerSettings.module.css";

import TuneIcon from "./assets/icons/match_case.svg";

import { SheetWithType } from "./Sheets/SheetWithType";
import { ActionIcon } from "./ActionTriggers/ActionIcon";
import { OverflowMenuItem } from "./ActionTriggers/OverflowMenuItem";

import { ReadingDisplayAlign } from "./Settings/ReadingDisplayAlign";
import { ReadingDisplayCol } from "./Settings/ReadingDisplayCol";
import { ReadingDisplayFontFamily } from "./Settings/ReadingDisplayFontFamily";
import { ReadingDisplayFontWeight } from "./Settings/ReadingDisplayFontWeight";
import { ReadingDisplayHyphens } from "./Settings/ReadingDisplayHyphens";
import { ReadingDisplayLayout } from "./Settings/ReadingDisplayLayout";
import { ReadingDisplayLetterSpacing } from "./Settings/ReadingDisplayLetterSpacing";
import { ReadingDisplayLineHeight } from "./Settings/ReadingDisplayLineHeight";
import { ReadingDisplayParaIndent } from "./Settings/ReadingDisplayParaIndent";
import { ReadingDisplayParaSpacing } from "./Settings/ReadingDisplayParaSpacing";
import { ReadingDisplayPublisherStyles } from "./Settings/ReadingDisplayPublisherStyles";
import { ReadingDisplaySpacing, ReadingDisplaySpacingContainer } from "./Settings/ReadingDisplaySpacing";
import { ReadingDisplayText, ReadingDisplayTextContainer } from "./Settings/ReadingDisplayText";
import { ReadingDisplayNormalizeText } from "./Settings/ReadingDisplayNormalizeText";
import { ReadingDisplayTheme } from "./Settings/ReadingDisplayTheme";
import { ReadingDisplayWordSpacing } from "./Settings/ReadingDisplayWordSpacing";
import { ReadingDisplayZoom } from "./Settings/ReadingDisplayZoom";

import { useDocking } from "@/hooks/useDocking";

import { setHovering, setSettingsContainer } from "@/lib/readerReducer";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setActionOpen } from "@/lib/actionsReducer";

const SettingsMap: { [key in SettingsKeys]: ISettingsMapObject } = {
  [SettingsKeys.align]: {
    Comp: ReadingDisplayAlign
  },
  [SettingsKeys.columns]: {
    Comp: ReadingDisplayCol
  },
  [SettingsKeys.fontFamily]: {
    Comp: ReadingDisplayFontFamily
  },
  [SettingsKeys.fontWeight]: {
    Comp: ReadingDisplayFontWeight
  },
  [SettingsKeys.hyphens]: {
    Comp: ReadingDisplayHyphens
  },
  [SettingsKeys.layout]: {
    Comp: ReadingDisplayLayout
  },
  [SettingsKeys.letterSpacing]: {
    Comp: ReadingDisplayLetterSpacing
  },
  [SettingsKeys.lineHeight]: {
    Comp: ReadingDisplayLineHeight
  },
  [SettingsKeys.paraIndent]: {
    Comp: ReadingDisplayParaIndent
  },
  [SettingsKeys.paraSpacing]: {
    Comp: ReadingDisplayParaSpacing
  },
  [SettingsKeys.publisherStyles]: {
    Comp: ReadingDisplayPublisherStyles
  },
  [SettingsKeys.spacing]: {
    Comp: ReadingDisplaySpacing
  },
  [SettingsKeys.text]: {
    Comp: ReadingDisplayText
  },
  [SettingsKeys.normalizeText]: {
    Comp: ReadingDisplayNormalizeText
  },
  [SettingsKeys.theme]: {
    Comp: ReadingDisplayTheme,
    props: {
      mapArrowNav: 2
    }
  },
  [SettingsKeys.wordSpacing]: {
    Comp: ReadingDisplayWordSpacing
  },
  [SettingsKeys.zoom]: {
    Comp: ReadingDisplayZoom
  }
}

export const SettingsActionContainer: React.FC<IActionComponentContainer> = ({ triggerRef }) => {
  const isFXL = useAppSelector(state => state.publication.isFXL);
  const contains = useAppSelector(state => state.reader.settingsContainer);
  const actionState = useAppSelector(state => state.actions.keys[ActionKeys.settings]);
  const dispatch = useAppDispatch();

  const settingItems = useRef(isFXL ? RSPrefs.settings.fxlOrder : RSPrefs.settings.reflowOrder);
  
  const docking = useDocking(ActionKeys.settings);
  const sheetType = docking.sheetType;

  const setOpen = (value: boolean) => {    
    dispatch(setActionOpen({
      key: ActionKeys.settings,
      isOpen: value
    }));

    // hover false otherwise it tends to stay on close button press…
    if (!value) dispatch(setHovering(false));
  }

  const setInitial = useCallback(() => {
    dispatch(setSettingsContainer(SettingsContainerKeys.initial));
  }, [dispatch]);

  const isTextNested = (key: SettingsKeys) => {
    return [
      RSPrefs.settings.text?.main || defaultTextSettingsMain,
      RSPrefs.settings.text?.subPanel || defaultTextSettingsSubpanel,
    ].some(arr => arr.includes(key as unknown as TextSettingsKeys));
  };

  const isSpacingNested = (key: SettingsKeys) => {
    return [
      RSPrefs.settings.spacing?.main || defaultSpacingSettingsMain,
      RSPrefs.settings.spacing?.subPanel || defaultSpacingSettingsSubpanel,
    ].some(arr => arr.includes(key as unknown as SpacingSettingsKeys));
  };

  const renderSettings = useCallback(() => {
    switch (contains) {
      case SettingsContainerKeys.text:
        return <ReadingDisplayTextContainer />;
      
      case SettingsContainerKeys.spacing:
        return <ReadingDisplaySpacingContainer />;

      case SettingsContainerKeys.initial:
      default:
        return (
          <>
            {
              settingItems.current
                .filter((key: SettingsKeys) => !(isTextNested(key) || isSpacingNested(key)))
                .map((key: SettingsKeys) => {
                  const setting = SettingsMap[key];
                  return <setting.Comp key={ key } { ...setting.props } />;
                })
            }
          </>
        );
    }
  }, [contains]);

  const getHeading = useCallback(() => {
    switch (contains) {
      case SettingsContainerKeys.text:
        return Locale.reader.settings.text.title;

      case SettingsContainerKeys.spacing:
        return Locale.reader.settings.spacing.title;

      case SettingsContainerKeys.initial:
      default:
        return Locale.reader.settings.heading;
    }
  }, [contains]);

  const getHeaderVariant = useCallback(() => {
    switch (contains) {
      case SettingsContainerKeys.text:
        return RSPrefs.settings.text?.header || SheetHeaderVariant.close;

      case SettingsContainerKeys.spacing:
        return RSPrefs.settings.spacing?.header || SheetHeaderVariant.close;

      case SettingsContainerKeys.initial:
      default:
        return SheetHeaderVariant.close;
    }
  }, [contains]);

useEffect(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" && contains !== SettingsContainerKeys.initial) {
      dispatch(setSettingsContainer(SettingsContainerKeys.initial));
    }
  };

  document.addEventListener("keydown", handleEscape, true);

  return () => {
    document.removeEventListener("keydown", handleEscape, true);
  };
}, [contains, dispatch]);


  // Reset when closed
  useEffect(() => {
    if (!actionState.isOpen) setInitial();
  }, [actionState.isOpen, setInitial]);

  return(
    <>
    <SheetWithType 
      sheetType={ sheetType }
      sheetProps={ {
        id: ActionKeys.settings,
        triggerRef: triggerRef,
        heading: getHeading(),
        headerVariant: getHeaderVariant(),
        className: settingsStyles.readerSettings,
        placement: "bottom", 
        isOpen: actionState.isOpen || false,
        onOpenChangeCallback: setOpen, 
        onClosePressCallback: () => { contains === SettingsContainerKeys.initial ? setOpen(false) : setInitial() },
        docker: docking.getDocker(),
        resetFocus: contains,
        dismissEscapeKeyClose: contains !== SettingsContainerKeys.initial
      } }
    >
      { renderSettings() }
    </SheetWithType>
    </>
  )
}

export const SettingsAction: React.FC<IActionComponentTrigger> = ({ variant }) => {
  const actionState = useAppSelector(state => state.actions.keys[ActionKeys.settings]);
  const dispatch = useAppDispatch();

  const setOpen = (value: boolean) => {    
    dispatch(setActionOpen({
      key: ActionKeys.settings,
      isOpen: value
    }));

    // hover false otherwise it tends to stay on close button press…
    if (!value) dispatch(setHovering(false));
  }

  return(
    <>
    { (variant && variant === ActionComponentVariant.menu) 
      ? <OverflowMenuItem 
          label={ Locale.reader.settings.trigger }
          SVG={ TuneIcon }
          shortcut={ RSPrefs.actions.keys[ActionKeys.settings].shortcut } 
          id={ ActionKeys.settings }
          onActionCallback={ () => setOpen(!actionState.isOpen) }
        />
      : <ActionIcon 
          visibility={ RSPrefs.actions.keys[ActionKeys.settings].visibility }
          ariaLabel={ Locale.reader.settings.trigger }
          SVG={ TuneIcon } 
          placement="bottom" 
          tooltipLabel={ Locale.reader.settings.tooltip } 
          onPressCallback={ () => setOpen(!actionState.isOpen) }
        />
    }
    </>
  )
}