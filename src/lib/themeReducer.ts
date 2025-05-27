import { createSlice } from "@reduxjs/toolkit";

import { IThemeState } from "@/models/state/themingState";
import { ColorScheme, Contrast, ThemeKeys } from "@/models/theme";

const initialState: IThemeState = {
  monochrome: false,
  colorScheme: ColorScheme.light,
  theme: ThemeKeys.auto,
  prefersReducedMotion: false,
  prefersReducedTransparency: false, 
  prefersContrast: Contrast.none,
  forcedColors: false, 
  staticBreakpoint: undefined
}

export const themeSlice = createSlice({
  name: "theming",
  initialState,
  reducers: {
    setMonochrome: (state, action) => {
      state.monochrome = action.payload
    },
    setColorScheme: (state, action) => {
      state.colorScheme = action.payload
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    setReducedMotion: (state, action) => {
      state.prefersReducedMotion = action.payload
    },
    setReducedTransparency: (state, action) => {
      state.prefersReducedTransparency = action.payload
    },
    setContrast: (state, action) => {
      state.prefersContrast = action.payload
    },
    setForcedColors: (state, action) => {
      state.forcedColors = action.payload
    },
    setStaticBreakpoint: (state, action) => {
      state.staticBreakpoint = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { 
  setMonochrome, 
  setColorScheme, 
  setTheme, 
  setReducedMotion, 
  setReducedTransparency, 
  setContrast, 
  setForcedColors, 
  setStaticBreakpoint,
} = themeSlice.actions;

export default themeSlice.reducer;