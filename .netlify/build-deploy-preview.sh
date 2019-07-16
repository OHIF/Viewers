#!/bin/bash

# Set directory to location of this script
# https://stackoverflow.com/a/3355423/1867984
cd "$(dirname "$0")"

# Helpful to verify which versions we're using
yarn -v
node -v
echo '~~~~~~~~~~ root ~~~~~~~~~~~~'
npm root -g

# Make sure `node` can access globally installed binaries
export PATH="$PATH:/opt/buildhome/.nvm/versions/node/v10.16.0/lib/node_modules"
source ~/.profile
source ~/.bashrc


# Install GitBook CLI
echo 'Installing Gitbook CLI'
yarn global add gitbook-cli

echo 'Running Gitbook installation'
# Generate all version's GitBook output
# For each directory in /docs ...
cd ./../docs/
for D in *; do
    if [ -d "${D}" ]; then

			echo "Generating output for: ${D}"
			cd "${D}"

			# Clear previous output, generate new
			rm -rf _book
			echo "~~~ try 1"
			node gitbook install
			node gitbook gitbook build
			echo "~~~ try 2"
			node /opt/buildhome/.nvm/versions/node/v10.16.0/lib/node_modules/gitbook-cli/gitbook install
			node /opt/buildhome/.nvm/versions/node/v10.16.0/lib/node_modules/gitbook-cli/gitbook gitbook build
			# /usr/lib/node_modules/gitbook-cli/

			cd ..

		fi
done

cd /opt/buildhome/.nvm/versions/node/v10.16.0/lib/node_modules/gitbook-cli/
ls
cd "$(dirname "$0")"

# Move CNAME File into `latest`
cp CNAME ./latest/_book/CNAME

# Create a history folder in our latest version's output
mkdir ./latest/_book/history

# Move each version's files to latest's history folder
for D in *; do
  # If it's a directory
	if [ -d "${D}" ]; then
	  # If the directory name starts with `v` (v1, v2, etc.)
		if [ "${D}" == v* ] ; then

			echo "Moving ${D} to the latest version's history folder"

			mkdir "./latest/_book/history/${D}"
			cp -v -r "./${D}/_book"/* "./latest/_book/history/${D}"

		fi
	fi
done
cd ..

# Build and copy the PWA Viewer into the demo directory
mkdir ./docs/latest/_book/demo/

# Install build deps and all monorepo package dependencies. Yarn Workspaces
# should also symlink all projects appropriately
# yarn install --no-ignore-optional --pure-lockfile

# Navigate to our Viewer project
cd ./platform/viewer/

# Create a Versions File
node -p -e \"'export default \\'' + require('./package.json').version + '\\';'\" > src/version.js
# Copy over wado-image-loader codecs and worker file
cp \"node_modules/cornerstone-wado-image-loader/dist/*.min.js*\" \"public\" -v
# Build using react-scripts
# npx cross-env PUBLIC_URL=/demo REACT_APP_CONFIG=config/netlify.js react-scripts --max_old_space_size=4096 build
# Build using WebPack
# TODO: consume public/config correctly instead of hardcode
npx cross-env NODE_ENV=production webpack-dev-server --config config/webpack.prod.js --mode production -w -d
# Copy output to the folder that is our publish target
cp 'dist/**/*' ./../../docs/latest/_book/demo --verbose

echo 'Nothing left to see here. Go home, folks.'
