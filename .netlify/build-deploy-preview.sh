#!/bin/bash

# Set directory to location of this script
# https://stackoverflow.com/a/3355423/1867984
cd "$(dirname "$0")"

# Helpful to verify which versions we're using
yarn -v
node -v

# Install build deps and all monorepo package dependencies. Yarn Workspaces
# should also symlink all projects appropriately
yarn install --no-ignore-optional --pure-lockfile

# Build PWA
yarn run build

# Copy output to the folder that is our publish target
mv ./platform/viewer/dist/* ./netlify/www/pwa/ -v

echo 'Nothing left to see here. Go home, folks.'

# Build using react-scripts
# npx cross-env PUBLIC_URL=/demo REACT_APP_CONFIG=config/netlify.js react-scripts --max_old_space_size=4096 build
