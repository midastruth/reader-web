import { LocalStaticFontFile, FontSpec, WeightConfig, FontDefinition, LocalStaticFontSource, GoogleFontSource, VariableFontRangeConfig, FontCollection } from "../preferences";

interface CreateFontDefinitionParams {
  id: string;
  name: string;
  files: LocalStaticFontFile[];
  family?: string;
  fallbacks?: string[];
}

/**
 * Creates a complete font definition by inferring properties from static font files
 * @param params Font definition parameters
 * @returns Complete font definition with inferred spec
 * @throws Error if files are not static font files or if no files provided
 */
export const createDefinitionFromStaticFonts = (
  params: CreateFontDefinitionParams
): FontDefinition => {
  const { id, name, files, family, fallbacks = ["sans-serif"] } = params;
  
  if (!files || files.length === 0) {
    throw new Error("No files provided to infer font specification");
  }

  // Verify all files have weights (static fonts only)
  if (!files.every(file => file.weight !== undefined)) {
    throw new Error("All files must have explicit weights for static font specification inference");
  }

  const weights = Array.from(new Set(files.map(file => file.weight))).sort((a, b) => a - b);
  const styles = Array.from(new Set(files.map(file => file.style)));
  
  const source: LocalStaticFontSource = {
    type: "custom",
    provider: "local",
    variant: "static",
    files
  };
  
  const spec: FontSpec = {
    family: family || name,
    fallbacks,
    weights: {
      type: "static",
      values: weights
    },
    styles: styles
  };
  
  return {
    id,
    name,
    source,
    spec
  };
}

const DEFAULT_FALLBACK = "sans-serif";
const DEFAULT_WIDTH_STEP = 20;
const DEFAULT_WEIGHT_STEP = 20;

interface GoogleFontFamily {
  name: string;
  styles: ("normal" | "italic")[];
  weights: WeightConfig;
  widths?: VariableFontRangeConfig;
}

export interface GoogleFontDefinitionParams {
  cssUrl: string,
  options?: {
    widthStep?: number;
    weightStep?: number;
    display?: "swap" | "block" | "fallback" | "optional";
    fallbacks?: Record<string, string[]>; // derived fontId -> fallback array
  }
}

/**
 * Parses a Google Fonts CSS URL and creates font definitions for all families
 * @param params Google Fonts CSS URL and optional configuration for step values and display
 * @returns FontCollection object with all font definitions
 * @throws Error if CSS URL is invalid or cannot be parsed
 */
export const createDefinitionsFromGoogleFonts = (params: GoogleFontDefinitionParams): FontCollection => {
  const { cssUrl, options } = params;
  const { widthStep = DEFAULT_WIDTH_STEP, weightStep = DEFAULT_WEIGHT_STEP, display, fallbacks } = options || {};
  
  // Extract href from link tag if needed, otherwise use as-is
  const processedUrl = cssUrl.includes("href=") 
    ? cssUrl.match(/href=["']([^"']+)["']/)?.[1] || cssUrl
    : cssUrl;
  
  // Parse the URL using static method
  const url = new URL(processedUrl);
  if (!url.hostname.includes("fonts.googleapis.com")) {
    throw new Error("Invalid Google Fonts URL");
  }

  // Get all family parameters using searchParams
  const familyParams = url.searchParams.getAll("family");
  if (familyParams.length === 0) {
    throw new Error("No family parameter found in Google Fonts URL");
  }

  // Parse each family parameter
  const families = familyParams.map(familyParam => {
    const decodedFamily = decodeURIComponent(familyParam);
    const [familyName, axesStr] = decodedFamily.split(":");
    
    if (!familyName) {
      throw new Error(`Invalid family format: ${ familyParam }`);
    }

    const family: GoogleFontFamily = {
      name: familyName.replace(/\+/g, " "),
      styles: ["normal"],
      weights: { type: "static", values: [400] } // Default weight
    };
    
    // Track if we've seen any explicit weights in the URL
    let hasExplicitWeights = false;

    // Parse axes if present
    if (axesStr) {
      const [axisNames, valuesStr] = axesStr.split("@");
      if (axisNames && valuesStr) {
        const axes = axisNames.split(",");
        const variations = valuesStr.split(";");
        
        variations.forEach(variation => {
          const values = variation.split(",");
          axes.forEach((axis, index) => {
            const value = values[index];
            if (!value) return;
            
            switch (axis) {
              case "ital":
                if (value === "1") {
                  family.styles = Array.from(new Set([...family.styles, "italic"]));
                }
                break;
              case "wght":
                if (value.includes("..")) {
                  // Variable font - use the range
                  const [min, max] = value.split("..").map(Number);
                  if (!isNaN(min) && !isNaN(max)) {
                    family.weights = {
                      type: "range",
                      min,
                      max,
                      step: weightStep
                    };
                  }
                } else {
                  // Handle explicit weight from URL
                  const weight = Number(value);
                  if (!isNaN(weight) && family.weights.type === "static") {
                    const currentWeights = family.weights.values;
                    const newWeights = !hasExplicitWeights 
                      ? [weight]  // First weight replaces default
                      : Array.from(new Set([...currentWeights, weight])).sort((a, b) => a - b);  // Add to existing and deduplicate
                    
                    family.weights = {
                      type: "static",
                      values: newWeights
                    };
                    hasExplicitWeights = true;
                  }
                }
                break;
              case "wdth":
                if (value.includes("..")) {
                  const [min, max] = value.split("..").map(Number);
                  if (!isNaN(min) && !isNaN(max)) {
                    family.widths = {
                      min,
                      max,
                      step: widthStep
                    };
                  }
                }
                break;
            }
          });
        });
      }
    }

    return family;
  });

  // Convert families to FontCollection object
  return Object.fromEntries(
    families.map(family => {
      const fontId = family.name.toLowerCase().replace(/\s+/g, "-");
      return [
        fontId,
        {
          id: fontId,
          name: family.name,
          source: { type: "custom", provider: "google" } as GoogleFontSource,
          spec: {
            family: family.name,
            fallbacks: fallbacks?.[fontId] || [DEFAULT_FALLBACK],
            weights: family.weights,
            styles: family.styles,
            ...(family.widths && { widths: family.widths }),
            ...(display && { display })
          }
        }
      ];
    })
  ); 
} 
