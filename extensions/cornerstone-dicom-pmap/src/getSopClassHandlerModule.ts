import { utils, Types as OhifTypes } from '@ohif/core';
import i18n from '@ohif/i18n';
import { metaData, cache, utilities as csUtils, volumeLoader } from '@cornerstonejs/core';
import { adaptersPMAP } from '@cornerstonejs/adapters';
import { SOPClassHandlerId } from './id';
import { dicomLoaderService, VOLUME_LOADER_SCHEME } from '@ohif/extension-cornerstone';
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
    // Parametric map use to have the same modality as its referenced volume but
    // "PMAP" is used in the viewer even though this is not a valid DICOM modality
    Modality: 'PMAP',
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
    supportsWindowLevel: true,
    label: SeriesDescription || `${i18n.t('Series')} ${SeriesNumber} - ${i18n.t('PMAP')}`,
  };

  const referencedSeriesSequence = instance.ReferencedSeriesSequence;

  if (!referencedSeriesSequence) {
    console.error('ReferencedSeriesSequence is missing for the parametric map');
    return;
  }

  const referencedSeries = referencedSeriesSequence[0] || referencedSeriesSequence;

  displaySet.referencedImages = instance.ReferencedSeriesSequence.ReferencedInstanceSequence;
  displaySet.referencedSeriesInstanceUID = referencedSeries.SeriesInstanceUID;

  // Does not get the referenced displaySet during parametric displaySet creation
  // because it is still not available (getDisplaySetByUID returns `undefined`).
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

  // Does not get the referenced volumeId during parametric displaySet creation because the
  // referenced displaySet is still not available  (getDisplaySetByUID returns `undefined`).
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

const getRangeFromPixelData = (pixelData: Float32Array) => {
  let lowest = pixelData[0];
  let highest = pixelData[0];

  for (let i = 1; i < pixelData.length; i++) {
    if (pixelData[i] < lowest) {
      lowest = pixelData[i];
    }
    if (pixelData[i] > highest) {
      highest = pixelData[i];
    }
  }

  return [lowest, highest];
};

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

  displaySet.loading = true;
  displaySet.isLoaded = false;

  // We don't want to fire multiple loads, so we'll wait for the first to finish
  // and also return the same promise to any other callers.
  const promise = _loadParametricMap({
    extensionManager,
    displaySet,
    headers,
  });

  cache.putVolumeLoadObject(volumeId, { promise }).catch(err => {
    throw err;
  });

  promise
    .then(() => {
      displaySet.loading = false;
      displaySet.isLoaded = true;
      // Broadcast that loading is complete
      servicesManager.services.segmentationService._broadcastEvent(
        servicesManager.services.segmentationService.EVENTS.SEGMENTATION_LOADING_COMPLETE,
        {
          pmapDisplaySet: displaySet,
        }
      );
    })
    .catch(err => {
      displaySet.loading = false;
      displaySet.isLoaded = false;
      throw err;
    });

  return promise;
}

async function _loadParametricMap({ displaySet, headers }: withAppTypes) {
  const arrayBuffer = await dicomLoaderService.findDicomDataPromise(displaySet, null, headers);
  const referencedVolumeId = displaySet.getReferencedVolumeId();
  const cachedReferencedVolume = cache.getVolume(referencedVolumeId);

  // Parametric map can be loaded only if its referenced volume exists otherwise it will fail
  if (!cachedReferencedVolume) {
    throw new Error(
      'Referenced Volume is missing for the PMAP, and stack viewport PMAP is not supported yet'
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
      type: TypedArrayConstructor.name,
    },
  });

  const newPixelData = new TypedArrayConstructor(pixelData.length);
  for (let i = 0; i < pixelData.length; i++) {
    newPixelData[i] = pixelData[i] * 100;
  }
  derivedVolume.voxelManager.setCompleteScalarDataArray(newPixelData);
  const range = getRangeFromPixelData(newPixelData);
  const windowLevel = csUtils.windowLevel.toWindowLevel(range[0], range[1]);

  derivedVolume.metadata.voiLut = [windowLevel];
  derivedVolume.loadStatus = { loaded: true };

  return derivedVolume;
}

function getSopClassHandlerModule(params: OhifTypes.Extensions.ExtensionParams) {
  const { servicesManager, extensionManager } = params;
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
