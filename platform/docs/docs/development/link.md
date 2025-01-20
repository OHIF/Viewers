---
sidebar_position: 9
sidebar_label: Local Linking
---

# Introduction

Local linking allows you to develop and test a library in the context of an application before it's published or when you encounter
a bug that you suspect is related to a library. With Yarn, this can be achieved through the yarn link command.

The general procedure is as follows:


Link the Library:

```sh
cd /path/to/library
yarn link
```

This command will create a symlink in a global directory for the library.


Link to the Application:

```sh
cd /path/to/application
yarn link "library-name"
```

Creates a symlink from the global directory to the application's node_modules.


# Tutorial for linking Cornerstone3D to OHIF

Below we demonstrate how to link Cornerstone3D to OHIF Viewer. This is useful for testing and debugging Cornerstone3D in the context of OHIF Viewer.

<div style={{padding:"56.25% 0 0 0", position:"relative"}}>
    <iframe src="https://player.vimeo.com/video/849096279?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style= {{ position:"absolute",top:0,left:0,width:"100%",height:"100%"}} title="measurement-report"></iframe>
</div>

::tip
Since `@cornerstonejs/tools` depends on `@cornerstonejs/core`, if you need the changes
you made in `@cornerstonejs/core` to be reflected in `@cornerstonejs/tools`, you need to
also link `@cornerstonejs/core` to `@cornerstonejs/tools`.

```sh
cd /path/to/cornerstonejs-core
# for the core
yarn link

cd /path/to/cornerstonejs-tools
yarn link "@cornerstonejs/core"

# for the tools
yarn link

# inside OHIF
cd /path/to/OHIFViewer
yarn link "@cornerstonejs/core"
yarn link "@cornerstonejs/tools"
```
