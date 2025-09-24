/**
 * Script to copy and prepare markdown files for static hosting
 * This script copies all markdown files from the docs directory (excluding api and assets)
 * to a /llm directory where they can be accessed directly without Docusaurus rendering
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Base docs directory
const baseDocsDir = path.join(__dirname, '../docs');
// Output directory for LLM markdown files
const outputDir = path.join(__dirname, '../build/llm');

// Create the output directory structure
function createDirectoryIfNotExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

// Process a markdown file
function processMarkdownFile(filePath) {
  try {
    // Read the content of the markdown file
    const content = fs.readFileSync(filePath, 'utf8');

    // Get the relative path from baseDocsDir
    const relativePath = path.relative(baseDocsDir, filePath);

    // Determine the output directory
    const outputFilePath = path.join(outputDir, relativePath);
    const outputFileDir = path.dirname(outputFilePath);

    // Create the directory if it doesn't exist
    createDirectoryIfNotExists(outputFileDir);

    // Write the content to the new location
    fs.writeFileSync(outputFilePath, content);

    console.log(`Processed: ${relativePath}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Main function
async function prepareMarkdownFiles() {
  // Create the base output directory
  createDirectoryIfNotExists(outputDir);

  // Find all markdown files in the docs directory
  const markdownFiles = await glob(`${baseDocsDir}/**/*.md`, {
    ignore: [`${baseDocsDir}/api/**/*.md`, `${baseDocsDir}/assets/**/*.md`],
  });

  console.log(`Found ${markdownFiles.length} markdown files to process.`);

  // Process each markdown file
  markdownFiles.forEach(processMarkdownFile);

  console.log('Markdown file preparation complete.');
}

// Run the script
prepareMarkdownFiles();
