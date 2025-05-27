import { useCallback, useEffect } from "react";
import { useIsClient } from "./useIsClient";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setFullscreen } from "@/lib/readerReducer";

export const useFullscreen = () => {
  const isClient = useIsClient();
  const isFullscreen = useAppSelector(state => state.reader.isFullscreen);
  const dispatch = useAppDispatch();

  const handleFullscreen = useCallback(() => {
    if (!isClient) return;

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, [isClient]);

  useEffect(() => {
    const onFSchange = () => {
      dispatch(setFullscreen(Boolean(document.fullscreenElement)));
    }
    document.addEventListener("fullscreenchange", onFSchange);

    return () => {
      document.removeEventListener("fullscreenchange", onFSchange);
    }
  }, [dispatch]);

  return {
    isFullscreen,
    handleFullscreen
  }
}