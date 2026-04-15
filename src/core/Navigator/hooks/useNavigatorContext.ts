import { useContext, useRef } from "react";
import { NavigatorContext } from "../NavigatorProvider";
import { EpubSettings, WebPubSettings, FXLFrameManager, FrameManager, WebPubFrameManager } from "@readium/navigator";
import { Link, Locator } from "@readium/shared";

// Import the navigator hook types
import type { useEpubNavigator } from "../../Hooks/Epub/useEpubNavigator";
import type { useWebPubNavigator } from "../../Hooks/WebPub/useWebPubNavigator";
import type { useAudioNavigator } from "../../Hooks/Audio/useAudioNavigator";

// Define proper types for navigator interfaces
type VisualNavigator = ReturnType<typeof useEpubNavigator> | ReturnType<typeof useWebPubNavigator>;
type MediaNavigator = ReturnType<typeof useAudioNavigator>;

// Union of all settings keys across both navigator types
type AllVisualSettings = EpubSettings & WebPubSettings;

// Define the callback type used across navigators
type NavigationCallback = (ok: boolean) => void;

// Define the unified navigator interface
interface UnifiedNavigator {
  // Navigation methods available in both
  go(locator: Locator, animated: boolean, callback: NavigationCallback): void;
  goLink(link: Link, animated: boolean, callback: NavigationCallback): void;
  currentLocator(): Locator | undefined;
  
  // Unified previous/next navigation
  previousLocator(): Locator | null;
  nextLocator(): Locator | null;
  
  // Unified forward/backward navigation
  goForward(animated: boolean, callback: NavigationCallback): void;
  goBackward(animated: boolean, callback: NavigationCallback): void;
  
  // Check if navigator is visual
  isVisual(): boolean;
  
  // Visual-specific methods (only available when isVisual() is true)
  getCframes?(): (FXLFrameManager | FrameManager | WebPubFrameManager | undefined)[] | undefined;
  
  // Access to underlying navigator for advanced use cases
  underlying: VisualNavigator | MediaNavigator;
}

// getSetting wrapper covering all settings from both navigator types
const createUnifiedGetSetting = (navigator: VisualNavigator) => {
  return <K extends keyof AllVisualSettings>(settingKey: K): AllVisualSettings[K] => {
    return (navigator.getSetting as (key: K) => AllVisualSettings[K])(settingKey);
  };
};

// Type guards to check navigator type - using context reference instead of fragile method detection
const isVisualNavigator = (
  navigator: VisualNavigator | MediaNavigator, 
  contextVisual: VisualNavigator | undefined
): navigator is VisualNavigator => {
  return navigator === contextVisual;
};

export const useNavigator = () => {
  const context = useContext(NavigatorContext);
  if (!context) {
    throw new Error("useNavigator must be used within NavigatorProvider");
  }

  // Cache unified navigator to prevent recreation on every render
  const unifiedRef = useRef<UnifiedNavigator | null>(null);
  const contextVisualRef = useRef(context.visual);
  const contextMediaRef = useRef(context.media);

  // Only recreate unified navigator if context values have changed
  if (contextVisualRef.current !== context.visual || contextMediaRef.current !== context.media || !unifiedRef.current) {
    // Prefer visual navigator when available, fallback to media
    const navigator = context.visual || context.media;
    if (!navigator) throw new Error("No navigator available");
    
    const isVisual = isVisualNavigator(navigator, context.visual);
    
    unifiedRef.current = {
      go: (locator: Locator, animated: boolean, callback: NavigationCallback) => {
        return navigator.go(locator, animated, callback);
      },
      goLink: (link: Link, animated: boolean, callback: NavigationCallback) => {
        return navigator.goLink(link, animated, callback);
      },
      currentLocator: (): Locator | undefined => navigator.currentLocator(),
      
      previousLocator: (): Locator | null => {
        if (isVisual && navigator.previousLocator) {
          return navigator.previousLocator() || null;
        }
        return null;
      },
      
      nextLocator: (): Locator | null => {
        if (isVisual && navigator.nextLocator) {
          return navigator.nextLocator() || null;
        }
        return null;
      },
      
      goForward: (animated: boolean, callback: NavigationCallback) => {
        if (navigator.goForward) {
          return navigator.goForward(animated, callback);
        }
        return callback?.(false);
      },
      
      goBackward: (animated: boolean, callback: NavigationCallback) => {
        if (navigator.goBackward) {
          return navigator.goBackward(animated, callback);
        }
        return callback?.(false);
      },
      
      isVisual: () => isVisual,
      
      getCframes: isVisual ? navigator.getCframes?.bind(navigator) : undefined,
      
      underlying: navigator
    };
    
    contextVisualRef.current = context.visual;
    contextMediaRef.current = context.media;
  }

  return {
    get visual() {
      if (!context.visual) throw new Error("Visual navigator not available");
      
      // Create a wrapper that provides a unified getSetting interface
      const visualNavigator = context.visual;
      return {
        ...visualNavigator,
        getSetting: createUnifiedGetSetting(visualNavigator)
      };
    },
    get media() {
      if (!context.media) throw new Error("Media navigator not available");
      return context.media;
    },
    get unified(): UnifiedNavigator {
      if (!unifiedRef.current) {
        throw new Error("Unified navigator not available");
      }
      return unifiedRef.current;
    }
  };
};