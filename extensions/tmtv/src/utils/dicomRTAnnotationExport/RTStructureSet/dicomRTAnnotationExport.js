import dcmjs from 'dcmjs';
import { classes, DicomMetadataStore } from '@ohif/core';
import { adaptersSEG } from '@cornerstonejs/adapters';

const { datasetToBlob } = dcmjs.data;
const metadataProvider = classes.MetadataProvider;

export default function dicomRTAnnotationExport(annotations) {
  const dataset = adaptersSEG.Cornerstone3D.RTStruct.RTSS.generateRTSSFromAnnotations(
    annotations,
    metadataProvider,
    DicomMetadataStore
  );
  const reportBlob = datasetToBlob(dataset);

  //Create a URL for the binary.
  var objectUrl = URL.createObjectURL(reportBlob);
  window.location.assign(objectUrl);
}
