import dcmjs from 'dcmjs';
import { classes, DicomMetadataStore } from '@ohif/core';
import { adaptersRT } from '@cornerstonejs/adapters';

const { datasetToBlob } = dcmjs.data;
const metadataProvider = classes.MetadataProvider;

export default function dicomRTAnnotationExport(annotations) {
  const dataset = adaptersRT.Cornerstone3D.RTSS.generateRTSSFromAnnotations(
    annotations,
    metadataProvider,
    DicomMetadataStore
  );
  const reportBlob = datasetToBlob(dataset);

  //Create a URL for the binary.
  var objectUrl = URL.createObjectURL(reportBlob);
  window.location.assign(objectUrl);
}
