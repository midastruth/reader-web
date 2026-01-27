#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOCALES_DIR = join(__dirname, "../public/locales");
const REFERENCE_LANG = "en";

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
function processLocales(locales, refFiles) {
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

    return {
      locale,
      files,
      totalMissing,
      totalKeys,
      overallPercentage: totalKeys > 0 ? Math.round(((totalKeys - totalMissing) / totalKeys) * 100) : 0
    };
  }).sort((a, b) => b.overallPercentage - a.overallPercentage);
}

/**
 * Generates the detailed breakdown section of the report
 */
function generateDetailedBreakdown(results, maxFileNameLength) {
  const output = [];
  
  output.push("Locale Breakdown:", "-".repeat(40));
  
  results.forEach(({ locale, files, totalMissing, totalKeys, overallPercentage }) => {
    output.push(`\n${ locale.toUpperCase() } (${ overallPercentage }% complete)`);
    
    files.forEach(({ file, missing, total, percentage }) => {
      const translated = total - missing;
      const bar = generateProgressBar(percentage, 10);
      output.push(`   ${ file.padEnd(maxFileNameLength + 2) } ${ bar } ${ percentage.toString().padStart(3) }%  (${ translated }/${ total })`);
    });
    
    if (files.length > 1) {
      const totalTranslated = totalKeys - totalMissing;
      const totalBar = generateProgressBar(overallPercentage, 10);
      output.push(`   ${ "TOTAL".padEnd(maxFileNameLength + 2) } ${ totalBar } ${ overallPercentage.toString().padStart(3) }%  (${ totalTranslated }/${ totalKeys })`);
    }
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
  
  const sections = reverseOrder 
    ? [...header, ...summary, "", ...detailedBreakdown]
    : [...header, ...detailedBreakdown, "", ...summary];
    
  return sections.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const generateSummaryFile = args.includes("--summary");
  
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

    // Process all locales
    const results = processLocales(locales, refFiles);

    // Find max filename length for alignment
    const maxFileNameLength = results.reduce(
      (max, { files }) => Math.max(max, ...files.map(f => f.file.length)),
      0
    );

    // Generate and display console output (detailed breakdown first)
    const consoleOutput = generateOutputText(results, REFERENCE_LANG, maxFileNameLength, false);
    console.log(consoleOutput);

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
