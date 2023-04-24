#!/bin/sh

cp /app/dist/google.js /app/dist/app-config.js

sed -i "s|https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-dev-2a0b/locations/us/datasets/mib-air-dicom-dataset-dev/dicomStores/mib-air-dicom-datastore-dev/dicomWeb|$APP_GCP_URL|g" /app/dist/app-config.js

echo "Starting NodeJS to serve the OHIF Viewer..."

exec "$@"
