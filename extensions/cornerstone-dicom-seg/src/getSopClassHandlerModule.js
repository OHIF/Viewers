import { utils, classes } from '@ohif/core';
import { SOPClassHandlerName, SOPClassHandlerId } from './id';

const sopClassUids = ['1.2.840.10008.5.1.4.1.1.66.4'];

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
  } = instance;

  const displaySet = {
    Modality: 'SEG',
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
    isDerivedDisplaySet: true,
    isLoaded: false,
    sopClassUids,
    instance,
  };

  const referencedSeriesSequence = instance.ReferencedSeriesSequence;

  if (!referencedSeriesSequence) {
    throw new Error('ReferencedSeriesSequence is missing for the SEG');
  }

  const referencedSeries = referencedSeriesSequence[0];

  displaySet.referencedImages =
    instance.ReferencedSeriesSequence.ReferencedInstanceSequence;
  displaySet.referencedSeriesInstanceUID = referencedSeries.SeriesInstanceUID;

  displaySet.load = async () =>
    await _load(displaySet, extensionManager, servicesManager);

  return [displaySet];
}

async function _load(displaySet, extensionManager, servicesManager) {
  if (displaySet.isLoaded) {
    return;
  }

  const { instance } = displaySet;
  const segArrayBuffer = await instance.PixelData.retrieveBulkData();

  debugger;
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
