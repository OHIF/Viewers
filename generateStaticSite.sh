cd docs
npm -v
node -v
echo 'Installing Gitbook CLI'
npm install

echo 'Running Gitbook installation'
./node_modules/gitbook-cli/bin/gitbook.js install
./node_modules/gitbook-cli/bin/gitbook.js build
cd ..

# Build and copy the StandaloneViewer into the static directory
# echo $DEPLOY_PRIME_URL
# export ROOT_URL=$DEPLOY_PRIME_URL:/viewer/
cd OHIFViewer-react
yarn install
yarn run build
mkdir ../docs/_book/viewer/
cp -R build/* ../docs/_book/viewer/
