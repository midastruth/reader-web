import { 
  IReadingDisplayGroupWrapperProps, 
  ISettingsMapObject, 
  SpacingSettingsKeys, 
  TextSettingsKeys 
} from "@/models/settings";

import settingsStyles from "../../assets/styles/readerSettings.module.css";

import { Heading } from "react-aria-components";
import { AdvancedIcon } from "./AdvancedIcon";

import classNames from "classnames";

export const ReadingDisplayGroupWrapper: React.FC<IReadingDisplayGroupWrapperProps> = ({
  heading,
  moreLabel,
  moreTooltip,
  onMorePressCallback,
  settingsMap,
  prefs,
  defaultPrefs
}) => {
  const main = prefs?.main || defaultPrefs.main;
    const displayOrder = prefs?.subPanel !== undefined 
      ? prefs.subPanel 
      : defaultPrefs.subPanel;
  
    const isAdvanced = (
      main.length < Object.keys(settingsMap).length && 
      displayOrder && displayOrder.length > 0
    );

  return(
    <>
    <div className={ classNames(settingsStyles.readerSettingsGroup, settingsStyles.readerSettingsAdvancedGroup) }>
      { isAdvanced && 
        <Heading className={ classNames(settingsStyles.readerSettingsLabel, settingsStyles.readerSettingsGroupLabel) }>
          { heading }
        </Heading> }
      { main.map((key: TextSettingsKeys | SpacingSettingsKeys, index) => {
        const { Comp } = (settingsMap as { [key in SpacingSettingsKeys | TextSettingsKeys]: ISettingsMapObject })[key];
        return <Comp key={ key } standalone={ !isAdvanced || index !== 0 } />;
      }) }
      { isAdvanced && (
        <AdvancedIcon
          className={ settingsStyles.readerSettingsAdvancedIcon }
          ariaLabel={ moreLabel }
          placement="top"
          tooltipLabel={ moreTooltip }
          onPressCallback={ onMorePressCallback }
        />
      ) }
    </div>
    </>
  )
}