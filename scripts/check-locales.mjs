#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOCALES_DIR = join(__dirname, "../public/locales");
const SOURCE_DIR = join(__dirname, "../src");
const REFERENCE_LANG = "en";

/**
 * Extract all translation keys from source code
 */
function extractUsedKeys() {
  const usedKeys = new Set();
  
  function processFile(filePath) {
    try {
      const content = readFileSync(filePath, "utf8");
      
      // Match t("key") patterns - more precise regex for useI18n hook
      // Only match strings that look like translation keys (contain dots and are reasonable length)
      const tMatches = content.matchAll(/t\(\s*['"`]([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)+)['"`]\s*[,\)]/g);
      for (const match of tMatches) {
        // Remove plural suffixes for counting purposes
        const baseKey = match[1].replace(/_(zero|one|two|few|many|other)$/, "");
        usedKeys.add(baseKey);
      }
      
      // Match dynamic key patterns like t(`${prefix}.trigger`) - extract static parts
      const dynamicMatches = content.matchAll(/t\(\s*`([^`]+)`\s*[,\)]/g);
      for (const match of dynamicMatches) {
        const template = match[1];
        // Extract static parts from template literals
        const staticParts = template.split("${").map(part => part.split("}")[0]).filter(Boolean);
        staticParts.forEach(part => {
          if (part.includes(".") && /^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)+\.?$/.test(part)) {
            // Remove plural suffixes for counting purposes
            const baseKey = part.replace(/\.$/, "").replace(/_(zero|one|two|few|many|other)$/, "");
            usedKeys.add(baseKey);
          }
        });
      }
    } catch (error) {
      // Silently ignore files that can't be processed
    }
  }
  
  function processDirectory(dir) {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith(".") && item !== "node_modules") {
        processDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith(".tsx") || item.endsWith(".ts"))) {
        processFile(fullPath);
      }
    }
  }
  
  processDirectory(SOURCE_DIR);
  return Array.from(usedKeys);
}

/**
 * Check if a key is defined in reference locale files
 * @returns {Object} { exists: boolean, sourceFile?: string }
 */
function isKeyDefinedInReference(key, refFiles) {
  for (const file of refFiles) {
    const refPath = join(LOCALES_DIR, REFERENCE_LANG, file);
    try {
      const content = readFileSync(refPath, "utf8");
      const data = JSON.parse(content);
      
      // Check if the base key exists
      if (keyExists(data, key)) {
        return { exists: true, sourceFile: file };
      }
      
      // For plural forms, check if there are _one, _other, etc. variants
      const pluralVariants = ["_zero", "_one", "_two", "_few", "_many", "_other"];
      for (const variant of pluralVariants) {
        if (keyExists(data, key + variant)) {
          return { exists: true, sourceFile: file };
        }
      }
    } catch (error) {
      continue;
    }
  }
  return { exists: false };
}

/**
 * Extract all translation keys from locale files
 */
function extractDefinedKeys() {
  const definedKeys = [];
  const refFiles = readdirSync(join(LOCALES_DIR, REFERENCE_LANG))
    .filter(file => file.endsWith(".json"));
  
  for (const file of refFiles) {
    const filePath = join(LOCALES_DIR, REFERENCE_LANG, file);
    try {
      const content = readFileSync(filePath, "utf8");
      const data = JSON.parse(content);
      
      function traverse(obj, prefix = "") {
        for (const key in obj) {
          const fullKey = prefix ? `${ prefix }.${ key }` : key;
          if (typeof obj[key] === "object" && obj[key] !== null) {
            traverse(obj[key], fullKey);
          } else {
            definedKeys.push(fullKey);
          }
        }
      }
      
      traverse(data);
    } catch (error) {
      console.warn(`Warning: Could not read ${ file }: ${ error.message }`);
    }
  }
  
  return definedKeys;
}

/**
 * Counts all properties in an object recursively
 */
function countProperties(obj) {
  if (obj === null || typeof obj !== "object") return 1;
  return Object.values(obj).reduce((sum, val) => sum + countProperties(val), 0);
}

/**
 * Compares two objects and counts missing/empty properties
 */
function compareLocales(reference, target) {
  if (reference === null || typeof reference !== "object") {
    return {
      missing: !target || (typeof target === "string" && target.trim() === "") ? 1 : 0,
      total: 1
    };
  }

  if (Array.isArray(reference)) {
    return { missing: Array.isArray(target) ? 0 : 1, total: 1 };
  }

  return Object.entries(reference).reduce(
    (result, [key, refValue]) => {
      const comparison = compareLocales(refValue, target?.[key]);
      return {
        missing: result.missing + comparison.missing,
        total: result.total + comparison.total
      };
    },
    { missing: 0, total: 0 }
  );
}

/**
 * Generates a progress bar string
 */
function generateProgressBar(percentage, length, filledChar = "■", emptyChar = "□") {
  const filled = Math.floor((percentage / 100) * length);
  return filledChar.repeat(filled) + emptyChar.repeat(Math.max(0, length - filled));
}

/**
 * Processes a single locale file and returns its translation stats
 */
function processLocaleFile(locale, file, refContent) {
  const targetPath = join(LOCALES_DIR, locale, file);
  
  try {
    const targetContent = JSON.parse(readFileSync(targetPath, "utf8"));
    const { missing, total } = compareLocales(refContent, targetContent);
    const translated = total - missing;
    return {
      file,
      missing,
      total,
      percentage: total > 0 ? Math.round((translated / total) * 100) : 0
    };
  } catch (error) {
    const totalInFile = countProperties(refContent);
    return {
      file,
      missing: totalInFile,
      total: totalInFile,
      percentage: 0
    };
  }
}

/**
 * Processes all locales and returns the results
 */
function processLocales(locales, refFiles, usedKeys = [], showMissingKeys = false) {
  return locales.map(locale => {
    const files = [];
    let totalMissing = 0;
    let totalKeys = 0;

    for (const file of refFiles) {
      const refPath = join(LOCALES_DIR, REFERENCE_LANG, file);
      const refContent = JSON.parse(readFileSync(refPath, "utf8"));
      const result = processLocaleFile(locale, file, refContent);
      
      files.push(result);
      totalMissing += result.missing;
      totalKeys += result.total;
    }

    const totalTranslated = totalKeys - totalMissing;
    const overallPercentage = totalKeys > 0 ? Math.round((totalTranslated / totalKeys) * 100) : 0;
    
    // Calculate actual usage percentage
    // Track which keys are used and their source files
    const actuallyUsed = [];
    const keySourceMap = new Map();
    
    usedKeys.forEach(key => {
      const { exists, sourceFile } = isKeyDefinedInReference(key, refFiles);
      if (exists) {
        actuallyUsed.push(key);
        keySourceMap.set(key, sourceFile);
      }
    });
    
    // For actual usage, we need to check which of the used keys are actually translated in this locale
    const actuallyUsedAndTranslated = [];
    const missingInLocale = [];
    
    actuallyUsed.forEach(key => {
      if (isKeyTranslatedInLocale(key, locale, refFiles)) {
        actuallyUsedAndTranslated.push(key);
      } else if (showMissingKeys && locale !== REFERENCE_LANG) {
        missingInLocale.push({
          key,
          sourceFile: keySourceMap.get(key) || "unknown"
        });
      }
    });
    
    const actualUsagePercentage = actuallyUsed.length > 0 ? Math.round((actuallyUsedAndTranslated.length / actuallyUsed.length) * 100) : 0;

    return {
      locale,
      files,
      totalMissing,
      totalKeys,
      overallPercentage,
      actualUsagePercentage,
      actuallyUsedCount: actuallyUsed.length,
      actuallyUsedAndTranslatedCount: actuallyUsedAndTranslated.length,
      missingKeys: showMissingKeys ? missingInLocale : undefined
    };
  }).sort((a, b) => b.overallPercentage - a.overallPercentage);
}


/**
 * Check if a key is translated in a specific locale
 */
function isKeyTranslatedInLocale(key, locale, refFiles) {
  for (const file of refFiles) {
    const refPath = join(LOCALES_DIR, REFERENCE_LANG, file);
    const targetPath = join(LOCALES_DIR, locale, file);
    
    try {
      const refContent = readFileSync(refPath, "utf8");
      const refData = JSON.parse(refContent);
      
      // Check if key exists in reference (including plural variants)
      let keyExistsInRef = keyExists(refData, key);
      const pluralVariants = ["_zero", "_one", "_two", "_few", "_many", "_other"];
      
      if (!keyExistsInRef) {
        for (const variant of pluralVariants) {
          if (keyExists(refData, key + variant)) {
            keyExistsInRef = true;
            break;
          }
        }
      }
      
      if (!keyExistsInRef) {
        continue;
      }
      
      // For reference language, if it exists in ref, it's translated
      if (locale === REFERENCE_LANG) {
        return true;
      }
      
      // Check if target file exists and has the key translated
      const targetContent = readFileSync(targetPath, "utf8");
      const targetData = JSON.parse(targetContent);
      
      // Check if the base key exists in target
      let keyExistsInTarget = keyExists(targetData, key);
      let targetValue = null;
      let refValue = null;
      
      if (keyExistsInTarget) {
        targetValue = getKeyValue(targetData, key);
        refValue = getKeyValue(refData, key);
      } else {
        // Check plural variants
        for (const variant of pluralVariants) {
          const fullKey = key + variant;
          if (keyExists(targetData, fullKey) && keyExists(refData, fullKey)) {
            targetValue = getKeyValue(targetData, fullKey);
            refValue = getKeyValue(refData, fullKey);
            keyExistsInTarget = true;
            break;
          }
        }
      }
      
      if (keyExistsInTarget && targetValue && targetValue.trim() !== "") {
        // Consider it translated if the target has a non-empty value
        // Don't compare with reference value as translations might be the same
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  return false;
}

/**
 * Get the value of a key from nested object
 */
function getKeyValue(obj, keyPath) {
  const keys = keyPath.split(".");
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  
  return current;
}

/**
 * Check if a key exists in nested object
 */
function keyExists(obj, keyPath) {
  if (!obj) return false;
  
  const keys = keyPath.split(".");
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }
  
  return current !== undefined;
}

/**
 * Generates the detailed breakdown section of the report
 */
function generateDetailedBreakdown(results, maxFileNameLength) {
  const output = [];
  
  output.push("Locale Breakdown:", "-".repeat(40));
  
  results.forEach(({ 
    locale, 
    files, 
    totalMissing, 
    totalKeys, 
    overallPercentage, 
    actualUsagePercentage, 
    actuallyUsedCount, 
    actuallyUsedAndTranslatedCount,
    missingKeys = []
  }) => {
    output.push(`\n${ locale.toUpperCase() } (${ overallPercentage }% complete, ${ actualUsagePercentage }% of usage)`);
    
    files.forEach(({ file, missing, total, percentage }) => {
      const translated = total - missing;
      const bar = generateProgressBar(percentage, 10);
      output.push(`   ${ file.padEnd(maxFileNameLength + 2) } ${ bar } ${ percentage.toString().padStart(3) }%  (${ translated }/${ total })`);
    });
    
    if (files.length > 1) {
      const totalTranslated = totalKeys - totalMissing;
      const totalBar = generateProgressBar(overallPercentage, 10);
      output.push(`   ${ "TOTAL".padEnd(maxFileNameLength + 2) } ${ totalBar } ${ overallPercentage.toString().padStart(3) }%  (${ totalTranslated }/${ totalKeys })`);
      
      const usageBar = generateProgressBar(actualUsagePercentage, 10);
      output.push(`   ${ "USED".padEnd(maxFileNameLength + 2) } ${ usageBar } ${ actualUsagePercentage.toString().padStart(3) }%  (${ actuallyUsedAndTranslatedCount }/${ actuallyUsedCount })`);
    }
    
    // Group and show missing keys by source file if there are any
    if (missingKeys && missingKeys.length > 0) {
      const grouped = missingKeys.reduce((acc, { key, sourceFile }) => {
        const source = sourceFile.includes("web") ? "web" : "shared";
        if (!acc[source]) acc[source] = [];
        acc[source].push(key);
        return acc;
      }, {});
      
      output.push("\n   ----------------------------------------");
      output.push("   Missing Keys:\n");
      
      // Always show web first, then shared
      ["web", "shared"].forEach((source, index) => {
        const keys = grouped[source];
        if (keys && keys.length > 0) {
          if (index > 0) output.push("");
          output.push(`   ${source.toUpperCase()} (${keys.length} keys):`);
          keys.forEach(key => {
            output.push(`   • ${key}`);
          });
        }
      });
      
      output.push("");
    }
  });
  
  return output;
}

/**
 * Generates the usage summary section of the report
 */
function generateUsageSummary(results) {
  const output = [];
  
  output.push("\nActual Usage Summary:", "-".repeat(40));
  
  [...results]
    .sort((a, b) => b.actualUsagePercentage - a.actualUsagePercentage)
    .forEach(({ locale, actualUsagePercentage }) => {
    const bar = generateProgressBar(actualUsagePercentage, 20);
    output.push(`${ locale.toUpperCase().padEnd(6) } [${ bar }] ${ actualUsagePercentage.toString().padStart(3) }%`);
  });
  
  return output;
}

/**
 * Generates the summary section of the report
 */
function generateSummarySection(results) {
  const output = [];
  
  output.push("\nLocale Completion Summary:", "-".repeat(40));
  
  results.forEach(({ locale, overallPercentage }) => {
    const bar = generateProgressBar(overallPercentage, 20);
    output.push(`${ locale.toUpperCase().padEnd(6) } [${ bar }] ${ overallPercentage.toString().padStart(3) }%`);
  });
  
  return output;
}

/**
 * Generates the output text for the translation report
 */
function generateOutputText(results, refLang, maxFileNameLength, reverseOrder = false) {
  const now = new Date();
  const header = [
    "Locale Completion Status",
    `Reference language: ${ refLang }`,
    `Generated: ${ now.toISOString() }\n`
  ];
  
  const detailedBreakdown = generateDetailedBreakdown(results, maxFileNameLength);
  const summary = generateSummarySection(results);
  const usageSummary = generateUsageSummary(results);
  
  const sections = reverseOrder 
    ? [...header, ...summary, "", ...usageSummary, "", ...detailedBreakdown]
    : [...header, ...detailedBreakdown, "", ...summary, "", ...usageSummary];
    
  return sections.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const generateSummaryFile = args.includes("--summary");
  const showMissingKeys = args.includes("--show-missing");
  
  try {
    // Get all locale directories
    const locales = readdirSync(LOCALES_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (!locales.includes(REFERENCE_LANG)) {
      throw new Error(`Reference language "${ REFERENCE_LANG }" not found`);
    }

    // Get reference files
    const refFiles = readdirSync(join(LOCALES_DIR, REFERENCE_LANG))
      .filter(file => file.endsWith(".json"));

    // Extract used keys from source code
    const usedKeys = extractUsedKeys();

    // Process all locales with usage data
    const results = processLocales(locales, refFiles, usedKeys, showMissingKeys);

    // Find max filename length for alignment
    const maxFileNameLength = results.reduce(
      (max, { files }) => Math.max(max, ...files.map(f => f.file.length)),
      0
    );

    // Generate and display console output (detailed breakdown first)
    const consoleOutput = generateOutputText(results, REFERENCE_LANG, maxFileNameLength, false);
    console.log(consoleOutput);

    // Show missing keys from reference language
    const missingFromReference = usedKeys.filter(key => !isKeyDefinedInReference(key, refFiles));
    if (missingFromReference.length > 0) {
      console.log("\n" + "=".repeat(50));
      console.log("MISSING KEYS FROM REFERENCE LANGUAGE (EN)");
      console.log("=".repeat(50));
      console.log(`\n❌ ${ missingFromReference.length } keys used in code but missing from English locale files:`);
      missingFromReference.sort().forEach(key => console.log(`   - ${ key }`));
    }

    // Save summary if requested (with reversed order)
    if (generateSummaryFile) {
      const summaryPath = join(process.cwd(), "locale-summary.txt");
      const fileOutput = generateOutputText(results, REFERENCE_LANG, maxFileNameLength, true);
      writeFileSync(summaryPath, fileOutput);
      console.log(`\nSummary saved to ${ summaryPath }`);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
