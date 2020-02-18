import OHIF from '@ohif/core';
import * as dcmjs from 'dcmjs';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import transformPointsToImagePlane from './utils/transformPointsToImagePlane';

const { DicomLoaderService } = OHIF.utils;

export default async function loadRTStruct(
  rtStructDisplaySet,
  referencedDisplaySet,
  studies
) {
  // Set here is loading is asynchronous.
  // If this function throws its set back to false.
  rtStructDisplaySet.isLoaded = true;

  const { studyInstanceUid, seriesInstanceUid } = referencedDisplaySet;

  const segArrayBuffer = await DicomLoaderService.findDicomDataPromise(
    rtStructDisplaySet,
    studies
  );

  const dicomData = dcmjs.data.DicomMessage.readFile(segArrayBuffer);
  const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
    dicomData.dict
  );

  dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);

  console.log(dataset);
  console.log(referencedDisplaySet);

  debugger;

  const {
    StructureSetROISequence,
    ROIContourSequence,
    RTROIObservationsSequence,
    StructureSetLabel,
  } = dataset;

  const imageIdList = _getImageIdsForDisplaySet(
    studies,
    studyInstanceUid,
    seriesInstanceUid
  );

  const _getImageId = sopInstanceUID => {
    const imageIdListEntry = imageIdList.find(
      imageIdListEntry => imageIdListEntry.sopInstanceUID === sopInstanceUID
    );

    return imageIdListEntry.imageId;
  };

  const metadata = [];

  StructureSetROISequence.forEach(structureSetROI => {
    metadata.push({
      ROIName: structureSetROI.ROIName,
      ROINumber: structureSetROI.ROINumber,
      // structure sets series instance uid?
    });
  });

  if (RTROIObservationsSequence) {
    // TODO -> Consume RTROIObservationsSequence
  }

  for (let i = 0; i < ROIContourSequence.length; i++) {
    const ROIContour = ROIContourSequence[i];
    const { referencedROINumber, ContourSequence } = ROIContour;

    for (let c = 0; c < ContourSequence.length; c++) {
      const {
        ContourImageSequence,
        ContourData,
        NumberOfContourPoints,
        ContourGeometricType,
      } = ContourSequence[c];

      const sopInstanceUID = ContourImageSequence.ReferencedSOPInstanceUID;
      const imageId = _getImageId(sopInstanceUID);
      const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageId);
      const points = [];

      for (let p = 0; p < NumberOfContourPoints; p += 3) {
        points.push({
          x: ContourData[p],
          y: ContourData[p + 1],
          z: ContourData[p + 2],
        });
      }

      transformPointsToImagePlane(points, imagePlane);

      // TODO -> Do something with these points.
    }

    debugger;
  }

  debugger;
}

function _getImageIdsForDisplaySet(
  studies,
  studyInstanceUid,
  seriesInstanceUid
) {
  const study = studies.find(
    study => study.studyInstanceUid === studyInstanceUid
  );

  const displaySets = study.displaySets.filter(set => {
    return set.seriesInstanceUid === seriesInstanceUid;
  });

  if (displaySets.length > 1) {
    console.warn(
      'More than one display set with the same seriesInstanceUid. This is not supported yet...'
    );
    // TODO -> We could make check the instance list and see if any match?
    // Do we split the segmentation into two cornerstoneTools segmentations if there are images in both series?
    // ^ Will that even happen?
  }

  const referencedDisplaySet = displaySets[0];

  return referencedDisplaySet.images.map(image => {
    return {
      imageId: image.getImageId(),
      sopInstanceUID: image.getSOPInstanceUID(),
    };
  });
}
