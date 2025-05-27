import { useCallback, useEffect, useRef } from "react";

import { RSPrefs } from "@/preferences";
import { ColorScheme, ThemeKeys } from "@/models/theme";

import { useIsClient } from "./useIsClient";
import { useBreakpoints } from "./useBreakpoints";
import { useReducedMotion } from "./useReducedMotion";
import { useReducedTransparency } from "./useReducedTransparency";
import { useColorScheme } from "./useColorScheme";
import { useContrast } from "./useContrast";
import { useForcedColors } from "./useForcedColors";
import { useMonochrome } from "./useMonochrome";

import { useAppSelector } from "@/lib/hooks";

import { propsToCSSVars } from "@/helpers/propsToCSSVars";

// Takes care of the init of theming and side effects on :root/html
// Reader still has to handle the side effects on Navigator
export const useTheming = () => {
  const isClient = useIsClient()
  const breakpoints = useBreakpoints();
  const reducedMotion = useReducedMotion();
  const reducedTransparency = useReducedTransparency()
  const monochrome = useMonochrome();
  const colorScheme = useColorScheme();
  const colorSchemeRef = useRef(colorScheme);
  const contrast = useContrast();
  const forcedColors = useForcedColors();
  const theme = useAppSelector(state => state.theming.theme);

  const inferThemeAuto = useCallback(() => {
    return colorSchemeRef.current === ColorScheme.dark ? ThemeKeys.dark : ThemeKeys.light
  }, []);

  const initThemingCustomProps = useCallback(() => {
    if (!isClient) return;

    const props = {
      ...propsToCSSVars(RSPrefs.theming.arrow, "arrow"), 
      ...propsToCSSVars(RSPrefs.theming.icon, "icon"),
      ...propsToCSSVars(RSPrefs.theming.layout, "layout")
    } 
    for (let p in props) {
      document.documentElement.style.setProperty(p, props[p])
    }
  }, [isClient]);

  const setThemeCustomProps = useCallback((t: ThemeKeys) => {
    if (!isClient) return;

    if (t === ThemeKeys.auto) t = inferThemeAuto();
  
    const props = propsToCSSVars(RSPrefs.theming.themes.keys[t], "theme");
      
    for (let p in props) {
      document.documentElement.style.setProperty(p, props[p])
    }
  }, [isClient, inferThemeAuto]);

  // On mount add custom props to :root/html
  useEffect(() => {
    initThemingCustomProps();
  }, [initThemingCustomProps]);

  // Update theme custom props
  useEffect(() => {
    colorSchemeRef.current = colorScheme;
    setThemeCustomProps(theme);
  }, [setThemeCustomProps, theme, colorScheme]);

  return {
    breakpoints,
    reducedMotion, 
    reducedTransparency, 
    monochrome, 
    theme, 
    colorScheme,
    contrast, 
    forcedColors, 
    inferThemeAuto
  }
}