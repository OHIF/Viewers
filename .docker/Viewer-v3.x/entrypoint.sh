#!/bin/sh

#cp /usr/share/nginx/html/google.js /usr/share/nginx/html/app-config.js

sed -i "s|https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-dev-2a0b/locations/us/datasets/mib-air-dicom-dataset-dev/dicomStores/mib-air-dicom-datastore-dev/dicomWeb|$APP_GCP_URL|g" /usr/share/nginx/html/app-config.js
sed -i "s|airstudies-dev|$APP_URL_PREFIX|g" /usr/share/nginx/html/app.bundle.*.js

mkdir "/etc/nginx/certs"

chmod 644 "/etc/nginx/certs"

aws ssm get-parameter --name "$APP_CERT" --with-decryption --query Parameter.Value --output text > /etc/nginx/certs/wildcard_ccr_cancer_gov.crt
aws ssm get-parameter --name "$APP_CERT_KEY" --with-decryption --query Parameter.Value --output text > /etc/nginx/certs/wildcard_ccr_cancer_gov.key
aws ssm get-parameter --name "$APP_CERT_CHAIN" --with-decryption --query Parameter.Value --output text > /etc/nginx/certs/wildcard_ccr_truster_chain.crt
aws ssm get-parameter --name "$APP_DHPARAM" --with-decryption --query Parameter.Value --output text > /etc/nginx/certs/dhparam.pem

echo "Starting Nginx to serve the OHIF Viewer..."

exec "$@"
