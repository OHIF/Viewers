import vtkMath from '@kitware/vtk.js/Common/Core/Math';

import { utils } from '@ohif/core';

import { SOPClassHandlerId } from './id';
import dcmjs from 'dcmjs';

const { DicomMessage, DicomMetaDictionary } = dcmjs.data;

const sopClassUids = ['1.2.840.10008.5.1.4.1.1.66.4'];

let loadPromises = {};

function _getDisplaySetsFromSeries(
  instances,
  servicesManager,
  extensionManager
) {
  const instance = instances[0];

  const {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    SOPClassUID,
    wadoRoot,
    wadoUri,
    wadoUriRoot,
  } = instance;

  const displaySet = {
    Modality: 'SEG',
    loading: false,
    isReconstructable: true, // by default for now since it is a volumetric SEG currently
    displaySetInstanceUID: utils.guid(),
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    SOPClassHandlerId,
    SOPClassUID,
    referencedImages: null,
    referencedSeriesInstanceUID: null,
    referencedDisplaySetInstanceUID: null,
    isDerivedDisplaySet: true,
    isLoaded: false,
    isHydrated: false,
    segments: {},
    sopClassUids,
    instance,
    instances: [instance],
    wadoRoot,
    wadoUriRoot,
    wadoUri,
    isOverlayDisplaySet: true,
  };

  const referencedSeriesSequence = instance.ReferencedSeriesSequence;

  if (!referencedSeriesSequence) {
    throw new Error('ReferencedSeriesSequence is missing for the SEG');
  }

  const referencedSeries = referencedSeriesSequence[0];

  displaySet.referencedImages =
    instance.ReferencedSeriesSequence.ReferencedInstanceSequence;
  displaySet.referencedSeriesInstanceUID = referencedSeries.SeriesInstanceUID;

  displaySet.getReferenceDisplaySet = () => {
    const { displaySetService } = servicesManager.services;
    const referencedDisplaySets = displaySetService.getDisplaySetsForSeries(
      displaySet.referencedSeriesInstanceUID
    );

    if (!referencedDisplaySets || referencedDisplaySets.length === 0) {
      throw new Error('Referenced DisplaySet is missing for the SEG');
    }

    const referencedDisplaySet = referencedDisplaySets[0];

    displaySet.referencedDisplaySetInstanceUID =
      referencedDisplaySet.displaySetInstanceUID;

    // Todo: this needs to be able to work with other reference volumes (other than streaming) such as nifti, etc.
    displaySet.referencedVolumeURI = referencedDisplaySet.displaySetInstanceUID;
    const referencedVolumeId = `cornerstoneStreamingImageVolume:${displaySet.referencedVolumeURI}`;
    displaySet.referencedVolumeId = referencedVolumeId;

    return referencedDisplaySet;
  };

  displaySet.load = async ({ headers }) =>
    await _load(displaySet, servicesManager, extensionManager, headers);

  return [displaySet];
}

function _load(segDisplaySet, servicesManager, extensionManager, headers) {
  const { SOPInstanceUID } = segDisplaySet;
  const { segmentationService } = servicesManager.services;

  if (
    (segDisplaySet.loading || segDisplaySet.isLoaded) &&
    loadPromises[SOPInstanceUID] &&
    _segmentationExists(segDisplaySet, segmentationService)
  ) {
    return loadPromises[SOPInstanceUID];
  }

  segDisplaySet.loading = true;

  // We don't want to fire multiple loads, so we'll wait for the first to finish
  // and also return the same promise to any other callers.
  loadPromises[SOPInstanceUID] = new Promise(async (resolve, reject) => {
    if (
      !segDisplaySet.segments ||
      Object.keys(segDisplaySet.segments).length === 0
    ) {
      const segments = await _loadSegments(
        extensionManager,
        segDisplaySet,
        headers
      );

      segDisplaySet.segments = segments;
    }

    const suppressEvents = true;
    segmentationService
      .createSegmentationForSEGDisplaySet(segDisplaySet, null, suppressEvents)
      .then(() => {
        segDisplaySet.loading = false;
        resolve();
      })
      .catch(error => {
        segDisplaySet.loading = false;
        reject(error);
      });
  });

  return loadPromises[SOPInstanceUID];
}

async function _loadSegments(extensionManager, segDisplaySet, headers) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.common'
  );

  const { dicomLoaderService } = utilityModule.exports;
  const segArrayBuffer = await dicomLoaderService.findDicomDataPromise(
    segDisplaySet,
    null,
    headers
  );

  const dicomData = DicomMessage.readFile(segArrayBuffer);
  const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);
  dataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);

  if (!Array.isArray(dataset.SegmentSequence)) {
    dataset.SegmentSequence = [dataset.SegmentSequence];
  }

  const segments = _getSegments(dataset);
  return segments;
}

