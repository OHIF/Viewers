# Local OHIF Viewer

- PouchDB + dicomweb-server + OHIF

## Development
```
# Build platform/viewer
QUICK_BUILD=true SKIP_SERVICE_WORKER=true PUBLIC_URL=./ yarn run build

# Run Electron app in development mode
cd platform/viewer
yarn install
yarn run copy-viewer
yarn run copy-config
yarn start
```

- Note, if you change the PWA you need to erase the front-end folder

#### Add some data

Two options to add data:
* Click on the plus button next to the current number of studies (starts at 0)
* Add with this command: `cd data && python seed-db.py <dir with .dcm files>`
(requires dicomweb_client, e.g. `pip install dicomweb_client`)

