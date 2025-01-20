---
sidebar_position: 5
sidebar_label: Static Files
---

# Static Files

There is a binary DICOM to static file generator, which provides easily served
binary files. The files are all compressed in order to reduce space
significantly, and are pre-computed for the files required for OHIF, so that the
performance of serving the files is just the read from disk/write to http stream
time, without any extra processing time.

The project for the static wado files is located here: [static-wado]:
https://github.com/OHIF/static-wado

It can be compiled with Java and Gradle, and then run against a set of dicom, in
the example located in /dicom/study1 outputting to /dicomweb, and then a server
run against that data, like this:

```bash
git clone https://github.com/OHIF/static-wado
cd static-wado
./gradlew installDist
StaticWado/build/install/StaticWado/bin/StaticWado -d /dicomweb /dicom/study1
cd /dicomweb
npx http-server -p 5000 --cors -g

# you can use npx serve ./dist -l 8080 -c ../public/serve.json as an alternative to http-server
```

There is then a dev environment in the platform/app directory which can be
run against those files, like this:

```
cd platform/app
yarn dev:static
```

Additional studies can be added to the dicomweb by re-running the StaticWado
command. It will create a single studies.gz index file (JSON DICOM file,
compressed) containing an index of all studies created. There is then a small
extension to OHIF which performs client side indexing.

The StaticWado command also knows how to deploy a client and dicomweb directory
to Amazon s3, which can then server files up directly. There is another build
setup build:aws in the viewer package.json to create such a deployment.
