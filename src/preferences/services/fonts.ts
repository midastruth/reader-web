import type { FontDefinition, FontSpec, WeightConfig } from "../preferences";
import type { ILinkInjectable, IUrlInjectable, IBlobInjectable } from "@readium/navigator";

type FontResource = (ILinkInjectable & IUrlInjectable) | (ILinkInjectable & IBlobInjectable);

export interface InjectableFontResources {
  allowedDomains: string[];
  prepend: FontResource[];
  append: FontResource[];
}

export interface FontMetadata {
  fontStack: string | null;
  fontFamily: string | null;
}

export interface FontService {
  getInjectables: (optimize?: boolean) => InjectableFontResources | null;
  getFontMetadata: (currentFont: string) => FontMetadata;
}

export const createFontService = (fonts: Record<string, FontDefinition>): FontService => {
  const parsedFonts = new Map<string, FontMetadata>();
  const googleFonts: FontDefinition[] = [];
  const localFonts: FontDefinition[] = [];
  
  /**
   * Determines the font format from a file path
   */
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

  /**
   * Builds a Google Fonts API v2 URL according to the specification.
   * @see https://developers.google.com/fonts/docs/css2
   */
  const buildGoogleFontsV2Url = ({
    family,
    weights,
    styles = ["normal"],
    display = "block",
    text
  }: {
    family: string;
    weights: WeightConfig;
    styles?: FontSpec["styles"];
    display?: FontSpec["display"];
    text?: string;
  }): string => {
    // If optimizing with text, just load the font family with the text parameter
    if (text) {
      return `https://fonts.googleapis.com/css2?family=${ family.replace(/ /g, "+") }&text=${ encodeURIComponent(text) }`;
    }

    const hasItalic = styles.includes("italic");
    const weightValues = weights.type === "values" 
      ? weights.weights.join(",") 
      : `${ weights.min }..${ weights.max }`;

    const familyParam = family.replace(/ /g, "+");
    let axesParam: string;
    
    if (hasItalic) {
      // With italic: ital,wght@0,400;1,400
      const variants = [
        `0,${ weightValues }`,  // normal
        `1,${ weightValues }`   // italic
      ];
      axesParam = `:ital,wght@${ variants.join(";") }`;
    } else {
      // Without italic: wght@400
      axesParam = `:wght@${ weightValues }`;
    }
    const displayParam = display ? `&display=${ display }` : "";
    
    return `https://fonts.googleapis.com/css2?family=${ familyParam }${ axesParam }${ displayParam }`;
  };

  /**
   * Creates Google Font resources for injection
   */
  const createGoogleFontResources = (font: FontDefinition, text?: string): FontResource | null => {
    if (font.source.type !== "custom" || font.source.provider !== "google") {
      return null;
    }

    const { family, weights, display, styles } = font.spec;
    
    const url = buildGoogleFontsV2Url({
      family,
      weights,
      display,
      styles,
      text
    });

    return { 
      as: "link",
      rel: "stylesheet",
      url
    };
  };

  /**
   * Creates local font resources for injection
   */
  const createLocalFontResources = (font: FontDefinition): FontResource | null => {
    if (font.source.type !== "custom" || font.source.provider !== "local") {
      return null;
    }

    const { family, weights, display } = font.spec;
    const fontFiles = font.source.files || [];
    
    // Generate CSS for each font file
    const cssContent = fontFiles.map(fontFile => {
      const format = getFontFormat(fontFile.path);
      const fontUrl = new URL(fontFile.path, window.location.origin).toString();

      // Check if this is a variable font
      const isVariable = font.source.type === "custom" && 
                         font.source.provider === "local" && 
                         "variant" in font.source && 
                         font.source.variant === "variable";
      
      const rules = [
        `@font-face {`,
        `  font-family: "${ family }";`,
        `  src: url("${ fontUrl }") format("${ format }");`
      ];

      // Handle font weight
      if (isVariable && weights.type === "range") {
        rules.push(`  font-weight: ${ weights.min } ${ weights.max };`);
      } else if ("weight" in fontFile) {
        rules.push(`  font-weight: ${ fontFile.weight };`);
      }

      // Handle font style
      if ("style" in fontFile) {
        rules.push(`  font-style: ${ fontFile.style };`);
      }
      
      if (display) {
        rules.push(`  font-display: ${ display };`);
      }
      
      return rules.join("\n") + "\n}";
    }).join("\n\n");
    
    const blob = new Blob([cssContent], { type: "text/css" });
    
    // Return the font face as a stylesheet resource
    return {
      as: "link",
      rel: "stylesheet",
      blob: blob
    };
  };

  // Parse fonts for metadata and sort during parsing
  
  Object.entries(fonts).forEach(([id, font]) => {
    const fontFamily = font.spec.family;
    let fontStack = fontFamily;

    if (font.source.type === "custom") {
      switch (font.source.provider) {
        case "google":
          googleFonts.push(font);
          break;
        case "local":
          localFonts.push(font);
          break;
      }
    }

    const wrapIfNeeded = (name: string): string => {
      const trimmed = name.trim();
      if (!trimmed) return "";
      
      // If the name has spaces and isn't already wrapped in quotes
      if (trimmed.includes(" ") && !/^['"].*['"]$/.test(trimmed)) {
        return `"${ trimmed }"`;
      }
      return trimmed;
    };

    const wrappedFontFamily = wrapIfNeeded(fontFamily);
    
    if (font.spec.fallbacks?.length) {
      const uniqueFallbacks = [...new Set(
        font.spec.fallbacks
          .filter(fallback => fallback.toLowerCase() !== fontFamily.toLowerCase())
          .map(wrapIfNeeded)
      )];
      if (uniqueFallbacks.length > 0) {
        fontStack = [wrappedFontFamily, ...uniqueFallbacks].join(", ");
      }
    }

    parsedFonts.set(id, { 
      fontStack: fontStack || wrappedFontFamily, 
      fontFamily: wrappedFontFamily 
    });
  });

  return {
    getInjectables: (optimize?: boolean) => {
      const result: InjectableFontResources = {
        allowedDomains: [],
        prepend: [],
        append: []
      };

      // Process Google Fonts
      const googleResources = googleFonts
        .map(font => createGoogleFontResources(font, optimize ? font.name : undefined))
        .filter((resource): resource is FontResource => resource !== null);

      if (googleResources.length > 0) {
        result.allowedDomains.push(
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com"
        );
        
        result.prepend.push(
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
          }
        );
        
        result.append.push(...googleResources);
      }

      // Process Local Fonts
      const localResources = localFonts
        .map(createLocalFontResources)
        .filter((resource): resource is FontResource => resource !== null);

      if (localResources.length > 0) {
        result.allowedDomains.push(window.location.origin);
        result.append.push(...localResources);
      }

      // Only return the result if we have resources
      return result.append.length > 0 ? result : null;
    },
    
    getFontMetadata: (fontId: string) => {
      const parsed = parsedFonts.get(fontId);
      return parsed ? { fontStack: parsed.fontStack, fontFamily: parsed.fontFamily } 
                    : { fontStack: null, fontFamily: null };
    }
  };
};
