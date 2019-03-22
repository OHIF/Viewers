import { OHIF } from 'meteor/ohif:core';
import GCloudAdapter from './lib/GCloudAdapter';

const gcloud = GCloudAdapter;

OHIF.gcloud = gcloud;


