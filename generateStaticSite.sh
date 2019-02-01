cd docs
yarn -v
node -v
echo 'Installing Gitbook CLI'
yarn install

echo 'Running Gitbook installation'
./node_modules/gitbook-cli/bin/gitbook.js install
./node_modules/gitbook-cli/bin/gitbook.js build
cd ..

# Build and copy the StandaloneViewer into the static directory
echo $DEPLOY_PRIME_URL
cd Packages-react/ohif-viewer
export ROOT_URL=$DEPLOY_PRIME_URL/viewer

cat package.json
yarn install
yarn build

cd example
yarn install
yarn run prepare
sed -i "s,http://localhost:5000,${ROOT_URL},g" index.html
sed -i 's,"routerBasename": "/","routerBasename": "/viewer",g' index.html
rm -rf node_modules
mkdir ../../../docs/_book/viewer/
cp -R * ../../../docs/_book/viewer/
cp ../../../_redirects ../../../docs/_book/_redirects
