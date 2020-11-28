if [ ! -f "deployment.key.json" ]; then
    echo ${DEPLOYMENT_KEY} | base64 --decode --ignore-garbage > deployment.key.json
fi

gcloud auth activate-service-account --key-file deployment.key.json | sed -e 's/gserviceaccount/gsa/'
echo "Setting deployment client email to ${DEPLOYMENT_CLIENT_EMAIL}" | sed -e 's/gserviceaccount/gsa/'
gcloud auth list | sed -e 's/gserviceaccount/gsa/'
echo "Return code for gcloud auth list is $?"

gcloud config set account $DEPLOYMENT_CLIENT_EMAIL
gcloud config list | sed -e 's/gserviceaccount/gsa/'
echo "Setting deployment project to ${DEPLOYMENT_PROJECT_ID}" | sed -e 's/idc/cid/'
gcloud config set project "$DEPLOYMENT_PROJECT_ID"
