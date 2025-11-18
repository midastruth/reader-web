"use client";

import { useRef, KeyboardEvent } from "react";

import { ThPagination, ThPaginationProps } from "@/core/Components/Reader/ThPagination";

import readerPaginationStyles from "./assets/styles/thorium-web.reader.pagination.module.css";
  
export const StatefulReaderPagination = ({
  ref,
  links,
  compounds,
  children,
  ...props
}: ThPaginationProps) => {
  const previousButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const updatedCompounds = {
    ...compounds,
    previousButton: {
      ...compounds?.previousButton,
      ref: previousButtonRef,
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          previousButtonRef.current?.blur();
        }
      }
    },
    nextButton: {
      ...compounds?.nextButton,
      ref: nextButtonRef,
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          nextButtonRef.current?.blur();
        }
      }
    }
  };

  return (
    <ThPagination 
      ref={ ref } 
      className={ readerPaginationStyles.wrapper }
      links={ links } 
      compounds={ updatedCompounds } 
      { ...props }
    >
      { children }
    </ThPagination>
  )
}