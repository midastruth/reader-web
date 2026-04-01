"use client";

import { useCallback, useEffect, useRef } from "react";

import { Link } from "@readium/shared";
import { ThAudioActionKeys, ThLayoutDirection } from "@/preferences/models";

import TocIcon from "@/components/Actions/Toc/assets/icons/toc.svg";
import { useTocContent } from "@/components/Actions/Toc/useTocContent";
import { TocContent } from "@/components/Actions/Toc/TocContent";

import { StatefulActionIcon } from "../../../Actions/Triggers/StatefulActionIcon";
import { StatefulModalSheet } from "@/components/Sheets";

import audioStyles from "../assets/styles/thorium-web.audioActions.module.css";

import { useNavigator } from "@/core/Navigator";
import { useI18n } from "@/i18n/useI18n";
import { isActiveElement } from "@/core/Helpers/focusUtilities";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setActionOpen, toggleActionOpen } from "@/lib/actionsReducer";
import { setTocEntry } from "@/lib/publicationReducer";
import { setImmersive, setUserNavigated } from "@/lib/readerReducer";

import { Selection } from "react-aria-components";

export const StatefulAudioTocAction = ({ isDisabled }: { isDisabled: boolean }) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { t } = useI18n();
  const { goLink } = useNavigator().unified;
  const dispatch = useAppDispatch();

  const isOpen = useAppSelector(state => state.actions.keys[ThAudioActionKeys.toc]?.isOpen ?? false);
  const unstableTimeline = useAppSelector(state => state.publication.unstableTimeline);
  const tocEntry = unstableTimeline?.toc?.currentEntry ?? undefined;
  const tocTree = unstableTimeline?.toc?.tree;

  const direction = useAppSelector(state => state.reader.direction);
  const isRTL = direction === ThLayoutDirection.rtl;

  const setOpen = useCallback((value: boolean) => {
    dispatch(setActionOpen({ key: ThAudioActionKeys.toc, isOpen: value }));
  }, [dispatch]);

  const { expandedKeys, setExpandedKeys, filterValue, setFilterValue, displayedTocTree, treeRef, searchInputRef } =
    useTocContent({ isOpen, tocTree, tocEntry });

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (event: KeyboardEvent) => {
        if ((!isActiveElement(searchInputRef.current) && !filterValue) && event.key === "Escape") {
          setOpen(false);
        }
      };
      document.addEventListener("keydown", handleEscape, true);
      return () => document.removeEventListener("keydown", handleEscape, true);
    }
  }, [isOpen, filterValue, searchInputRef, setOpen]);

  const handleAction = (keys: Selection) => {
    if (keys === "all" || !keys || keys.size === 0) return;
    const key = [...keys][0];
    const el = document.querySelector(`[data-key=${key}]`);
    const href = el?.getAttribute("data-href");
    if (!href) return;
    goLink(new Link({ href }), true, () => {
      dispatch(setTocEntry(key));
      dispatch(setImmersive(true));
      dispatch(setUserNavigated(true));
      setOpen(false);
    });
  };

  return (
    <>
      <StatefulActionIcon
        ref={ triggerRef }
        tooltipLabel={ t("reader.tableOfContents.title") }
        placement="top"
        onPress={ () => dispatch(toggleActionOpen({ key: ThAudioActionKeys.toc })) }
        isDisabled={ isDisabled }
        className={ audioStyles.audioTocButton }
      >
        <TocIcon aria-hidden="true" focusable="false" />
      </StatefulActionIcon>
      <StatefulModalSheet
        id={ ThAudioActionKeys.toc }
        triggerRef={ triggerRef }
        heading={ t("reader.tableOfContents.title") }
        className=""
        isOpen={ isOpen }
        onOpenChange={ setOpen }
        onClosePress={ () => setOpen(false) }
        resetFocus={ tocEntry } 
        focusWithinRef={ treeRef }
      >
        <TocContent
          filterValue={ filterValue }
          onFilterChange={ setFilterValue }
          displayedTocTree={ displayedTocTree }
          tocTree={ tocTree }
          tocEntry={ tocEntry }
          expandedKeys={ expandedKeys }
          onExpandedChange={ setExpandedKeys }
          onSelectionChange={ handleAction }
          isRTL={ isRTL }
          treeRef={ treeRef }
          searchInputRef={ searchInputRef }
        />
      </StatefulModalSheet>
    </>
  );
};
