import { useEffect, useRef } from "react";

export const useFirstFocusable = ({
  withinRef,
  trackedState,
  fallbackRef,
  updateState
}: { 
  withinRef: React.RefObject<HTMLElement | null>, 
  trackedState: boolean, 
  fallbackRef?: React.RefObject<HTMLElement | null>,
  updateState?: unknown
}) => {
  const focusedElement = useRef<HTMLElement | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    attemptsRef.current = 0;

    if (!withinRef.current || !trackedState) return;

    const tryFocus = () => {
      const targetElement = withinRef.current && withinRef.current.firstElementChild || withinRef.current;
      const selectedEl = targetElement && targetElement.querySelector("[data-selected]");

      let firstFocusable: HTMLElement | null = null;

      if (selectedEl === null) {
        const inputs = targetElement && targetElement.querySelectorAll("input");
        const input = inputs && Array.from(inputs).find((input: HTMLInputElement) => !input.disabled && input.tabIndex >= 0);
        firstFocusable = input as HTMLElement | null;
      } else if (selectedEl instanceof HTMLElement) {
        firstFocusable = selectedEl;
      }

      if (!firstFocusable) {
        const focusableElements = withinRef.current && withinRef.current.querySelectorAll("a, button, input, select");
        const element = focusableElements && Array.from(focusableElements).find(element => {
          const htmlElement = element as HTMLAnchorElement | HTMLButtonElement | HTMLInputElement | HTMLSelectElement;
          if (htmlElement instanceof HTMLAnchorElement) return true;
          return !htmlElement.disabled && htmlElement.tabIndex >= 0;
        });
        firstFocusable = element as HTMLElement | null;
      }

      if (firstFocusable) {
        firstFocusable.focus({ preventScroll: true });
        withinRef.current!.scrollTop = 0;
        focusedElement.current = firstFocusable;
      } else {
        attemptsRef.current++;
        if (attemptsRef.current < 3) {
          setTimeout(tryFocus, 50);
        } else {
          if (fallbackRef?.current) {
            fallbackRef.current.focus({ preventScroll: true });
            focusedElement.current = fallbackRef.current;
          }
        }
      }
    };

    tryFocus();

    return () => {
      attemptsRef.current = 0;
    };
  }, [trackedState, withinRef, fallbackRef, updateState]);

  return focusedElement.current;
}