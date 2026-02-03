import type { FontOption, FontSpec, WeightConfig } from "../preferences";
import type { ILinkInjectable, IUrlInjectable, IBlobInjectable } from "@readium/navigator";

/**
 * Builds a Google Fonts API v2 URL according to the specification.
 * @see https://developers.google.com/fonts/docs/css2
 */
const buildGoogleFontsV2Url = ({
  family,
  weights,
  styles = ["normal"],
  display
}: {
  family: string;
  weights: WeightConfig;
  styles?: FontSpec["styles"];
  display?: FontSpec["display"];
}): string => {
  const hasItalic = styles.includes("italic");
  const weightValues = weights.type === "values" 
    ? weights.weights.join(",") 
    : `${weights.min}..${weights.max}`;

  const familyParam = family.replace(/ /g, "+");
  let axesParam: string;
  
  if (hasItalic) {
    // With italic: ital,wght@0,400;1,400
    const variants = [
      `0,${weightValues}`,  // normal
      `1,${weightValues}`   // italic
    ];
    axesParam = `:ital,wght@${variants.join(";")}`;
  } else {
    // Without italic: wght@400
    axesParam = `:wght@${weightValues}`;
  }
  const displayParam = display ? `&display=${display}` : "";
  
  return `https://fonts.googleapis.com/css2?family=${familyParam}${axesParam}${displayParam}`;
};

type FontResource = (ILinkInjectable & IUrlInjectable) | (ILinkInjectable & IBlobInjectable);

export interface FontMetadata {
  injectionResources: FontResource[];
  fontStack: string;
  fontFamily: string;
}

const createGoogleFontResources = (font: FontOption): FontResource[] => {
  if (font.source.type !== "custom" || font.source.provider !== "google") {
    return [];
  }

  const { family, weights, display, styles } = font.spec;
  
  // Delegate URL construction to the dedicated helper function
  const url = buildGoogleFontsV2Url({
    family,
    weights,
    display,
    styles
  });

  return [
    { 
      as: "link",
      rel: "preconnect",
      url: "https://fonts.googleapis.com"
    },
    { 
      as: "link",
      rel: "preconnect",
      url: "https://fonts.gstatic.com",
      attributes: { crossOrigin: "anonymous" }
    },
    { 
      as: "link",
      rel: "stylesheet",
      url
    }
  ];
};

const getFontFormat = (path: string): string => {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "woff": return "woff";
    case "woff2": return "woff2";
    case "ttf": return "truetype";
    case "otf": return "opentype";
    case "eot": return "embedded-opentype";
    case "svg": return "svg";
    default: return "woff2"; // default to woff2 if unknown
  }
};

const createLocalFontResources = (font: FontOption): FontResource[] => {
  if (font.source.type !== "custom" || font.source.provider !== "local") {
    return [];
  }

  const { family } = font.spec;
  const fontPaths = font.source.paths;
  
  // Generate @font-face CSS rules for each font file
  const fontFaces = fontPaths.map(fontPath => {
    const format = getFontFormat(fontPath);
    const display = font.spec.display;
    
    let css = `
@font-face {
  font-family: "${family}";
  src: url("${fontPath}") format("${format}")`;
    
    if (display !== undefined) {
      css += `;
  font-display: ${display}`;
    }
    
    // Close the @font-face rule
    css += '\n}';
    
    return css;
  });
  
  const cssContent = fontFaces.join("\n");
  const blob = new Blob([cssContent], { type: "text/css" });
  
  return [{
    as: "link",
    rel: "stylesheet",
    blob: blob
  }];
};

export const getFontMetadata = (fontId: string, fonts: Record<string, FontOption>): FontMetadata => {
  const font = fonts[fontId];
  if (!font) {
    return { injectionResources: [], fontStack: "", fontFamily: "" };
  }

  let injectionResources: FontResource[] = [];
  const fontFamily = font.spec.family;
  let fontStack = fontFamily;

  if (font.source.type === "custom") {
    switch (font.source.provider) {
      case "google":
        injectionResources = createGoogleFontResources(font);
        break;
      case "local":
        injectionResources = createLocalFontResources(font);
        break;
    }
  }

  if (font.spec.fallbacks?.length) {
    const uniqueFallbacks = [...new Set(
      font.spec.fallbacks.filter(fallback => fallback.toLowerCase() !== fontFamily.toLowerCase())
    )];
    if (uniqueFallbacks.length > 0) {
      fontStack = `${fontFamily}, ${uniqueFallbacks.join(", ")}`;
    }
  }

  return { injectionResources, fontStack, fontFamily };
};
