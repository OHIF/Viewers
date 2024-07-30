#!/usr/bin/env bash

if [ ! -f "/home/circleci/${CIRCLE_PROJECT_REPONAME}/viewer3_deployment_config.txt" ]; then
    gsutil cp gs://${DEPLOYMENT_BUCKET}/viewer3_deployment_config.txt /home/circleci/${CIRCLE_PROJECT_REPONAME}/
    chmod ugo+r /home/circleci/${CIRCLE_PROJECT_REPONAME}/viewer3_deployment_config.txt
    if [ ! -f "/home/circleci/${CIRCLE_PROJECT_REPONAME}/viewer3_deployment_config.txt" ]; then
      echo "[ERROR] Couldn't assign viewer deployment configuration file - exiting."
      exit 1
    fi
else
    echo "Found deployment configuration file."
fi
