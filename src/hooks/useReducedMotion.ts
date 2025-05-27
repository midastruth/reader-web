import { useEffect } from "react";
import { useMediaQuery } from "./useMediaQuery";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setReducedMotion } from "@/lib/themeReducer";

export const useReducedMotion = () => {
  const reducedMotion = useAppSelector(state => state.theming.prefersReducedMotion);
  const dispatch = useAppDispatch();

  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    dispatch(setReducedMotion(prefersReducedMotion));
  }, [dispatch, prefersReducedMotion]);

  return reducedMotion;
}