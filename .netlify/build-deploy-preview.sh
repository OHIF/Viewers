#!/bin/bash

# Set directory to location of this script
# https://stackoverflow.com/a/3355423/1867984
cd "$(dirname "$0")"
cd .. # Up to project root

# Helpful to verify which versions we're using
echo 'My pnpm version is... '

pnpm -v
node -v

# Build && Move PWA Output
pnpm run build:ci
mkdir -p ./.netlify/www/pwa
mv platform/app/dist/* .netlify/www/pwa -v
echo 'Web application built and copied'

# Build && Move Docusaurus Output (for the docs themselves)
cd platform/docs
pnpm install
pnpm run build
cd ../..
mkdir -p ./.netlify/www/docs
mv platform/docs/build/* .netlify/www/docs -v
echo 'Docs built (docusaurus) and copied'

# Cache all of the node_module dependencies in
# extensions, modules, and platform packages
pnpm run lerna:cache
echo 'Nothing left to see here. Go home, folks.'
