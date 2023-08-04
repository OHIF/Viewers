#!/bin/sh

#cp /usr/share/nginx/html/google.js /usr/share/nginx/html/app-config.js

sed -i "s|https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-dev-2a0b/locations/us/datasets/mib-air-dicom-dataset-dev/dicomStores/mib-air-dicom-datastore-dev/dicomWeb|$APP_GCP_URL|g" /usr/share/nginx/html/app-config.js
sed -i "s|airstudies-dev|$APP_URL_PREFIX|g" /usr/share/nginx/html/app.bundle.*.js

echo "Starting Nginx to serve the OHIF Viewer..."

exec "$@"
