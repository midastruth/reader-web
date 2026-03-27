"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button, Dialog, ListBox, ListBoxItem, Popover } from "react-aria-components";
import { FocusScope } from "react-aria";

import SnoozeIcon from "../assets/icons/snooze.svg";

import { ThAudioActionKeys, ThAudioKeys, ThSettingsTimerVariant } from "@/preferences/models";
import { StatefulActionIcon } from "../../../Actions/Triggers/StatefulActionIcon";
import { ThNumberField } from "@/core/Components/Settings/ThNumberField";

import audioStyles from "../assets/styles/thorium-web.audioControls.module.css";

import { useNavigator } from "@/core/Navigator";
import { useAudioPreferences } from "@/preferences/hooks/useAudioPreferences";
import { useI18n } from "@/i18n/useI18n";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { toggleActionOpen, setActionOpen } from "@/lib/actionsReducer";

export const StatefulSleepTimer = ({ isDisabled }: { isDisabled?: boolean }) => {
  const formatBadge = (seconds: number): string => {
    if (seconds < 60) return `${ seconds }s`;
    return `${ Math.ceil(seconds / 60) }m`;
  };

  const formatRemaining = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");
    if (h > 0) return `${ h }h ${ mm }m ${ ss }s`;
    return `${ mm }m ${ ss }s`;
  };
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const isOpen = useAppSelector(state => state.actions.keys[ThAudioActionKeys.sleepTimer]?.isOpen ?? false);
  const dispatch = useAppDispatch();

  const { t } = useI18n();
  const { preferences } = useAudioPreferences();
  const { pause } = useNavigator().media;
  const pauseRef = useRef(pause);
  pauseRef.current = pause;

  const config = preferences.settings.keys[ThAudioKeys.sleepTimer];
  const variant = config.variant;

  useEffect(() => {
    if (remainingSeconds === null) return;
    if (remainingSeconds <= 0) {
      pauseRef.current();
      setRemainingSeconds(null);
      return;
    }
    const id = setTimeout(() => {
      setRemainingSeconds(prev => prev !== null ? prev - 1 : null);
    }, 1000);
    return () => clearTimeout(id);
  }, [remainingSeconds]);

  const handleCancel = useCallback(() => {
    setRemainingSeconds(null);
    dispatch(setActionOpen({ key: ThAudioActionKeys.sleepTimer, isOpen: false }));
  }, [dispatch]);

  const handleStart = useCallback(() => {
    const totalSeconds = hours * 3600 + minutes * 60;
    if (totalSeconds <= 0) return;
    setRemainingSeconds(totalSeconds);
    dispatch(setActionOpen({ key: ThAudioActionKeys.sleepTimer, isOpen: false }));
  }, [hours, minutes, dispatch]);

  const handlePresetSelect = useCallback((key: string) => {
    setRemainingSeconds(key === "cancel" ? null : Number(key));
    dispatch(setActionOpen({ key: ThAudioActionKeys.sleepTimer, isOpen: false }));
  }, [dispatch]);

  const isActive = remainingSeconds !== null;
  const maxHours = (config.variant === ThSettingsTimerVariant.durationField ? config.maxHours : undefined) ?? 23;

  const renderContent = () => {
    if (variant === ThSettingsTimerVariant.presetList && config?.variant === ThSettingsTimerVariant.presetList) {
      return (
        <ListBox
          aria-label={ t("audio.settings.sleepTimer._") }
          className={ audioStyles.audioSleepTimerListbox }
          onAction={ (key) => handlePresetSelect(String(key)) }
        >
          { config.presets.map((seconds) => (
            <ListBoxItem
              key={ String(seconds) }
              id={ String(seconds) }
              className={ audioStyles.audioSleepTimerListboxItem }
            >
              { formatRemaining(seconds) }
            </ListBoxItem>
          )) }
          { isActive && (
            <ListBoxItem
              key="cancel"
              id="cancel"
              className={ `${ audioStyles.audioSleepTimerListboxItem } ${ audioStyles.audioSleepTimerListboxItemCancel }` }
            >
              { t("common.actions.cancel") }
            </ListBoxItem>
          ) }
        </ListBox>
      );
    }

    // durationField variant
    if (isActive) {
      return (
        <div className={ audioStyles.audioSleepTimerDurationField }>
          <p className={ audioStyles.audioSleepTimerRemaining }>
            { t("audio.settings.sleepTimer.remaining") } { formatRemaining(remainingSeconds!) }
          </p>
          <Button
            className={ audioStyles.audioSleepTimerActionButton }
            onPress={ handleCancel }
          >
            { t("common.actions.cancel") }
          </Button>
        </div>
      );
    }

    return (
      <div className={ audioStyles.audioSleepTimerDurationField }>
        <p className={ audioStyles.audioSleepTimerInstruction }>
          { t("audio.settings.sleepTimer.instruction") }
        </p>
        <div className={ audioStyles.audioSleepTimerInputs }>
          <ThNumberField
            aria-label={ t("audio.settings.sleepTimer.hours") }
            range={ [0, maxHours] }
            step={ 1 }
            value={ hours }
            onChange={ setHours }
            compounds={{
              group: { className: audioStyles.audioSleepTimerFieldGroup },
              input: { className: audioStyles.audioSleepTimerFieldInput }
            }}
          />
          <span className={ audioStyles.audioSleepTimerUnitLabel } aria-hidden="true">
            { t("audio.settings.sleepTimer.hours") }
          </span>
          <ThNumberField
            aria-label={ t("audio.settings.sleepTimer.minutes") }
            range={ [0, 59] }
            step={ 1 }
            value={ minutes }
            onChange={ setMinutes }
            compounds={{
              group: { className: audioStyles.audioSleepTimerFieldGroup },
              input: { className: audioStyles.audioSleepTimerFieldInput }
            }}
          />
          <span className={ audioStyles.audioSleepTimerUnitLabel } aria-hidden="true">
            { t("audio.settings.sleepTimer.minutes") }
          </span>
        </div>
        <Button
          className={ audioStyles.audioSleepTimerActionButton }
          isDisabled={ hours === 0 && minutes === 0 }
          onPress={ handleStart }
        >
          { t("audio.settings.sleepTimer.start") }
        </Button>
      </div>
    );
  };

  return (
    <>
      <StatefulActionIcon
        ref={ triggerRef }
        tooltipLabel={ t("audio.settings.sleepTimer._") }
        placement="top"
        onPress={ () => dispatch(toggleActionOpen({ key: ThAudioActionKeys.sleepTimer })) }
        isDisabled={ isDisabled }
        className={ audioStyles.audioSleepTimerButton }
      >
        <SnoozeIcon aria-hidden="true" focusable="false" />
        { isActive && (
          <span className={ audioStyles.audioSleepTimerLabel } aria-hidden="true">
            { formatBadge(remainingSeconds!) }
          </span>
        ) }
      </StatefulActionIcon>
      <Popover
        triggerRef={ triggerRef }
        isOpen={ isOpen }
        onOpenChange={ (open) => dispatch(setActionOpen({ key: ThAudioActionKeys.sleepTimer, isOpen: open })) }
        placement="top"
        className={ audioStyles.audioControlPopover }
      >
        <Dialog className={ audioStyles.audioControlPopoverDialog }>
          <FocusScope contain>
            { renderContent() }
          </FocusScope>
        </Dialog>
      </Popover>
    </>
  );
};
