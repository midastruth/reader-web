import type { FontDefinition, FontSpec, VariableFontRangeConfig, WeightConfig, ThFontFamilyPref, FontCollection, ValidatedLanguageCollection } from "../preferences";
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
  weights: WeightConfig | null;
  widths: VariableFontRangeConfig | null;
}

export interface FontService {
  getInjectables: (options?: { language?: string } | { key?: string }, optimize?: boolean) => InjectableFontResources | null;
  getFontMetadata: (fontId: string) => FontMetadata;
  getFontCollection: (options?: { language?: string } | { key?: string }) => FontCollection;
}

export const createFontService = (fontFamilyPref: ThFontFamilyPref): FontService => {
  const parsedFonts = new Map<string, FontMetadata>();
  const googleFonts = new Map<string, FontDefinition[]>();
  const localFonts = new Map<string, FontDefinition[]>();
  
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
    widths,
    display = "block",
    text
  }: {
    family: string;
    weights: WeightConfig;
    styles?: FontSpec["styles"];
    widths?: VariableFontRangeConfig;
    display?: FontSpec["display"];
    text?: string;
  }): string => {
    // If optimizing with text, just load the font family with the text parameter
    if (text) {
      return `https://fonts.googleapis.com/css2?family=${ family.replace(/ /g, "+") }&text=${ encodeURIComponent(text) }`;
    }

    const hasItalic = styles.includes("italic");
    const hasWidth = !!widths;
    const weightValues = weights.type === "static" 
      ? weights.values.join(",") 
      : `${ weights.min }..${ weights.max }`;
    const widthValues = hasWidth && widths ? `${ widths.min }..${ widths.max }` : undefined;

    const familyParam = family.replace(/ /g, "+");
    let axesParam: string;
    
    if (hasItalic && hasWidth) {
      // With italic and width: ital,wdth,wght@0,widthValues,weightValues;1,widthValues,weightValues
      const variants = [
        `0,${ widthValues },${ weightValues }`,  // normal
        `1,${ widthValues },${ weightValues }`   // italic
      ];
      axesParam = `:ital,wdth,wght@${ variants.join(";") }`;
    } else if (hasItalic) {
      // With italic only: ital,wght@0,weightValues;1,weightValues
      const variants = [
        `0,${ weightValues }`,  // normal
        `1,${ weightValues }`   // italic
      ];
      axesParam = `:ital,wght@${ variants.join(";") }`;
    } else if (hasWidth) {
      // With width only: wdth,wght@widthValues,weightValues
      axesParam = `:wdth,wght@${ widthValues },${ weightValues }`;
    } else {
      // Without italic or width: wght@weightValues
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

    const { family, weights, display, styles, widths } = font.spec;
    
    const url = buildGoogleFontsV2Url({
      family,
      weights,
      display,
      styles,
      widths,
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

    const { family, weights, display, widths } = font.spec;
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

      // Handle font width for variable fonts
      if (isVariable && widths) {
        rules.push(`  font-stretch: ${ widths.min }% ${ widths.max }%;`);
      }
      
      if (display) {
        rules.push(`  font-display: ${ display };`);
      }
      
      return rules.join("\n") + "\n}";
    }).filter(Boolean).join("\n\n");
    
    const blob = new Blob([cssContent], { type: "text/css" });
    
    // Return the font face as a stylesheet resource
    return {
      as: "link",
      rel: "stylesheet",
      blob: blob
    };
  };

  // Parse ALL fonts upfront - index by collection
  Object.entries(fontFamilyPref).forEach(([collectionName, collectionData]) => {
    // Handle both FontCollection and ValidatedLanguageCollection
    const fontCollection = "fonts" in collectionData ? 
      (collectionData as ValidatedLanguageCollection).fonts : 
      collectionData as FontCollection;
    
    // Initialize arrays for this collection
    googleFonts.set(collectionName, []);
    localFonts.set(collectionName, []);
    
    const collectionGoogleFonts = googleFonts.get(collectionName)!;
    const collectionLocalFonts = localFonts.get(collectionName)!;
    
    // Process each font in the collection
    Object.entries<FontDefinition>(fontCollection as Record<string, FontDefinition>).forEach(([id, font]) => {
      const fontFamily = font.spec.family;
      let fontStack = fontFamily;

      if (font.source.type === "custom") {
        switch (font.source.provider) {
          case "google":
            collectionGoogleFonts.push(font);
            break;
          case "local":
            collectionLocalFonts.push(font);
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
            .filter((fallback: string) => fallback.toLowerCase() !== fontFamily.toLowerCase())
            .map(wrapIfNeeded)
        )];
        if (uniqueFallbacks.length > 0) {
          fontStack = [wrappedFontFamily, ...uniqueFallbacks].join(", ");
        }
      }

      parsedFonts.set(id, { 
        fontStack: fontStack || wrappedFontFamily, 
        fontFamily: wrappedFontFamily,
        weights: font.spec.weights || null,
        widths: font.spec.widths || null
      });
    });
  });

  // Get default collection for fallback
  const defaultGoogleFonts = googleFonts.get("default") || [];
  const defaultLocalFonts = localFonts.get("default") || [];
  
  // Helper function to process fonts into injectable resources
  const processFonts = (googleFontsList: FontDefinition[], localFontsList: FontDefinition[], optimize: boolean = false): InjectableFontResources | null => {
    const result: InjectableFontResources = {
      allowedDomains: [],
      prepend: [],
      append: []
    };

    // Process Google Fonts
    const googleResources = googleFontsList
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
    const localResources = localFontsList
      .map(createLocalFontResources)
      .filter((resource): resource is FontResource => resource !== null);

    if (localResources.length > 0) {
      result.allowedDomains.push(window.location.origin);
      result.append.push(...localResources);
    }

    return result.append.length > 0 ? result : null;
  };

  return {
    getInjectables: (options, optimize = false) => {
      // Handle key-based selection
      if (options && "key" in options) {
        const { key } = options;
        
        if (!key || !(key in fontFamilyPref)) {
          return null;
        }
        
        return processFonts(googleFonts.get(key) || [], localFonts.get(key) || [], optimize);
      }
      
      // Handle language-based selection
      if (options && "language" in options) {
        const { language: publicationLanguage } = options;
        
        // Find the collection for this language (validation already done in createPreferences)
        for (const [collectionName, collectionData] of Object.entries(fontFamilyPref)) {
          if (collectionName === "default") continue;
          
          const supportedLangs = "supportedLanguages" in collectionData ? 
            collectionData.supportedLanguages : null;
            
          if (supportedLangs && Array.isArray(supportedLangs) && publicationLanguage && supportedLangs.includes(publicationLanguage)) {
            return processFonts(googleFonts.get(collectionName) || [], localFonts.get(collectionName) || [], optimize);
          }
        }
      }
      
      // Default behavior - return default collection
      return processFonts(defaultGoogleFonts, defaultLocalFonts, optimize);
    },
    
    getFontMetadata: (fontId: string) => {
      const parsed = parsedFonts.get(fontId);
      return parsed || { fontStack: null, fontFamily: null, weights: null, widths: null };
    },
    
    getFontCollection: (options) => {
      // Handle key-based selection
      if (options && "key" in options) {
        const { key } = options;
        
        if (!key || !(key in fontFamilyPref)) {
          return { ...fontFamilyPref.default };
        }
        
        const collection = fontFamilyPref[key as keyof typeof fontFamilyPref];
        return "fonts" in collection ? { ...collection.fonts } : { ...collection };
      }
      
      // Handle language-based selection
      if (options && "language" in options) {
        const { language: publicationLanguage } = options;
        
        // Find the collection for this language (validation already done in createPreferences)
        for (const [collectionName, collectionData] of Object.entries(fontFamilyPref)) {
          if (collectionName === "default") continue;
          
          const collection = "fonts" in collectionData ? collectionData : { fonts: collectionData };
          const supportedLangs = "supportedLanguages" in collection ? 
            collection.supportedLanguages : null;
            
          if (supportedLangs?.includes(publicationLanguage!)) {
            return { ...collection.fonts };
          }
        }

        // Fall back to default if no collection supports this language
        return { ...fontFamilyPref.default };
      }
      
      // Default behavior - return default collection
      return { ...fontFamilyPref.default };
    }
  };
};
