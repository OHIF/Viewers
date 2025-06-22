#!/bin/sh
set -e

# Capture Orthanc logs
orthanc /etc/orthanc/orthanc.json > /var/log/orthanc.log 2>&1 &

nginx -g "daemon off;"
