import { useEffect } from "react";
import { useMediaQuery } from "./useMediaQuery";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setReducedTransparency } from "@/lib/themeReducer";

export const useReducedTransparency = () => {
  const reducedTransparency = useAppSelector(state => state.theming.prefersReducedTransparency);
  const dispatch = useAppDispatch();

  const prefersReducedTransparency = useMediaQuery("(prefers-reduced-transparency: reduce)");

  useEffect(() => {
    dispatch(setReducedTransparency(prefersReducedTransparency));
  }, [dispatch, prefersReducedTransparency]);

  return reducedTransparency;
}