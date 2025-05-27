import { useEffect } from "react";
import { Contrast } from "@/models/theme";
import { useMediaQuery } from "./useMediaQuery";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setContrast } from "@/lib/themeReducer";

export const useContrast = () => {
  const contrast = useAppSelector(state => state.theming.prefersContrast);
  const dispatch = useAppDispatch();

  const prefersNoContrast = useMediaQuery(`(prefers-contrast: ${ Contrast.none })`);
  const prefersLessContrast = useMediaQuery(`(prefers-contrast: ${ Contrast.less })`);
  const prefersMoreContrast = useMediaQuery(`(prefers-contrast: ${ Contrast.more })`);
  const prefersCustomContrast = useMediaQuery(`(prefers-contrast: ${ Contrast.custom })`);

  useEffect(() => {
    if (prefersNoContrast) {
      dispatch(setContrast(Contrast.none));
    } else if (prefersLessContrast) {
      dispatch(setContrast(Contrast.less));
    } else if (prefersMoreContrast) {
      dispatch(setContrast(Contrast.more));
    } else if (prefersCustomContrast) {
      dispatch(setContrast(Contrast.custom));
    }
  });

  return contrast;
}