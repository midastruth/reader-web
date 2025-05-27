import { useEffect } from "react";
import { useMediaQuery } from "./useMediaQuery";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setMonochrome } from "@/lib/themeReducer";

export const useMonochrome = () => {
  const isMonochrome = useAppSelector(state => state.theming.monochrome);
  const dispatch = useAppDispatch();

  const monochrome = useMediaQuery("(monochrome)");

  useEffect(() => {
    dispatch(setMonochrome(monochrome));
  }, [dispatch, monochrome]);

  return isMonochrome;
}