#!/usr/bin/env bash

# Copyright 2021, Institute for Systems Biology
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

# Have to enable compute API in project first

PUB_PROJ=your-project
OHIF_BUCKET=your-ohif-bucket
OHIF_SERVER=your-ohif-server
SLIM_BUCKET=your-slim-bucket
SLIM_SERVER=your-slim-server

gcloud services enable compute.googleapis.com --project=${PUB_PROJ}

gcloud compute backend-buckets create ohif-buck --gcs-bucket-name=${OHIF_BUCKET} --project=${PUB_PROJ}

gcloud compute backend-buckets create slim-buck --gcs-bucket-name=${SLIM_BUCKET} --project=${PUB_PROJ}

gcloud compute url-maps create public-viewer-map --default-backend-bucket=ohif-buck --project=${PUB_PROJ}

gcloud compute url-maps add-path-matcher public-viewer-map \
    --path-matcher-name=path-matcher-ohif \
    --new-hosts=${OHIF_SERVER} \
    --default-backend-bucket=ohif-buck --project=${PUB_PROJ}

gcloud compute url-maps add-path-matcher public-viewer-map \
    --path-matcher-name=path-matcher-slim \
    --new-hosts=${SLIM_SERVER} \
    --default-backend-bucket=slim-buck --project=${PUB_PROJ}

gcloud compute addresses create public-viewer-ip --global --ip-version IPV4 --project=${PUB_PROJ}
gcloud compute addresses describe public-viewer-ip

IP_ADDRESS=`gcloud compute addresses describe --global public-viewer-ip | grep address: | awk '{print $2}' --project=${PUB_PROJ}`

# Add the domains to the DNS service!

gcloud compute ssl-certificates create pub-viewer-cert --domains ${OHIF_SERVER},${SLIM_SERVER}

gcloud compute target-https-proxies create public-viewer-proxy --url-map=public-viewer-map --ssl-certificates=pub-viewer-cert --project=${PUB_PROJ}

gcloud compute forwarding-rules create https-pub-view-forwarding-rule --address=${IP_ADDRESS} --global --target-https-proxy=public-viewer-proxy --ports=443 --project=${PUB_PROJ}