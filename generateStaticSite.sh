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
cd StandaloneViewer
echo $DEPLOY_PRIME_URL
export ROOT_URL=$DEPLOY_PRIME_URL:/viewer/
export METEOR_PACKAGE_DIRS="../../Packages"
mkdir buildDirectory
cd StandaloneViewer
npm install -g meteor-build-client-fixed@0.4.3
meteor-build-client-fixed --version
curl https://install.meteor.com | /bin/sh
export PATH=$HOME/.meteor:$PATH
meteor npm install
meteor-build-client-fixed ../../docs/_book/viewer -u $ROOT_URL --path './'