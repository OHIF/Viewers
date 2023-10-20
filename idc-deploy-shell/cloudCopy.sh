#!/usr/bin/env bash

# Copyright 2020, Institute for Systems Biology
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


cd /home/circleci/ViewersV3/platform/app/dist/

WORKING=`pwd`
echo ${WORKING}

#
# We want to make sure we are where we think we should be, otherwise if the above
# cd fails we might find ourselves copying the keys in the current directory
# to the public cloud bucket:
#

if [ ! "${WORKING}" == "/home/circleci/ViewersV3/platform/app/dist" ]; then
  echo "Wrong location"
  exit 1
fi

# Don't want to have to run whole script as sudo, so need to fix ownership here:
sudo chown -R circleci /home/circleci/.gsutil
sudo chgrp -R circleci /home/circleci/.gsutil

if [ "${CONFIG_ONLY}" != "True" ]; then
  gsutil web set -m /v3/index.html -e /v3/index.html gs://${WBUCKET}
  gsutil -h "Cache-Control:no-cache, max-age=0" rsync -d -r . gs://${WBUCKET}/v3
else
  gsutil cp app-config.js gs://${WBUCKET}/v3
  CACHE_SETTING="Cache-Control:no-cache, max-age=0"
  gsutil setmeta -h "${CACHE_SETTING}" gs://${WBUCKET}/v3/app-config.js
fi
