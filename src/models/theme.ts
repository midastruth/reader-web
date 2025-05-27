export enum ColorScheme {
  light = "light",
  dark = "dark"
}

export enum Contrast {
  none = "no-preference",
  more = "more",
  less = "less",
  custom = "custom"
}

export enum ThemeKeys {
  auto = "auto",
  light = "light",
  sepia = "sepia",
  dark = "dark",
  paper = "paper",
  contrast1 = "contrast1",
  contrast2 = "contrast2",
  contrast3 = "contrast3"
}

export interface IThemeTokens {
  background: string;
  text: string;
  link: string;
  visited: string;
  subdue: string;
  disable: string;
  hover: string;
  onHover: string;
  select: string;
  onSelect: string;
  focus: string;
  elevate: string;
  immerse: string;
};