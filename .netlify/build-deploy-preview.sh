#!/bin/bash

# Set directory to location of this script
# https://stackoverflow.com/a/3355423/1867984
cd "$(dirname "$0")"
cd .. # Up to project root

# Helpful to verify which versions we're using
echo 'My yarn version is... '

yarn -v
node -v

# Build && Move PWA Output
yarn run build:ci
mkdir -p ./.netlify/www/pwa
mv platform/viewer/dist/* .netlify/www/pwa -v

# Build && Move script output
# yarn run build:package

# Build && Move Docz Output
yarn run build:ui:deploy-preview
mkdir -p ./.netlify/www/ui
mv platform/ui/.docz/dist/* .netlify/www/ui -v

# Cache all of the node_module dependencies in
# extensions, modules, and platform packages
yarn run lerna:cache
echo 'Nothing left to see here. Go home, folks.'
