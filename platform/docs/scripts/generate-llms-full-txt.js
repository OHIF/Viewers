/**
 * Script to generate an llms-full.txt file that concatenates all markdown content
 * This script creates a single giant file with all markdown content from the /llm directory
 * with proper heading hierarchy preserved
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Base docs directory
const baseDocsDir = path.join(__dirname, '../docs');
// Output directory for LLM markdown files
const llmDir = path.join(__dirname, '../build/llm');
// Output file path for llms-full.txt
const outputFilePath = path.join(__dirname, '../build/llms-full.txt');

// Get all subdirectories to create sections
async function getDirectorySections() {
  const directories = new Set();

  // Find all subdirectories that contain markdown files
  const markdownFiles = await glob(`${llmDir}/**/*.md`);

  markdownFiles.forEach((filePath) => {
    // Get the relative directory from the llm dir
    const relativePath = path.relative(llmDir, filePath);
    const dirPath = path.dirname(relativePath);

    // Add to set if it's not in the root
    if (dirPath !== '.') {
      // Get the top-level directory
      const topDir = dirPath.split(path.sep)[0];
      directories.add(topDir);
    }
  });

  return Array.from(directories).sort();
}

// Get all subdirectories for a section
async function getSubdirectories(section) {
  const sectionPath = path.join(llmDir, section);
  const subdirectories = new Set();

  // Find all markdown files in this section
  const markdownFiles = await glob(`${sectionPath}/**/*.md`);

  markdownFiles.forEach((filePath) => {
    // Get the relative directory from the section path
    const relativePath = path.relative(sectionPath, filePath);
    const dirPath = path.dirname(relativePath);

    // Add to set if it's not in the root
    if (dirPath !== '.') {
      subdirectories.add(dirPath);
    }
  });

  return Array.from(subdirectories).sort();
}

// Process content to adjust heading levels
function adjustHeadingLevels(content, baseLevel) {
  // Replace headings with adjusted levels while limiting max depth to h4
  let processedContent = content;

  // Process all heading levels from h1 to h6
  for (let i = 1; i <= 6; i++) {
    // Limit maximum heading level to h4
    const newLevel = Math.min(i + baseLevel, 4);
    const pattern = new RegExp(`^(#{${i}})\\s+(.+)$`, 'gm');
    processedContent = processedContent.replace(pattern, `${'#'.repeat(newLevel)} $2`);
  }

  return processedContent;
}

// Process a single markdown file
function processMarkdownFile(filePath, baseLevel) {
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf8');

  // Process content to remove frontmatter
  let processedContent = content;
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (frontmatterMatch) {
    processedContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  }

  // Adjust heading levels
  processedContent = adjustHeadingLevels(processedContent, baseLevel);

  return processedContent;
}

