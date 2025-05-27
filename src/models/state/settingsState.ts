import { 
  ReadingDisplayAlignOptions, 
  ReadingDisplayFontFamilyOptions, 
  ReadingDisplayLineHeightOptions, 
  RSLayoutStrategy 
} from "../layout";

export interface ISettingsState {
  columnCount: string;
  fontFamily: keyof typeof ReadingDisplayFontFamilyOptions;
  fontSize: number;
  fontWeight: number;
  hyphens: boolean | null;
  layoutStrategy: RSLayoutStrategy;
  letterSpacing: number | null;
  lineHeight: ReadingDisplayLineHeightOptions;
  lineLength: number | null;
  tmpLineLengths: number[];
  tmpMaxChars: boolean;
  tmpMinChars: boolean;
  paragraphIndent: number | null;
  paragraphSpacing: number | null;
  publisherStyles: boolean;
  scroll: boolean;
  textAlign: ReadingDisplayAlignOptions;
  textNormalization: boolean;
  wordSpacing: number | null;
}