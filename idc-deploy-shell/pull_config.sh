#!/usr/bin/env bash

if [ ! -f "/home/circleci/${CIRCLE_PROJECT_REPONAME}/viewer3_deployment_config.txt" ]; then
    echo gs://${DEPLOYMENT_BUCKET}/viewer3_deployment_config.txt
    # Suddenly gsutil does not like trailing slashes as gs destinations?
    echo /home/circleci/${CIRCLE_PROJECT_REPONAME}
    gsutil cp gs://${DEPLOYMENT_BUCKET}/viewer3_deployment_config.txt /home/circleci/${CIRCLE_PROJECT_REPONAME}
    ls -lasR /home/circleci/${CIRCLE_PROJECT_REPONAME}
    chmod ugo+r /home/circleci/${CIRCLE_PROJECT_REPONAME}/viewer3_deployment_config.txt
    if [ ! -f "/home/circleci/${CIRCLE_PROJECT_REPONAME}/viewer3_deployment_config.txt" ]; then
      echo "[ERROR] Couldn't assign viewer deployment configuration file - exiting."
      exit 1
    fi
else
    echo "Found deployment configuration file."
fi
