#!/bin/bash

# Set directory to location of this script
# https://stackoverflow.com/a/3355423/1867984
cd "$(dirname "$0")"
cd .. # Up to project root

# Helpful to verify which versions we're using
echo 'My yarn version is... '

yarn -v
node -v

# Make sure we can hit yarn packages
# yarn global bin
# yarn config get prefix
# yarn config set prefix ~/.yarn
# export PATH="$PATH:`yarn global bin`"

echo '~~ Revving our engines'

yarn list

echo 'shouldnt be required'

yarn global add lerna

yarn list

# Build && Move PWA Output
# yarn run build:ci
# mkdir -p ./.netlify/www/pwa
# mv platform/viewer/dist/* .netlify/www/pwa -v

# Build && Move script output
# yarn run build:package

# Build && Move Docz Output
yarn run build:ui
mkdir -p ./.netlify/www/ui
mv platform/ui/.docz/dist/* .netlify/www/ui -v

echo 'Nothing left to see here. Go home, folks.'

# Build using react-scripts
# npx cross-env PUBLIC_URL=/demo APP_CONFIG=config/netlify.js react-scripts --max_old_space_size=4096 build
