import RTSS from '../RTSS/RTSS';
import dcmjs from 'dcmjs';
import { classes } from '@ohif/core';

const { datasetToBlob } = dcmjs.data;
const metadataProvider = classes.MetadataProvider;

export default async function dicomRTSSExport(segmentations, shouldDownload) {
  console.log('TP1');
  console.log(segmentations);
  const dataset = await RTSS.generateRTSS(segmentations, metadataProvider);
  console.log(dataset);

  if (shouldDownload) {
    const reportBlob = datasetToBlob(dataset);

    //Create a URL for the binary.
    var objectUrl = URL.createObjectURL(reportBlob);
    window.location.assign(objectUrl);
  }

  return dataset;
}
