import * as DICOMwebClient from 'dicomweb-client';

export default function getDicomWebClient() {
  const url = window.config.dataSources[0].configuration.wadoRoot;
  const client = new DICOMwebClient.api.DICOMwebClient({ url });
  client.wadoURL = url;
  return client;
}
