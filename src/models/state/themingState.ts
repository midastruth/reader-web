import { StaticBreakpoints } from "../staticBreakpoints";
import { ColorScheme, Contrast, ThemeKeys } from "../theme";

export interface IThemeState {
  monochrome: boolean;
  colorScheme: ColorScheme;
  theme: ThemeKeys;
  prefersReducedMotion: boolean;
  prefersReducedTransparency: boolean;
  prefersContrast: Contrast;
  forcedColors: boolean;
  staticBreakpoint?: StaticBreakpoints;
}