import { useEffect } from "react";
import { ColorScheme } from "@/models/theme";
import { useMediaQuery } from "./useMediaQuery";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setColorScheme } from "@/lib/themeReducer";

export const useColorScheme = () => {
  const colorScheme = useAppSelector(state => state.theming.colorScheme);
  const dispatch = useAppDispatch();

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  useEffect(() => {
    dispatch(setColorScheme(
      prefersDarkMode ? 
      ColorScheme.dark : 
      ColorScheme.light
    ));
  }, [dispatch, prefersDarkMode]);

  return colorScheme;
}