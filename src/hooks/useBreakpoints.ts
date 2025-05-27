import { useEffect } from "react";

import { RSPrefs } from "@/preferences";

import { BreakpointRange, BreakpointRanges, Breakpoints, StaticBreakpoints } from "@/models/staticBreakpoints";
import { useMediaQuery } from "./useMediaQuery";

import { setStaticBreakpoint } from "@/lib/themeReducer";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

export const useBreakpoints = () => {
  const staticBreakpoint = useAppSelector(state => state.theming.staticBreakpoint);
  const dispatch = useAppDispatch();

  const makeMediaString = (range: BreakpointRange | null) => {
    if (!range || (!range.min && !range.max)) return null;
  
    let mediaString = "screen"
    if (range.min) {
      mediaString += ` and (min-width: ${ range.min }px)`;
    }
    if (range.max) {
      mediaString += ` and (max-width: ${ range.max }px)`
    }
    return mediaString;
  };

  const initRanges = () => {
    const breakpointRanges: BreakpointRanges = {
      [StaticBreakpoints.compact]: null,
      [StaticBreakpoints.medium]: null,
      [StaticBreakpoints.expanded]: null,
      [StaticBreakpoints.large]: null,
      [StaticBreakpoints.xLarge]: null
    };
  
    let prev: null | number = null;
    
    Object.entries(RSPrefs.theming.breakpoints).forEach(([ key, value ]) => {
      if (value && !isNaN(value)) {
        const max = value;
        const min = prev ? prev + 1 : null;
        Object.defineProperty(breakpointRanges, key, {
          value: {
            min: min,
            max: max
          }
        });
        prev = value;
      } else if (!value && key === StaticBreakpoints.xLarge && prev) {
        Object.defineProperty(breakpointRanges, key, {
          value: {
            min: prev + 1,
            max: null
          }
        });
      }
    });

    return breakpointRanges;
  };

  const ranges = initRanges();

  const compactMedia = makeMediaString(ranges[StaticBreakpoints.compact]);
  const mediumMedia = makeMediaString(ranges[StaticBreakpoints.medium]);
  const expandedMedia = makeMediaString(ranges[StaticBreakpoints.expanded]);
  const largeMedia = makeMediaString(ranges[StaticBreakpoints.large]);
  const xLargeMedia = makeMediaString(ranges[StaticBreakpoints.xLarge]);

  const breakpoints: Breakpoints = {
    [StaticBreakpoints.compact]: useMediaQuery(compactMedia),
    [StaticBreakpoints.medium]: useMediaQuery(mediumMedia),
    [StaticBreakpoints.expanded]: useMediaQuery(expandedMedia),
    [StaticBreakpoints.large]: useMediaQuery(largeMedia),
    [StaticBreakpoints.xLarge]: useMediaQuery(xLargeMedia),
    current: staticBreakpoint,
    ranges: ranges
  };

  useEffect(() => {
    if (breakpoints[StaticBreakpoints.compact]) {
      dispatch(setStaticBreakpoint(StaticBreakpoints.compact));
    } else if (breakpoints[StaticBreakpoints.medium]) {
      dispatch(setStaticBreakpoint(StaticBreakpoints.medium));
    } else if (breakpoints[StaticBreakpoints.expanded]) {
      dispatch(setStaticBreakpoint(StaticBreakpoints.expanded))
    } else if (breakpoints[StaticBreakpoints.large]) {
      dispatch(setStaticBreakpoint(StaticBreakpoints.large));
    } else if (breakpoints[StaticBreakpoints.xLarge]) {
      dispatch(setStaticBreakpoint(StaticBreakpoints.xLarge))
    };
  });

  return breakpoints;
}