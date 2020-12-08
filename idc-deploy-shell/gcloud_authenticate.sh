#!/usr/bin/env bash

if [ ! -f "deployment.key.json" ]; then
    echo ${DEPLOYMENT_KEY} | base64 --decode --ignore-garbage > deployment.key.json
fi

gcloud auth activate-service-account --key-file deployment.key.json
echo "Setting deployment client email to ${DEPLOYMENT_CLIENT_EMAIL}"
gcloud auth list
echo "Return code for gcloud auth list is $?"

gcloud config set account $DEPLOYMENT_CLIENT_EMAIL
gcloud config list
echo "Setting deployment project to ${DEPLOYMENT_PROJECT_ID}"
gcloud config set project "$DEPLOYMENT_PROJECT_ID"

#
# This script is run as sudo, so make the gsutil stuff writable as circleci
mkdir -p /home/circleci/.config
mkdir -p /home/circleci/.gsutil
chown -R circleci /home/circleci/.config /home/circleci/.gsutil
chgrp -R circleci /home/circleci/.config /home/circleci/.gsutil
