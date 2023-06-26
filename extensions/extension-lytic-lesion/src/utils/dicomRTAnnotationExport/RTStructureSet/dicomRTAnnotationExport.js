import RTSSReport from './RTSSReport';
import dcmjs from 'dcmjs';
import { classes } from '@ohif/core';

const { datasetToBlob } = dcmjs.data;
const metadataProvider = classes.MetadataProvider;

export default function dicomRTAnnotationExport(annotations) {
  const dataset = RTSSReport.generateReport(annotations, metadataProvider);
  const reportBlob = datasetToBlob(dataset);

  //Create a URL for the binary.
  var objectUrl = URL.createObjectURL(reportBlob);
  window.location.assign(objectUrl);
}
