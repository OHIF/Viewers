import { OHIF } from 'meteor/ohif:core';
import GCloudAdapter from './lib/GCloudAdapter';

if (Meteor.settings.public.googleCloud) {
  const gcloud = GCloudAdapter; 
  OHIF.gcloud = gcloud;
}


