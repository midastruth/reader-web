"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Dialog, ListBox, ListBoxItem, Popover } from "react-aria-components";

import SnoozeIcon from "../assets/icons/snooze.svg";

import { StatefulActionIcon } from "../../../Actions/Triggers/StatefulActionIcon";

import audioStyles from "../assets/styles/thorium-web.audioControls.module.css";

import { useNavigator } from "@/core/Navigator";
import { useI18n } from "@/i18n/useI18n";

const PRESETS = [
  { label: "15 min", seconds: 15 * 60 },
  { label: "30 min", seconds: 30 * 60 },
  { label: "45 min", seconds: 45 * 60 },
  { label: "60 min", seconds: 60 * 60 },
  { label: "90 min", seconds: 90 * 60 },
];

function formatBadge(seconds: number): string {
  if (seconds < 60) return `${ seconds }s`;
  return `${ Math.ceil(seconds / 60) }m`;
}

export const StatefulSleepTimer = ({ isDisabled }: { isDisabled?: boolean }) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const { t } = useI18n();
  const { pause } = useNavigator().media;
  const pauseRef = useRef(pause);
  pauseRef.current = pause;

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

  const handleSelect = useCallback((key: string) => {
    setRemainingSeconds(key === "cancel" ? null : Number(key));
    setIsOpen(false);
  }, []);

  const isActive = remainingSeconds !== null;

  return (
    <>
      <StatefulActionIcon
        ref={ triggerRef }
        tooltipLabel={ t("audio.settings.sleepTimer") }
        placement="top"
        onPress={ () => setIsOpen(prev => !prev) }
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
        onOpenChange={ setIsOpen }
        placement="top"
        className={ audioStyles.audioControlPopover }
      >
        <Dialog className={ audioStyles.audioControlPopoverDialog }>
          <ListBox
            aria-label={ t("audio.settings.sleepTimer") }
            className={ audioStyles.audioSleepTimerListbox }
            onAction={ (key) => handleSelect(String(key)) }
          >
            { PRESETS.map(({ label, seconds }) => (
              <ListBoxItem
                key={ String(seconds) }
                id={ String(seconds) }
                className={ audioStyles.audioSleepTimerListboxItem }
              >
                { label }
              </ListBoxItem>
            )) }
            { isActive && (
              <ListBoxItem
                key="cancel"
                id="cancel"
                className={ audioStyles.audioSleepTimerListboxItem }
                data-cancel
              >
                { t("common.actions.cancel") }
              </ListBoxItem>
            ) }
          </ListBox>
        </Dialog>
      </Popover>
    </>
  );
};
