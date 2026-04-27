import ReadiumCSSColors from "@readium/css/css/vars/colors.json";

export enum ThThemeKeys {
  light = "light",
  sepia = "sepia",
  dark = "dark",
  paper = "paper",
  contrast1 = "contrast1",
  contrast2 = "contrast2",
  contrast3 = "contrast3",
  solarizedLight = "solarizedLight",
  solarizedDark = "solarizedDark",
  gruvboxMaterialDark = "gruvboxMaterialDark",
  gruvboxMaterialLight = "gruvboxMaterialLight"
}

export const lightTheme = {
  background: ReadiumCSSColors.RS__backgroundColor, // Color of background
  text: ReadiumCSSColors.RS__textColor,    // Color of text
  link: "#0000ee",                // Color of links
  visited: "#551a8b",             // Color of visited links
  subdue: "#808080",              // Color of subdued elements
  disable: "#808080",             // color for :disabled
  hover: "#d9d9d9",               // color of background for :hover
  onHover: ReadiumCSSColors.RS__textColor, // color of text for :hover
  select: "#b4d8fe",              // color of selected background
  onSelect: "inherit",            // color of selected text
  focus: "#0067f4",               // color of :focus-visible
  elevate: "0px 0px 2px #808080", // drop shadow of containers
  immerse: "0.6"                  // opacity of immersive mode
}

export const darkTheme = {
  background: "#000000",
  text: "#FEFEFE",
  link: "#63caff",
  visited: "#0099E5",
  subdue: "#808080",
  disable: "#808080",
  hover: "#404040",
  onHover: "#FEFEFE",
  select: "#b4d8fe",
  onSelect: "inherit",
  focus: "#0067f4",
  elevate: "0px 0px 2px #808080",
  immerse: "0.4"
}

export const paperTheme = {
  background: "#faf4e8",
  text: "#121212",
  link: "#0000EE",
  visited: "#551A8B",
  subdue: "#8c8c8c",
  disable: "#8c8c8c",
  hover: "#edd7ab",
  onHover: "#121212",
  select: "#b4d8fe",
  onSelect: "inherit",
  focus: "#0067f4",
  elevate: "0px 0px 2px #8c8c8c",
  immerse: "0.5"
}

export const sepiaTheme = {
  background: "#e9ddc8",
  text: "#000000",
  link: "#0000EE",
  visited: "#551A8B",
  subdue: "#8c8c8c",
  disable: "#8c8c8c",
  hover: "#ccb07f",
  onHover: "#000000",
  select: "#b4d8fe",
  onSelect: "inherit",
  focus: "#004099",
  elevate: "0px 0px 2px #8c8c8c",
  immerse: "0.45"
}

export const contrast1Theme = {
  background: "#000000",
  text: "#ffff00",
  link: "#63caff",
  visited: "#0099E5",
  subdue: "#808000",
  disable: "#808000",
  hover: "#404040",
  onHover: "#ffff00",
  select: "#b4d8fe",
  onSelect: "inherit",
  focus: "#0067f4",
  elevate: "0px 0px 2px #808000",
  immerse: "0.4"
}

export const contrast2Theme = {
  background: "#181842",
  text: "#ffffff",
  link: "#adcfff",
  visited: "#7ab2ff",
  subdue: "#808080",
  disable: "#808080",
  hover: "#4444bb",
  onHover: "#ffffff",
  select: "#b4d8fe",
  onSelect: "inherit",
  focus: "#6BA9FF",
  elevate: "0px 0px 2px #808080",
  immerse: "0.4"
}

export const contrast3Theme = {
  background: "#c5e7cd",
  text: "#000000",
  link: "#0000EE",
  visited: "#551A8B",
  subdue: "#8c8c8c",
  disable: "#8c8c8c",
  hover: "#6fc383",
  onHover: "#000000",
  select: "#b4d8fe",
  onSelect: "inherit",
  focus: "#004099",
  elevate: "0px 0px 2px #8c8c8c",
  immerse: "0.45"
}

export const solarizedLightTheme = {
  background: "#fdf6e3", // Base3
  text: "#657b83",       // Base00
  link: "#268bd2",       // Blue
  visited: "#6c71c4",    // Violet
  subdue: "#93a1a1",     // Base1
  disable: "#93a1a1",    // Base1
  hover: "#eee8d5",      // Base2
  onHover: "#586e75",    // Base01
  select: "#2aa198",     // Cyan
  onSelect: "#fdf6e3",   // Base3
  focus: "#268bd2",      // Blue
  elevate: "0px 0px 2px #93a1a1",
  immerse: "0.6"
}

export const solarizedDarkTheme = {
  background: "#002b36", // Base03
  text: "#a0b6b8",
  link: "#268bd2",       // Blue
  visited: "#6c71c4",    // Violet
  subdue: "#586e75",     // Base01
  disable: "#586e75",    // Base01
  hover: "#073642",      // Base02
  onHover: "#a0b6b8",
  select: "#2aa198",     // Cyan
  onSelect: "#002b36",   // Base03
  focus: "#268bd2",      // Blue
  elevate: "0px 0px 2px #586e75",
  immerse: "0.4"
}

export const gruvboxMaterialDarkTheme = {
  background: "#282828", // bg0
  text: "#d4be98",       // fg
  link: "#7daea3",       // blue
  visited: "#d3869b",    // purple
  subdue: "#5a524c",     // bg5
  disable: "#5a524c",    // bg5
  hover: "#32302f",      // bg1
  onHover: "#d4be98",    // fg
  select: "#89b482",     // aqua
  onSelect: "#282828",   // bg0
  focus: "#7daea3",      // blue
  elevate: "0px 0px 2px #5a524c",
  immerse: "0.4"
}

export const gruvboxMaterialLightTheme = {
  background: "#f9f5d7", // bg0
  text: "#654735",       // fg
  link: "#45707a",       // blue
  visited: "#945e80",    // purple
  subdue: "#a89984",     // muted
  disable: "#a89984",
  hover: "#f2e5bc",      // bg3
  onHover: "#3c3836",    // fg dark
  select: "#4c7a5d",     // aqua
  onSelect: "#f9f5d7",   // bg0
  focus: "#45707a",      // blue
  elevate: "0px 0px 2px #a89984",
  immerse: "0.6"
}