function _segmentationExists(segDisplaySet, segmentationService) {
  // This should be abstracted with the CornerstoneCacheService
  return segmentationService.getSegmentation(
    segDisplaySet.displaySetInstanceUID
  );
}

function _getPixelData(dataset, segments) {
  let frameSize = Math.ceil((dataset.Rows * dataset.Columns) / 8);
  let nextOffset = 0;

  Object.keys(segments).forEach(segmentKey => {
    const segment = segments[segmentKey];
    segment.numberOfFrames = segment.functionalGroups.length;
    segment.size = segment.numberOfFrames * frameSize;
    segment.offset = nextOffset;
    nextOffset = segment.offset + segment.size;
    const packedSegment = dataset.PixelData[0].slice(
      segment.offset,
      nextOffset
    );

    segment.pixelData = dcmjs.data.BitArray.unpack(packedSegment);
    segment.geometry = geometryFromFunctionalGroups(
      dataset,
      segment.functionalGroups
    );
  });

  return segments;
}

function geometryFromFunctionalGroups(dataset, perFrame) {
  let pixelMeasures =
    dataset.SharedFunctionalGroupsSequence.PixelMeasuresSequence;
  let planeOrientation =
    dataset.SharedFunctionalGroupsSequence.PlaneOrientationSequence;
  let planePosition = perFrame[0].PlanePositionSequence; // TODO: assume sorted frames!

  const geometry = {};

  // NB: DICOM PixelSpacing is defined as Row then Column,
  // unlike ImageOrientationPatient
  let spacingBetweenSlices = pixelMeasures.SpacingBetweenSlices;
  if (!spacingBetweenSlices) {
    if (pixelMeasures.SliceThickness) {
      console.log('Using SliceThickness as SpacingBetweenSlices');
      spacingBetweenSlices = pixelMeasures.SliceThickness;
    }
  }
  geometry.spacing = [
    pixelMeasures.PixelSpacing[1],
    pixelMeasures.PixelSpacing[0],
    spacingBetweenSlices,
  ].map(Number);

  geometry.dimensions = [dataset.Columns, dataset.Rows, perFrame.length].map(
    Number
  );

  let orientation = planeOrientation.ImageOrientationPatient.map(Number);
  const columnStepToPatient = orientation.slice(0, 3);
  const rowStepToPatient = orientation.slice(3, 6);
  geometry.planeNormal = [];
  vtkMath.cross(columnStepToPatient, rowStepToPatient, geometry.planeNormal);

  let firstPosition = perFrame[0].PlanePositionSequence.ImagePositionPatient.map(
    Number
  );
  let lastPosition = perFrame[
    perFrame.length - 1
  ].PlanePositionSequence.ImagePositionPatient.map(Number);
  geometry.sliceStep = [];
  vtkMath.subtract(lastPosition, firstPosition, geometry.sliceStep);
  vtkMath.normalize(geometry.sliceStep);
  geometry.direction = columnStepToPatient
    .concat(rowStepToPatient)
    .concat(geometry.sliceStep);
  geometry.origin = planePosition.ImagePositionPatient.map(Number);

  return geometry;
}

function _getSegments(dataset) {
  const segments = {};

  dataset.SegmentSequence.forEach(segment => {
    const cielab = segment.RecommendedDisplayCIELabValue;
    const rgba = dcmjs.data.Colors.dicomlab2RGB(cielab).map(x =>
      Math.round(x * 255)
    );

    rgba.push(255);
    const segmentNumber = segment.SegmentNumber;

    segments[segmentNumber] = {
      color: rgba,
      functionalGroups: [],
      offset: null,
      size: null,
      pixelData: null,
      label: segment.SegmentLabel,
    };
  });

  // make a list of functional groups per segment
  dataset.PerFrameFunctionalGroupsSequence.forEach(functionalGroup => {
    const segmentNumber =
      functionalGroup.SegmentIdentificationSequence.ReferencedSegmentNumber;
    segments[segmentNumber].functionalGroups.push(functionalGroup);
  });

  return _getPixelData(dataset, segments);
}

function getSopClassHandlerModule({ servicesManager, extensionManager }) {
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(
      instances,
      servicesManager,
      extensionManager
    );
  };

  return [
    {
      name: 'dicom-seg',
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}

export default getSopClassHandlerModule;
