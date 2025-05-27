import { useEffect } from "react";
import { useMediaQuery } from "./useMediaQuery";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setForcedColors } from "@/lib/themeReducer";

export const useForcedColors = () => {
  const colors = useAppSelector(state => state.theming.forcedColors);
  const dispatch = useAppDispatch();

  const forcedColors = useMediaQuery("(forced-colors: active)");

  useEffect(() => {

    dispatch(setForcedColors(forcedColors));
  }, [dispatch, forcedColors]);

  return colors;
}