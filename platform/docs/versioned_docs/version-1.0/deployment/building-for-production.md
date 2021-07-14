# Building for Production

**This tutorial considers the current folder as `OHIFViewer/`**.

### Dependencies

First, you need to have installed:

- [Node.js](https://nodejs.org/) and [NPM](https://www.npmjs.com/)
- [Meteor](https://www.meteor.com/)
- [MongoDB](https://www.mongodb.com/)

**MongoDB** is actually **not required** if you have a **remote MongoDB**. If your database is **local** then you need to have it running.

### Check your packages

Inside of the viewer folder make sure NPM packages are updated for production:

```bash
npm install --production
```

### Building

There are two ways of building OHIF Viewer for a specific DICOM server: **Automatically** or **Manually**.

For both, we use the `meteor build` (check it's [docs](https://guide.meteor.com/deployment.html#custom-deployment)) app and **Orthanc Dicom Web Server**.

For `meteor build` it's necessary to inform an output folder `myOutputFolder`.
**Remember to change `myOutputFolder` to your folder location.**

OHIF Viewer will be built using **Orthanc DICOM Web server** configuration file `../config/orthancDICOMWeb.json` to set `METEOR_SETTINGS` environment var.

*To run with another server, just point to the corresponding `.json` located in `config` folder or create your own.*

#### Build automatically

After this step, go directly to [Prepare to run production build](#prepare-to-run-production-build).

##### Non-windows users

```bash
METEOR_PACKAGE_DIRS="../Packages" METEOR_SETTINGS=$(cat ../config/orthancDICOMWeb.json) meteor build --directory myOutputFolder
```

##### Windows users

Since there is no `cat` command in Windows `cmd`, use Windows `PowerShell` (at least version 3.0) instead.

In `PowerShell`, open a new shell as an `admin`:

```bash
Start-Process powershell -Verb runAs
```

Then:

**Remember to change `OHIFViewerFolderLocation` to OHIFViewer's folder location.**

 ```bash
cd OHIFViewerFolderLocation
$settings = Get-Content ..\config\orthancDICOMWeb.json -Raw
$settings = $settings -replace "`n","" -replace "`r","" -replace " ",""
[Environment]::SetEnvironmentVariable("METEOR_SETTINGS", $settings, "Machine")
SET METEOR_PACKAGE_DIRS="../Packages"
meteor build --directory myOutputFolder
```

#### Build manually

OHIF Viewer will be built normally, but with no DICOM Server information, which needs to be added when running the build. This is described in [Manually adding DICOM Server to the Viewer](#manually-adding-dicom-server-to-the-viewer).

##### Non-windows users

```bash
METEOR_PACKAGE_DIRS="../Packages" meteor build --directory myOutputFolder
```

##### Windows users in `cmd`

```bash
SET METEOR_PACKAGE_DIRS="../Packages"
meteor build --directory myOutputFolder
```

### Prepare to run production build

If everything went ok, `meteor build` created a `bundle` folder inside `myOutputFolder`.

**Remember to change `myOutputFolder` to your folder location.**

Go to that folder:

```bash
cd myOutputFolder/bundle
```

Now install the **NPM dependencies**:

```bash
cd programs/server
npm install
```

### To run production build

Go back to the `bundle` folder:

```bash
cd ../..
```
or (**Remember to change `myOutputFolder` to your folder location.**):

```bash
cd myOutputFolder/bundle
```

3 environment variables are set before running Node.js:
- `MONGO_URL`: is the url to MongoDB. If it's **local**, you need to have it running
- `ROOT_URL`: the hostname where you can access your Viewer in the browser
- `PORT`: the port the Viewer will run

This way, the Viewer can be accessed in `http://localhost:3000`, with MongoDB running locally using 27017 port (it's default).

##### Non-windows users

```bash
MONGO_URL=mongodb://localhost:27017/myapp ROOT_URL=http://localhost PORT=3000 node main.js
```

##### Windows users in `cmd`

```bash
SET MONGO_URL=mongodb://localhost:27017/myapp
SET ROOT_URL=http://localhost
SET PORT=3000
node main.js
```

### Manually adding DICOM Server to the Viewer

If DICOM Server was configured automatically during the building process, skip this step.

Access the viewer `http://localhost:3000` and toggle the **Options** menu, located at top right corner. Select **Server Information** option.

In **Server Information** dialog click on **Add a new server** button and fill the fields accordingly to the DICOM Server to be added.

In case of doubts about any field in this dialog, use `config/orthancDICOMWeb.json` as reference.

After filling the form, click on the **Save** button and the new server will be listed. Make sure to activate it by clicking on the left most button (a checkbox button) in the **Actions** column.

Refresh the page and Viewer will be connected to the DICOM Server.
