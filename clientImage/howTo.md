## environment
[install meteor](https://www.meteor.com/install)
## download
```bash
git clone https://github.com/quantumsoftgroup/ViewersClone.git
cd ViewersClone
git checkout dev
```
## build
```bash
cd OHIFViewer/
METEOR_PACKAGE_DIRS="../Packages" meteor-build-client ../clientImage/build -s ../config/oidc.json
cd ../clientImage
docker build -t ohif-ghc .
docker run --env CLIENT_ID={$someID}.apps.googleusercontent.com --publish 3000:80 ohif-ghc

```
