# OHIF Viewer Documentation Scripts

This directory contains utility scripts for the OHIF Viewer documentation.

## prepare-markdown-files.js

This script copies all markdown files from the docs directory (excluding `api/` and `assets/`) to a `/llm` directory in the build output, making them available as static markdown files that can be accessed directly without the Docusaurus UI.

### Purpose

These files are made available for easy access by LLMs and other tools that need to retrieve the raw markdown content without the surrounding Docusaurus UI elements.

### Access URLs

After deployment, the markdown files can be accessed at URLs like:

- `https://docs.ohif.org/llm/platform/extensions/modules/commands.md`
- `https://docs.ohif.org/llm/platform/services/ui/index.md`

### Implementation

The script is automatically run as part of the `build:docs` command and will:

1. Find all markdown files in the `/platform/docs/docs/` directory (excluding api/ and assets/)
2. Copy them to `/platform/docs/build/llm/` preserving the directory structure
3. These files are then deployed to the website along with the rest of the built documentation

You can also run this script manually with:

```bash
cd platform/docs
yarn run prepare-markdown-files
```

## generate-llms-txt.js

This script generates a llms.txt file that follows the [llms.txt specification](https://llmstxt.site) by creating an index of all the markdown files that have been copied to the `/llm` directory.

### Purpose

The llms.txt file provides an overview of all available documentation in a format that's optimized for use with Large Language Models (LLMs). It creates a structured index that LLMs can use to efficiently navigate and find information in the documentation.

### Access URL

After deployment, the llms.txt file can be accessed at:

- `https://docs.ohif.org/llms.txt`

### Implementation

The script is automatically run as part of the `build:docs` command (after `prepare-markdown-files.js`) and will:

1. Scan all the markdown files that were copied to the `/llm` directory
2. Extract titles and summaries from the frontmatter of each file
3. Organize them into sections based on their directory structure
4. Generate a single llms.txt file in the standard format with links to all the documentation files
5. Save the file to the build directory root so it will be accessible at the root of the website

You can also run this script manually with (after running `prepare-markdown-files.js`):

```bash
cd platform/docs
yarn run generate-llms-txt
```

## generate-llms-full-txt.js

This script generates an llms-full.txt file by concatenating the content of all markdown files from the `/llm` directory into a single giant file, similar to the approach used by bun.sh.

### Purpose

The llms-full.txt file provides the complete content of all documentation in a single file, which can be useful for LLMs that need to search or reference the entire documentation at once. This approach allows for contextual understanding across multiple documentation pages.

### Access URL

After deployment, the llms-full.txt file can be accessed at:

- `https://docs.ohif.org/llms-full.txt`

### Implementation

The script is automatically run as part of the `build:docs` command (after `generate-llms-txt.js`) and will:

1. Scan all the markdown files that were copied to the `/llm` directory
2. Remove frontmatter from each file to clean up the content
3. Add clear section headers and source URLs for each file
4. Concatenate all the content into a single file with proper organization by section
5. Save the file to the build directory root so it will be accessible at the root of the website

The output file has the following structure:
- Title and introduction for OHIF Viewer
- Files are organized by their directory structure (e.g., platform, extensions, services)
- Each file has a header with its title and source URL
- Separator lines between files for clarity

You can also run this script manually with (after running `prepare-markdown-files.js`):

```bash
cd platform/docs
yarn run generate-llms-full-txt
```