// Process all files in a subsection
async function processSubsectionFiles(section, subsection) {
  const subsectionPath = path.join(llmDir, section, subsection);
  const subsectionContent = [];

  // Get all markdown files for this subsection
  const markdownFiles = await glob(`${subsectionPath}/*.md`);

  // Sort files alphabetically
  markdownFiles.sort();

  for (const filePath of markdownFiles) {
    // Get the file name
    const fileName = path.basename(filePath, '.md');
    const relativePath = path.relative(llmDir, filePath);

    // Extract title from frontmatter or filename
    const content = fs.readFileSync(filePath, 'utf8');
    let title = '';
    const frontmatterTitleMatch = content.match(/title:\s*([^\n]+)/);
    const firstHeadingMatch = content.match(/# ([^\n]+)/);

    if (frontmatterTitleMatch) {
      title = frontmatterTitleMatch[1].trim();
      // Remove quotes if present
      title = title.replace(/^["'](.*)["']$/, '$1');
    } else if (firstHeadingMatch) {
      title = firstHeadingMatch[1].trim();
    } else {
      // Use filename as fallback
      title = fileName;
    }

    // Add file header (as h3, since section is h1 and subsection is h2)
    subsectionContent.push(`\n\n### ${title}\n`);
    subsectionContent.push(`Source: https://docs.ohif.org/llm/${relativePath}\n`);

    // Process the file content with adjusted heading levels (h1->h4, h2->h5, etc.)
    const processedContent = processMarkdownFile(filePath, 3);
    subsectionContent.push(processedContent);

    // Add separator
    subsectionContent.push('\n\n---\n');
  }

  return subsectionContent.join('\n');
}

// Process files directly in the section root (not in subsections)
async function processSectionRootFiles(section) {
  const sectionPath = path.join(llmDir, section);
  const sectionContent = [];

  // Get all markdown files directly in the section root
  const markdownFiles = await glob(`${sectionPath}/*.md`);

  // Sort files alphabetically
  markdownFiles.sort();

  for (const filePath of markdownFiles) {
    // Get the file name
    const fileName = path.basename(filePath, '.md');
    const relativePath = path.relative(llmDir, filePath);

    // Extract title from frontmatter or filename
    const content = fs.readFileSync(filePath, 'utf8');
    let title = '';
    const frontmatterTitleMatch = content.match(/title:\s*([^\n]+)/);
    const firstHeadingMatch = content.match(/# ([^\n]+)/);

    if (frontmatterTitleMatch) {
      title = frontmatterTitleMatch[1].trim();
      // Remove quotes if present
      title = title.replace(/^["'](.*)["']$/, '$1');
    } else if (firstHeadingMatch) {
      title = firstHeadingMatch[1].trim();
    } else {
      // Use filename as fallback
      title = fileName;
    }

    // Add file header (as h2, since section is h1)
    sectionContent.push(`\n\n## ${title}\n`);
    sectionContent.push(`Source: https://docs.ohif.org/llm/${relativePath}\n`);

    // Process the file content with adjusted heading levels (h1->h3, h2->h4, etc.)
    const processedContent = processMarkdownFile(filePath, 2);
    sectionContent.push(processedContent);

    // Add separator
    sectionContent.push('\n\n---\n');
  }

  return sectionContent.join('\n');
}

// Process root files
async function processRootFiles() {
  const rootContent = [];

  // Get all markdown files in the root directory
  const rootFiles = await glob(`${llmDir}/*.md`);

  // Sort files alphabetically
  rootFiles.sort();

  for (const filePath of rootFiles) {
    // Get the file name
    const fileName = path.basename(filePath, '.md');

    // Extract title from frontmatter or filename
    const content = fs.readFileSync(filePath, 'utf8');
    let title = '';
    const frontmatterTitleMatch = content.match(/title:\s*([^\n]+)/);
    const firstHeadingMatch = content.match(/# ([^\n]+)/);

    if (frontmatterTitleMatch) {
      title = frontmatterTitleMatch[1].trim();
      // Remove quotes if present
      title = title.replace(/^["'](.*)["']$/, '$1');
    } else if (firstHeadingMatch) {
      title = firstHeadingMatch[1].trim();
    } else {
      // Use filename as fallback
      title = fileName;
    }

    // Add file header (as h2, since root is h1)
    rootContent.push(`\n\n## ${title}\n`);
    rootContent.push(`Source: https://docs.ohif.org/llm/${fileName}\n`);

    // Process the file content with adjusted heading levels (h1->h3, h2->h4, etc.)
    const processedContent = processMarkdownFile(filePath, 2);
    rootContent.push(processedContent);

    // Add separator
    rootContent.push('\n\n---\n');
  }

  return rootContent.join('\n');
}

// Generate the full concatenated content
async function generateLlmsFullTxt() {
  let content = '';

  // Add title and introduction
  content += '# OHIF Documentation\n\n';

  content += '> OHIF (Open Health Imaging Foundation) Viewer is an open-source, web-based, zero-footprint DICOM viewer platform designed for medical imaging. It provides a highly configurable and extensible framework for building diagnostic quality medical imaging applications. OHIF Viewer supports various imaging formats (primarily DICOM), offers advanced visualization tools, customizable workflows, and integration capabilities with different data sources.\n\n';

  content += 'This file contains the complete documentation for OHIF Viewer, concatenated for easy reference and searching. Each section is clearly marked with its source URL.\n\n';

  // Process root files first (if any)
  const rootFiles = await glob(`${llmDir}/*.md`);
  if (rootFiles.length > 0) {
    content += '# Root Documentation\n\n';

    // Process root files
    const rootContent = await processRootFiles();
    content += rootContent;
  }

  // Get all sections
  const sections = await getDirectorySections();

  // Process each section
  for (const section of sections) {
    // Add section header (as h1)
    content += `\n\n# ${section.charAt(0).toUpperCase() + section.slice(1)}\n\n`;

    // Process files directly in the section root
    const sectionRootContent = await processSectionRootFiles(section);
    content += sectionRootContent;

    // Process subsections if any
    const subsections = await getSubdirectories(section);

    for (const subsection of subsections) {
      // Add subsection header (as h2)
      content += `\n\n## ${subsection.charAt(0).toUpperCase() + subsection.slice(1)}\n\n`;

      // Process files in this subsection
      const subsectionContent = await processSubsectionFiles(section, subsection);
      content += subsectionContent;
    }
  }

  // Write the llms-full.txt file
  fs.writeFileSync(outputFilePath, content);
  console.log(`Generated llms-full.txt file at ${outputFilePath}`);
}

// Run the script
generateLlmsFullTxt();
