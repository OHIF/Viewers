export TEST_BROWSER_DRIVER=puppeteer
export METEOR_PACKAGE_DIRS=../Packages

cd OHIFViewer

meteor npm install
meteor test --once --driver-package meteortesting:mocha