#!/bin/bash

# Exit on error
set -e

# Backup root package.json and platform/app/package.json
cp package.json package.json.bak
cp platform/app/package.json platform/app/package.json.bak

# Update the workspaces packages and remove cypress
node - <<EOF
const fs = require('fs');
const path = require('path');

// Function to read and write JSON files
const updateJsonFile = (filePath, updateFn) => {
  const fullPath = path.resolve(__dirname, filePath);
  const jsonData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  updateFn(jsonData);
  fs.writeFileSync(fullPath, JSON.stringify(jsonData, null, 2));
};

// Update root package.json to exclude platform/docs
updateJsonFile('package.json', packageJson => {
  packageJson.workspaces.packages = packageJson.workspaces.packages.map(pkg =>
    pkg === 'platform/*' ? 'platform/!(docs)/**' : pkg
  );
});

// Remove unwanted packages from platform/app/package.json
updateJsonFile('platform/app/package.json', packageJson => {
  delete packageJson.devDependencies['cypress'];
  delete packageJson.devDependencies['@percy/cypress'];
  delete packageJson.devDependencies['@playwright/test'];
  delete packageJson.devDependencies['cypress-file-upload'];
});
EOF

# Install dependencies using yarn
yarn install --frozen-lockfile

# Restore original package.json files
mv package.json.bak package.json
mv platform/app/package.json.bak platform/app/package.json

echo "Dependencies installed successfully, ignoring platform/docs and cypress in platform/app."
