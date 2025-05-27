import { createSlice } from "@reduxjs/toolkit";

import { ReadingDisplayAlignOptions, ReadingDisplayLineHeightOptions, RSLayoutStrategy } from "@/models/layout";
import { ISettingsState } from "@/models/state/settingsState";

const initialState: ISettingsState = {
  columnCount: "auto",
  fontFamily: "publisher",
  fontSize: 1,
  fontWeight: 400,
  hyphens: null,
  layoutStrategy: RSLayoutStrategy.lineLength,
  letterSpacing: null,
  lineHeight: ReadingDisplayLineHeightOptions.publisher,
  lineLength: null,
  paragraphIndent: null,
  paragraphSpacing: null,
  publisherStyles: true,
  scroll: false,
  textAlign: ReadingDisplayAlignOptions.publisher,
  textNormalization: false,
  wordSpacing: null,
  tmpLineLengths: [],
  tmpMaxChars: false,
  tmpMinChars: false
}

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setColumnCount: (state, action) => {
      state.columnCount = action.payload
    },
    setFontFamily: (state, action) => {
      state.fontFamily = action.payload
    },
    setFontSize: (state, action) => {
      state.fontSize = action.payload
    },
    setFontWeight: (state, action) => {
      state.fontWeight = action.payload
    },
    setHyphens: (state, action) => {
      state.hyphens = action.payload
    },
    setLayoutStrategy: (state, action) => {
      state.layoutStrategy = action.payload
    },
    setLetterSpacing: (state, action) => {
      state.letterSpacing = action.payload
    },
    setLineHeight: (state, action) => {
      state.lineHeight = action.payload
    },
    setLineLength: (state, action) => {
      state.lineLength = action.payload
    },
    setParagraphIndent: (state, action) => {
      state.paragraphIndent = action.payload
    },
    setParagraphSpacing: (state, action) => {
      state.paragraphSpacing = action.payload
    },
    setPublisherStyles: (state, action) => {
      state.publisherStyles = action.payload
    },
    setScroll: (state, action) => {
      state.scroll = action.payload
    },
    setTextAlign: (state, action) => {
      state.textAlign = action.payload
    },
    setTextNormalization: (state, action) => {
      state.textNormalization = action.payload
    },
    setWordSpacing: (state, action) => {
      state.wordSpacing = action.payload
    },
    setTmpLineLengths: (state, action) => {
      state.tmpLineLengths = action.payload
    },
    setTmpMaxChars: (state, action) => {
      state.tmpMaxChars = action.payload
    },
    setTmpMinChars: (state, action) => {
      state.tmpMinChars = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { 
  setColumnCount,
  setFontSize,
  setFontWeight, 
  setFontFamily,
  setHyphens, 
  setLayoutStrategy,
  setLetterSpacing,
  setLineHeight,
  setLineLength,
  setParagraphIndent,
  setParagraphSpacing,
  setPublisherStyles,
  setScroll,
  setTextAlign,
  setTextNormalization, 
  setWordSpacing,
  setTmpLineLengths,
  setTmpMaxChars,
  setTmpMinChars
} = settingsSlice.actions;

export default settingsSlice.reducer;