import { createSlice } from "@reduxjs/toolkit";

import { IReaderState } from "@/models/state/readerState";
import { defaultPlatformModifier } from "@/helpers/keyboard/getMetaKeys";
import { LayoutDirection } from "@/models/layout";
import { SettingsContainerKeys } from "@/models/settings";

const initialState: IReaderState = {
  direction: LayoutDirection.ltr,
  isLoading: true,
  isImmersive: false,
  isHovering: false,
  hasArrows: true,
  isFullscreen: false,
  settingsContainer: SettingsContainerKeys.initial,
  platformModifier: defaultPlatformModifier
}

export const readerSlice = createSlice({
  name: "reader",
  initialState,
  reducers: {
    setDirection: (state, action) => {
      state.direction = action.payload
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setPlatformModifier: (state, action) => {
      state.platformModifier = action.payload
    },
    setImmersive: (state, action) => {
      state.isImmersive = action.payload
    },
    toggleImmersive: (state) => {
      state.isImmersive = !state.isImmersive;
    },
    setHovering: (state, action) => {
      state.isHovering = action.payload
    },
    setArrows: (state, action) => {
      state.hasArrows = action.payload
    },
    setFullscreen: (state, action) => {
      state.isFullscreen = action.payload
    },
    setSettingsContainer: (state, action) => {
      state.settingsContainer = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { 
  setDirection, 
  setLoading,
  setPlatformModifier, 
  setImmersive, 
  toggleImmersive, 
  setHovering, 
  setArrows, 
  setFullscreen, 
  setSettingsContainer
} = readerSlice.actions;

export default readerSlice.reducer;