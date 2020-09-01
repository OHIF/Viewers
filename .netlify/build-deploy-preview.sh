#!/bin/bash

# Set directory to location of this script
# https://stackoverflow.com/a/3355423/1867984
cd "$(dirname "$0")"
cd .. # Up to project root

# Helpful to verify which versions we're using
yarn -v
node -v

# Install build deps and all monorepo package dependencies. Yarn Workspaces
# should also symlink all projects appropriately
yarn run lerna:restore
yarn install --no-ignore-optional --pure-lockfile

# Build && Move PWA Output
yarn run build:ci
mkdir -p ./.netlify/www/pwa
mv platform/viewer/dist/* .netlify/www/pwa -v

# Build && Move script output
# yarn run build:package

# Build && Move Docz Output
# Using local yarn install to prevent Gatsby from needing to access
# node_modules above the platform/ui folder
cd platform/ui
yarn install
yarn run build
cd ../..
mkdir -p ./.netlify/www/ui
mv platform/ui/.docz/dist/* .netlify/www/ui -v

# Cache all of the node_module dependencies in
# extensions, modules, and platform packages
yarn run lerna:cache
echo 'Nothing left to see here. Go home, folks.'

# Build using react-scripts
# npx cross-env PUBLIC_URL=/demo APP_CONFIG=config/netlify.js react-scripts --max_old_space_size=4096 build
