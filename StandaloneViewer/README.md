## Quick Start

Install dependencies:

```bash
meteor npm install
```

Run the application:

```bash
METEOR_PACKAGE_DIRS="../../Packages" ROOT_URL=http://localhost:3000 meteor
```

Open your web browser and navigate to one of the following URLs to test the standalone viewer application:

```bash
http://localhost:3000/testId
```

Or, to load DICOMs:
```bash
http://localhost:3000/testDICOMs
```

### To Build for the Client

It is possible to build this standalone viewer to run as a client-only bundle of HTML, JavaScript, and CSS.

1. First, install [meteor-build-client](https://github.com/frozeman/meteor-build-client).

  ```bash
  sudo npm install -g meteor-build-client
  ````

2. Next, build the client bundle into an output folder ("myOutputFolder") with a base URL ("localhost:3000"). In production, this would be the URL where the Viewer is available.

  ````
  METEOR_PACKAGE_DIRS="../../Packages" meteor-build-client ../myOutputFolder -u localhost:3000
  ```


3. Test the bundled client-side package locally.

    Note: You will need to have Python installed to run the test server for this case. It is not a typical simple HTTP server. The bundled script redirects all URLs following the base URL to index.html. It will then use the routes defined in your application to handle the URL parameters.

    In our case, this means it will request a JSON file at baseURL/api/[id parameter].

    So if you navigate to http://localhost:3000/sampleJPEG.json the application will retrieve the JSON from http://localhost:3000/api/sampleJPEG.json and use it to populate the viewer. If something appears to be broken, make sure you retrieve a JSON file at the /api URL.


    Create the api folder for your data

    ````bash
    cd myOutputFolder
    mkdir api
    ````

    Copy your data into the folder

    ````bash
    cp ../etc/sample* api/
    ````

    Run the server

    ```` bash
    python ../etc/redirectingSimpleServer.py
    ````

    Open your web browser and navigate to http://localhost:3000/sampleJPEG.json or http://localhost:3000/sampleDICOM.json

    Note: Right now there is a bug in meteor-build-client (https://github.com/frozeman/meteor-build-client/issues/34) which produces two CSS files instead of one. Since this second CSS file is not included properly, the page will appear broken. To fix this, all you have to do is open index.html and add the following at the top of the page.

    ````html
    <link rel="stylesheet" type="text/css" class="__meteor-css__" href="/[whatever your missing CSS filename is].css?meteor_css_resource=true">
    ````


### Testing the Sample client-only build
For the sake of simplicity we have also included a pre-built client-only version of the standalone viewer, which can be found in the SampleClientOnlyBuild folder.

You can test this with:

  ```` bash
  cd SampleClientOnlyBuild
  python ../etc/redirectingSimpleServer.py
  ````
