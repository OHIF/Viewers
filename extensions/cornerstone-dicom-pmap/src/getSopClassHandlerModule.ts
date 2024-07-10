import { utils } from '@ohif/core';
import { metaData, cache, utilities as csUtils, volumeLoader } from '@cornerstonejs/core';
import { adaptersPMAP } from '@cornerstonejs/adapters';
import { SOPClassHandlerId } from './id';

const VOLUME_LOADER_SCHEME = 'cornerstoneStreamingImageVolume';
const sopClassUids = ['1.2.840.10008.5.1.4.1.1.30'];

function _getDisplaySetsFromSeries(
  instances,
  servicesManager: AppTypes.ServicesManager,
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
    // Parametric map use to have the same modality as its referenced volume
    // but "other" is used here just to remove its thumbnail on the Study Browser
    // without making any extra change to the viewer. It also makes more sense
    // to do not see a thumbnail for an OT series other than CT or MR ones.
    Modality: 'OT',
    isReconstructable: true, // by default for now
    displaySetInstanceUID: `pmap.${utils.guid()}`,
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
    referencedVolumeURI: null,
    referencedVolumeId: null,
    isDerivedDisplaySet: true,
    loadStatus: {
      loading: false,
      loaded: false,
    },
    sopClassUids,
    instance,
    instances: [instance],
    wadoRoot,
    wadoUriRoot,
    wadoUri,
    hasVolumeData: true,
  };

  const referencedSeriesSequence = instance.ReferencedSeriesSequence;

  if (!referencedSeriesSequence) {
    console.error('ReferencedSeriesSequence is missing for the parametric map');
    return;
  }

  const referencedSeries = referencedSeriesSequence[0] || referencedSeriesSequence;

  displaySet.referencedImages = instance.ReferencedSeriesSequence.ReferencedInstanceSequence;
  displaySet.referencedSeriesInstanceUID = referencedSeries.SeriesInstanceUID;

  displaySet.getReferenceDisplaySet = () => {
    const { displaySetService } = servicesManager.services;

    if (displaySet.referencedDisplaySetInstanceUID) {
      return displaySetService.getDisplaySetByUID(displaySet.referencedDisplaySetInstanceUID);
    }

    const referencedDisplaySets = displaySetService.getDisplaySetsForSeries(
      displaySet.referencedSeriesInstanceUID
    );

    if (!referencedDisplaySets || referencedDisplaySets.length === 0) {
      throw new Error('Referenced displaySet is missing for the parametric map');
    }

    const referencedDisplaySet = referencedDisplaySets[0];

    displaySet.referencedDisplaySetInstanceUID = referencedDisplaySet.displaySetInstanceUID;

    return referencedDisplaySet;
  };

  displaySet.getReferencedVolumeId = () => {
    if (displaySet.referencedVolumeId) {
      return displaySet.referencedVolumeId;
    }

    const referencedDisplaySet = displaySet.getReferenceDisplaySet();
    const referencedVolumeURI = referencedDisplaySet.displaySetInstanceUID;
    const referencedVolumeId = `${VOLUME_LOADER_SCHEME}:${referencedVolumeURI}`;

    displaySet.referencedVolumeURI = referencedVolumeURI;
    displaySet.referencedVolumeId = referencedVolumeId;

    return referencedVolumeId;
  };

  displaySet.load = async ({ headers }) =>
    await _load(displaySet, servicesManager, extensionManager, headers);

  return [displaySet];
}

async function _load(
  displaySet,
  servicesManager: AppTypes.ServicesManager,
  extensionManager,
  headers
) {
  const volumeId = `${VOLUME_LOADER_SCHEME}:${displaySet.displaySetInstanceUID}`;
  const volumeLoadObject = cache.getVolumeLoadObject(volumeId);

  if (volumeLoadObject) {
    return volumeLoadObject.promise;
  }

  displaySet.loadStatus.loading = true;

  // We don't want to fire multiple loads, so we'll wait for the first to finish
  // and also return the same promise to any other callers.
  // loadPromises[SOPInstanceUID] = new Promise(async (resolve, reject) => {
  const promise = _loadParametricMap({
    extensionManager,
    servicesManager,
    displaySet,
    headers,
  });

  cache.putVolumeLoadObject(volumeId, { promise }).catch(err => {
    throw err;
  });

  promise
    .then(() => {
      displaySet.loadStatus.loading = false;
      displaySet.loadStatus.loaded = true;
    })
    .catch(err => {
      displaySet.loadStatus.loading = false;
      throw err;
    });

  return promise;
}

async function _loadParametricMap({
  extensionManager,
  servicesManager,
  displaySet,
  headers,
}: withAppTypes) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.common'
  );

  const { dicomLoaderService } = utilityModule.exports;
  const arrayBuffer = await dicomLoaderService.findDicomDataPromise(displaySet, null, headers);
  const referencedVolumeId = displaySet.getReferencedVolumeId();
  const cachedReferencedVolume = cache.getVolume(referencedVolumeId);

  if (!cachedReferencedVolume) {
    throw new Error(
      'Referenced Volume is missing for the SEG, and stack viewport SEG is not supported yet'
    );
  }

  const { imageIds } = cachedReferencedVolume;
  const results = await adaptersPMAP.Cornerstone3D.ParametricMap.generateToolState(
    imageIds,
    arrayBuffer,
    metaData
  );
  const { pixelData } = results;
  const TypedArrayConstructor = pixelData.constructor;
  const paramMapId = displaySet.displaySetInstanceUID;

  const derivedVolume = await volumeLoader.createAndCacheDerivedVolume(referencedVolumeId, {
    volumeId: paramMapId,
    targetBuffer: {
      type: TypedArrayConstructor.name, // 'Int16Array'
    },
  });

  derivedVolume.getScalarData().set(pixelData);

  const range = derivedVolume.imageData.getPointData().getScalars().getRange();
  const windowLevel = csUtils.windowLevel.toWindowLevel(range[0], range[1]);

  derivedVolume.metadata.voiLut = [windowLevel];
  derivedVolume.loadStatus = { loaded: true };

  return derivedVolume;
}

function getSopClassHandlerModule({ servicesManager, extensionManager }) {
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
  };

  return [
    {
      name: 'dicom-pmap',
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}

export default getSopClassHandlerModule;
