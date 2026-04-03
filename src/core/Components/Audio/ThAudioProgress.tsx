"use client";

import { useRef, useState } from "react";

import {
  Slider,
  SliderProps,
  SliderThumb,
  SliderThumbProps,
  SliderTrack,
  SliderTrackProps
} from "react-aria-components";
import { useOverlayPosition, OverlayContainer } from "react-aria";

import { WithRef } from "../customTypes";

export interface SeekableRange {
  start: number;
  end: number;
}

export interface ThAudioProgressProps {
  isDisabled?: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  currentChapter?: string;
  seekableRanges?: SeekableRange[];
  hoverLabel?: string;
  onHoverProgression?: (progression: number | null) => void;
  compounds?: {
    wrapper?: React.HTMLAttributes<HTMLDivElement>;
    chapter?: React.HTMLAttributes<HTMLDivElement>;
    slider?: WithRef<SliderProps, HTMLDivElement>;
    track?: WithRef<SliderTrackProps, HTMLDivElement>;
    thumb?: WithRef<SliderThumbProps, HTMLDivElement>;
    elapsedTime?: React.HTMLAttributes<HTMLSpanElement>;
    remainingTime?: React.HTMLAttributes<HTMLSpanElement>;
    seekableRange?: React.HTMLAttributes<HTMLDivElement>;
    tooltip?: React.HTMLAttributes<HTMLDivElement>;
  };
}

export const ThAudioProgress = ({
  isDisabled,
  currentTime,
  duration,
  onSeek,
  currentChapter,
  seekableRanges,
  hoverLabel,
  onHoverProgression,
  compounds
}: ThAudioProgressProps) => {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { overlayProps, updatePosition } = useOverlayPosition({
    targetRef: anchorRef,
    overlayRef,
    placement: "top",
    offset: 8,
    isOpen
  });

  const defaultElapsedTime = formatTime(currentTime);
  const defaultRemainingTime = formatTime(Math.max(0, duration - currentTime));

  function formatTime(seconds: number) {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hrs > 0
      ? `${ hrs }:${ mins.toString().padStart(2, "0") }:${ secs.toString().padStart(2, "0") }`
      : `${ mins }:${ secs.toString().padStart(2, "0") }`;
  }

  const validSeekableRanges = duration > 0
    ? (seekableRanges ?? []).filter(r => r.end <= duration)
    : [];

  const handleTrackMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (anchorRef.current) {
      anchorRef.current.style.left = `${ x * 100 }%`;
      updatePosition();
    }
    if (!isOpen) setIsOpen(true);
    onHoverProgression?.(x);
  };

  const handleTrackMouseLeave = () => {
    setIsOpen(false);
    onHoverProgression?.(null);
  };

  const { onMouseMove, onMouseLeave, ...trackProps } = compounds?.track ?? {};

  return (
    <div { ...compounds?.wrapper }>
      { currentChapter && (
        <div { ...compounds?.chapter }>
          { currentChapter }
        </div>
      ) }
      <Slider
        value={ currentTime }
        minValue={ 0 }
        maxValue={ duration || 0 }
        onChange={ (value) => onSeek(Array.isArray(value) ? value[0] : value) }
        isDisabled={ !!isDisabled }
        { ...compounds?.slider }
      >
        <SliderTrack
          onMouseMove={ (e) => { handleTrackMouseMove(e); onMouseMove?.(e); } }
          onMouseLeave={ (e) => { handleTrackMouseLeave(); onMouseLeave?.(e); } }
          { ...trackProps }
        >
          { validSeekableRanges.map((range, i) => (
            <div
              key={ i }
              { ...compounds?.seekableRange }
              style={{
                left: `${ (range.start / duration) * 100 }%`,
                width: `${ ((range.end - range.start) / duration) * 100 }%`,
                ...compounds?.seekableRange?.style,
              }}
            />
          )) }
          <span
            ref={ anchorRef }
            style={{ position: "absolute", left: "0%", width: 0, height: "100%", top: 0 }}
            aria-hidden="true"
          />
          <SliderThumb { ...compounds?.thumb } />
        </SliderTrack>
      </Slider>
      { isOpen && hoverLabel && (
        <OverlayContainer>
          <div
            ref={ overlayRef }
            { ...compounds?.tooltip }
            style={{ ...overlayProps.style, ...compounds?.tooltip?.style }}
          >
            { hoverLabel }
          </div>
        </OverlayContainer>
      ) }
      <span { ...compounds?.elapsedTime }>{ defaultElapsedTime }</span>
      <span { ...compounds?.remainingTime }>{ defaultRemainingTime }</span>
    </div>
  );
};
