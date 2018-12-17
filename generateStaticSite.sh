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
echo $DEPLOY_PRIME_URL
cd OHIFViewer-react
export ROOT_URL=$DEPLOY_PRIME_URL:/viewer/
sed -i 's,https://docs.ohif.org/viewer,${ROOT_URL},g' package.json
cat package.json
npm install
npm run build
mkdir ../docs/_book/viewer/
cp -R build/* ../docs/_book/viewer/
