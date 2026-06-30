import { utils, Types as OhifTypes, DicomMetadataStore, classes, log } from '@ohif/core';
import i18n from '@ohif/i18n';
import { metaData, eventTarget, utilities as csUtils } from '@cornerstonejs/core';
import { CONSTANTS, segmentation as cstSegmentation } from '@cornerstonejs/tools';
import { adaptersSEG, Enums } from '@cornerstonejs/adapters';

import { SOPClassHandlerId } from './id';
import { dicomlabToRGB } from './utils/dicomlabToRGB';
import { getSegmentationParserType } from './utils/segmentationConfig';
import {
  getFrameIndexFromImageId,
  isLocalSchemeImageId,
  stripFrameFromImageId,
} from './utils/segLocalImageIds';

const sopClassUids = ['1.2.840.10008.5.1.4.1.1.66.4', '1.2.840.10008.5.1.4.1.1.66.7'];
const LABELMAP_SEG_SOP_CLASS_UID = '1.2.840.10008.5.1.4.1.1.66.7';

const loadPromises = {};

const SEG_LOAD_LOG_PREFIX = '[SEG load]';

// Max number of SEG frames fetched/decoded concurrently by the segmentation
// loader. Hard-coded to 16 for now; intended to become configurable (and to
// pair with the full-instance prefetch capability) in a follow-up.
const SEG_FRAME_DECODE_CONCURRENCY = 16;

function _normalizeImageId(imageId: string | string[] | undefined): string | undefined {
  if (imageId == null) {
    return undefined;
  }
  return Array.isArray(imageId) ? imageId[0] : imageId;
}

/**
 * Expands a WADO-RS frame imageId (…/frames/1) into one imageId per frame.
 * Multiframe SEG is stored as separate /frames/N resources on the server.
 */
function getFrameImageIds(segImageId: string, numberOfFrames: number): string[] {
  const frameMatch = segImageId.match(/(.*\/frames\/)(\d+)(.*)$/);
  if (!frameMatch || numberOfFrames <= 1) {
    return [segImageId];
  }

  const prefix = frameMatch[1];
  const suffix = frameMatch[3] || '';
  const frameImageIds: string[] = [];

  for (let frameNumber = 1; frameNumber <= numberOfFrames; frameNumber++) {
    frameImageIds.push(`${prefix}${frameNumber}${suffix}`);
  }

  return frameImageIds;
}

function _getSegNumberOfFrames(instance: Record<string, unknown>): number {
  const fromTag = Number(instance.NumberOfFrames);
  if (fromTag > 0) {
    return fromTag;
  }

  const perFrame = instance.PerFrameFunctionalGroupsSequence;
  if (Array.isArray(perFrame) && perFrame.length > 0) {
    return perFrame.length;
  }

  return 1;
}

function _ensureSegImageIdMetadataRegistered(
  imageId: string | undefined,
  instance: Record<string, unknown>
): void {
  if (!imageId) {
    return;
  }

  const metadataProvider = classes.MetadataProvider;

  const StudyInstanceUID = instance.StudyInstanceUID as string | undefined;
  const SeriesInstanceUID = instance.SeriesInstanceUID as string | undefined;
  const SOPInstanceUID = (instance.SOPInstanceUID || instance.SopInstanceUID) as
    | string
    | undefined;

  if (!StudyInstanceUID || !SeriesInstanceUID || !SOPInstanceUID) {
    return;
  }

  metadataProvider.addImageIdToUIDs(imageId, {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    frameNumber: getFrameIndexFromImageId(imageId),
  });
}

/** Ensures metadataProvider.get('instance', imageId) resolves for frame-qualified local SEG ids. */
function _ensureSegInstanceMetadataAvailable(
  imageId: string | undefined,
  instance: Record<string, unknown>
): void {
  if (!imageId) {
    return;
  }

  _ensureSegImageIdMetadataRegistered(imageId, instance);

  if (metaData.get('instance', imageId)) {
    return;
  }

  const StudyInstanceUID = instance.StudyInstanceUID as string | undefined;
  const SeriesInstanceUID = instance.SeriesInstanceUID as string | undefined;
  const SOPInstanceUID = (instance.SOPInstanceUID || instance.SopInstanceUID) as
    | string
    | undefined;

  const storedInstance =
    StudyInstanceUID && SeriesInstanceUID && SOPInstanceUID
      ? DicomMetadataStore.getInstance(StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID)
      : undefined;

  classes.MetadataProvider.addCustomMetadata(
    imageId,
    'instance',
    storedInstance || instance
  );
}

function _getSegDataSource(extensionManager, instance: Record<string, unknown>) {
  const StudyInstanceUID = instance.StudyInstanceUID as string | undefined;
  const SeriesInstanceUID = instance.SeriesInstanceUID as string | undefined;
  const SOPInstanceUID = (instance.SOPInstanceUID || instance.SopInstanceUID) as
    | string
    | undefined;

  let localUrl: string | undefined;

  if (StudyInstanceUID && SeriesInstanceUID && SOPInstanceUID) {
    const storedInstance = DicomMetadataStore.getInstance(
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID
    );
    localUrl = storedInstance?.url as string | undefined;
  }

  localUrl = localUrl || (instance.url as string | undefined);

  if (localUrl && isLocalSchemeImageId(localUrl)) {
    const dicomLocal = extensionManager.getDataSources('dicomlocal');

    if (dicomLocal?.[0]) {
      return dicomLocal[0];
    }
  }

  return extensionManager.getActiveDataSource()[0];
}

function _getSegImageIdFromInstance(
  instance: Record<string, unknown>,
  dataSource: { getImageIdsForInstance?: (args: { instance: unknown; frame?: number }) => unknown }
): string | undefined {
  const numberOfFrames = _getSegNumberOfFrames(instance);
  const frame = numberOfFrames > 1 ? 1 : undefined;

  return _normalizeImageId(
    dataSource.getImageIdsForInstance?.({ instance, frame }) as string | string[] | undefined
  );
}

function _resolveFrameImageIds(
  segImageIdStr: string,
  instance: Record<string, unknown>,
  dataSource: { getImageIdsForInstance?: (args: { instance: unknown; frame?: number }) => unknown }
): string[] {
  const numberOfFrames = _getSegNumberOfFrames(instance);
  const fromFrameUrl = getFrameImageIds(segImageIdStr, numberOfFrames);

  if (fromFrameUrl.length > 1) {
    return fromFrameUrl;
  }

  if (numberOfFrames <= 1) {
    return [segImageIdStr];
  }

  const frameImageIds: string[] = [];

  for (let frame = 1; frame <= numberOfFrames; frame++) {
    const frameImageId = _normalizeImageId(
      dataSource.getImageIdsForInstance?.({ instance, frame }) as string | string[] | undefined
    );

    if (frameImageId) {
      frameImageIds.push(frameImageId);
    }
  }

  return frameImageIds.length ? frameImageIds : [segImageIdStr];
}

function _logSegImageIds({
  segDisplaySet,
  segImageIdStr,
  frameImageIds,
  referencedImageIds,
}: {
  segDisplaySet: AppTypes.DisplaySet;
  segImageIdStr: string;
  frameImageIds: string[];
  referencedImageIds: string[];
}) {
  const instance = segDisplaySet.instance as Record<string, unknown>;
  const numberOfFrames = Number(instance?.NumberOfFrames) || 1;

  log.debug(SEG_LOAD_LOG_PREFIX, 'Loading SEG pixel data', {
    SOPInstanceUID: segDisplaySet.SOPInstanceUID,
    SeriesInstanceUID: segDisplaySet.SeriesInstanceUID,
    SOPClassUID: segDisplaySet.SOPClassUID,
    NumberOfFrames: numberOfFrames,
    segmentCount: Object.keys(segDisplaySet.segments || {}).length,
    referencedDisplaySetInstanceUID: segDisplaySet.referencedDisplaySetInstanceUID,
    referencedImageIdCount: referencedImageIds.length,
    referencedImageIds,
    segImageIdForMetadata: segImageIdStr,
    frameImageIds,
    loadSegFramesIndividually: frameImageIds.length > 1,
  });
}

function _getDisplaySetsFromSeries(
  instances,
  servicesManager: AppTypes.ServicesManager,
  extensionManager
) {
  utils.sortStudyInstances(instances);

  // Choose the LAST instance in the list as the most recently created one.
  const instance = instances[instances.length - 1];

  const {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    SeriesDescription = '',
    SeriesNumber,
    SeriesDate,
    StructureSetDate,
    SOPClassUID,
    FrameOfReferenceUID,
    wadoRoot,
    wadoUri,
    wadoUriRoot,
    imageId: predecessorImageId,
  } = instance;

  const displaySet = {
    Modality: 'SEG',
    loading: false,
    isReconstructable: false,
    displaySetInstanceUID: utils.guid(),
    SeriesDescription,
    SeriesNumber,
    SeriesDate: SeriesDate || StructureSetDate || '',
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    SOPClassHandlerId,
    SOPClassUID,
    FrameOfReferenceUID,
    referencedImages: null,
    referencedSeriesInstanceUID: null,
    referencedDisplaySetInstanceUID: null,
    isDerivedDisplaySet: true,
    isLoaded: false,
    isHydrated: false,
    segments: {},
    sopClassUids,
    instance,
    predecessorImageId,
    instances: [instance],
    wadoRoot,
    wadoUriRoot,
    wadoUri,
    isOverlayDisplaySet: true,
    label: SeriesDescription || `${i18n.t('Series')} ${SeriesNumber} - ${i18n.t('SEG')}`,
  };

  const referencedSeriesSequence = instance.ReferencedSeriesSequence;

  if (!referencedSeriesSequence) {
    console.error('ReferencedSeriesSequence is missing for the SEG');
    return;
  }

  const referencedSeries = referencedSeriesSequence[0] || referencedSeriesSequence;

  displaySet.referencedImages = instance.ReferencedSeriesSequence.ReferencedInstanceSequence;
  displaySet.referencedSeriesInstanceUID = referencedSeries.SeriesInstanceUID;
  const { displaySetService } = servicesManager.services;
  const referencedDisplaySets = displaySetService.getDisplaySetsForReferences(
    instance.ReferencedSeriesSequence
  );

  if (referencedDisplaySets?.length > 1) {
    console.warn(
      'Segmentation does not currently handle references to multiple series, defaulting to first series'
    );
  }

  const referencedDisplaySet = referencedDisplaySets[0];

  if (!referencedDisplaySet) {
    // subscribe to display sets added which means at some point it will be available
    const { unsubscribe } = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_ADDED,
      ({ displaySetsAdded }) => {
        // here we can also do a little bit of search, since sometimes DICOM SEG
        // does not contain the referenced display set uid , and we can just
        // see which of the display sets added is more similar and assign it
        // to the referencedDisplaySet
        const addedDisplaySet = displaySetsAdded[0];
        if (addedDisplaySet.SeriesInstanceUID === displaySet.referencedSeriesInstanceUID) {
          displaySet.referencedDisplaySetInstanceUID = addedDisplaySet.displaySetInstanceUID;
          displaySet.isReconstructable = addedDisplaySet.isReconstructable;
          displaySet.FrameOfReferenceUID = addedDisplaySet.FrameOfReferenceUID;
          unsubscribe();
        }
      }
    );
  } else {
    displaySet.referencedDisplaySetInstanceUID = referencedDisplaySet.displaySetInstanceUID;
    displaySet.isReconstructable = referencedDisplaySet.isReconstructable;
    displaySet.FrameOfReferenceUID = referencedDisplaySet.FrameOfReferenceUID;
  }

  displaySet.load = async ({ headers }) =>
    await _load(displaySet, servicesManager, extensionManager, headers);

  return [displaySet];
}

function _load(
  segDisplaySet,
  servicesManager: AppTypes.ServicesManager,
  extensionManager,
  headers
) {
  const { SOPInstanceUID } = segDisplaySet;
  const { segmentationService } = servicesManager.services;

  if (
    (segDisplaySet.loading || segDisplaySet.isLoaded) &&
    loadPromises[SOPInstanceUID] &&
    _segmentationExists(segDisplaySet)
  ) {
    return loadPromises[SOPInstanceUID];
  }

  segDisplaySet.loading = true;

  // We don't want to fire multiple loads, so we'll wait for the first to finish
  // and also return the same promise to any other callers.
  loadPromises[SOPInstanceUID] = new Promise(async (resolve, reject) => {
    if (!segDisplaySet.segments || Object.keys(segDisplaySet.segments).length === 0) {
      try {
        await _loadSegments({
          extensionManager,
          servicesManager,
          segDisplaySet,
          headers,
        });
      } catch (e) {
        segDisplaySet.loading = false;
        return reject(e);
      }
    }

    segmentationService
      .createSegmentationForSEGDisplaySet(segDisplaySet)
      .then(() => {
        segDisplaySet.loading = false;
        resolve();
      })
      .catch(error => {
        segDisplaySet.loading = false;
        reject(error);
      });
  });

  // Expose the in-flight load promise so observers (e.g. the viewport service
  // waiting to attach the representation) can react to a load failure without
  // re-invoking load().
  segDisplaySet.loadingPromise = loadPromises[SOPInstanceUID];

  return loadPromises[SOPInstanceUID];
}

async function _loadSegments({
  extensionManager,
  servicesManager,
  segDisplaySet,
}: withAppTypes<{ segDisplaySet: AppTypes.DisplaySet }>) {
  const { segmentationService, uiNotificationService, customizationService } =
    servicesManager.services;
  const instance = segDisplaySet.instance as Record<string, unknown>;
  const dataSource = _getSegDataSource(extensionManager, instance);
  const segImageIdStr = _getSegImageIdFromInstance(instance, dataSource);

  if (!segImageIdStr) {
    throw new Error(
      'Could not get imageId for SEG instance (no local wadouri url and getImageIdsForInstance returned nothing).'
    );
  }

  const referencedDisplaySet = servicesManager.services.displaySetService.getDisplaySetByUID(
    segDisplaySet.referencedDisplaySetInstanceUID
  );

  if (!referencedDisplaySet) {
    throw new Error('referencedDisplaySet is missing for SEG');
  }

  // Prefer cached stack imageIds (multiframe SEG fix #4890), then data source expansion.
  let { imageIds } = referencedDisplaySet;

  if (!imageIds?.length) {
    imageIds = dataSource.getImageIdsForDisplaySet?.(referencedDisplaySet);
  }

  if (!imageIds?.length) {
    imageIds = (referencedDisplaySet as { images?: { imageId: string }[] }).images?.map(
      (img: { imageId: string }) => img.imageId
    );
  }

  if (!imageIds?.length) {
    throw new Error('referencedDisplaySet has no imageIds');
  }

  (segDisplaySet as AppTypes.DisplaySet & { referencedImageIds?: string[] }).referencedImageIds =
    imageIds;

  if (!referencedDisplaySet.imageIds?.length) {
    referencedDisplaySet.imageIds = imageIds;
  }

  const frameImageIds = _resolveFrameImageIds(
    segImageIdStr,
    segDisplaySet.instance as Record<string, unknown>,
    dataSource
  );

  const segImageIdForMetadata = isLocalSchemeImageId(segImageIdStr)
    ? stripFrameFromImageId(segImageIdStr)
    : segImageIdStr;

  _logSegImageIds({
    segDisplaySet,
    segImageIdStr: segImageIdForMetadata,
    frameImageIds,
    referencedImageIds: imageIds,
  });

  _ensureSegInstanceMetadataAvailable(segImageIdForMetadata, instance);
  frameImageIds.forEach(id => _ensureSegInstanceMetadataAvailable(id, instance));

  const tolerance = 0.001;
  const onProgress = evt => {
    const { percentComplete } = evt.detail;
    segmentationService._broadcastEvent(segmentationService.EVENTS.SEGMENT_LOADING_COMPLETE, {
      percentComplete,
    });
  };
  eventTarget.addEventListener(Enums.Events.SEGMENTATION_LOAD_PROGRESS, onProgress);

  // Optional: fetch the whole SEG instance as a single Part 10 object and
  // register its per-frame compressed pixels into the Cornerstone3D frame
  // registry, so the per-frame loads below are served locally instead of one
  // network request per frame. Disabled (0) by default; opt-in via
  // customization. Best-effort: any failure falls back to per-frame fetches.
  const loadMultiframeAsPart10RaceTimeMs =
    (dataSource?.getConfig?.()?.loadMultiframeAsPart10RaceTimeMs as
      | number
      | undefined) ??
    (customizationService?.getCustomization?.(
      'cornerstone.segmentation.loadMultiframeAsPart10RaceTimeMs'
    ) as number | undefined) ??
    0;

  let prefetch;
  if (loadMultiframeAsPart10RaceTimeMs > 0) {
    prefetch = dataSource.retrieve?.prefetchInstanceFrames?.({
      instance,
      imageId: segImageIdForMetadata,
      loadMultiframeAsPart10RaceTimeMs,
    });

    if (prefetch?.done) {
      // Give the bulk fetch a head start, then proceed regardless: frames
      // already registered are served locally; the rest fetch normally while
      // registration continues in the background.
      const raceTimer = new Promise(resolve =>
        setTimeout(resolve, loadMultiframeAsPart10RaceTimeMs)
      );
      await Promise.race([prefetch.done, raceTimer]);
    }
  }

  let results;
  try {
    results = await adaptersSEG.Cornerstone3D.Segmentation.createFromDicomSegImageId(
      imageIds,
      segImageIdForMetadata,
      {
        metadataProvider: metaData,
        tolerance,
        parserType: getSegmentationParserType(
          segDisplaySet.SOPClassUID,
          customizationService
        ),
        frameImageIds,
        concurrency: SEG_FRAME_DECODE_CONCURRENCY,
      }
    );
  } finally {
    eventTarget.removeEventListener(Enums.Events.SEGMENTATION_LOAD_PROGRESS, onProgress);
    prefetch?.cancel?.();
  }

  let usedRecommendedDisplayCIELabValue = true;
  const resultsTyped = results as {
    segMetadata: { data: { rgba?: number[]; RecommendedDisplayCIELabValue?: number[] }[] };
  };
  resultsTyped.segMetadata.data.forEach((data, i) => {
    if (i > 0) {
      data.rgba = data.RecommendedDisplayCIELabValue;

      if (data.rgba) {
        data.rgba = dicomlabToRGB(data.rgba);
      } else {
        usedRecommendedDisplayCIELabValue = false;
        data.rgba = CONSTANTS.COLOR_LUT[i % CONSTANTS.COLOR_LUT.length];
      }
    }
  });

  if (!usedRecommendedDisplayCIELabValue) {
    // Display a notification about the non-utilization of RecommendedDisplayCIELabValue
    uiNotificationService.show({
      title: 'DICOM SEG import',
      message:
        'RecommendedDisplayCIELabValue not found for one or more segments. The default color was used instead.',
      type: 'warning',
      duration: 5000,
    });
  }

  Object.assign(segDisplaySet, results);

  const labelMapImageIds = (results as { labelMapImages?: { imageId: string }[][] })
    .labelMapImages?.flat()
    .map(image => image.imageId);

  log.debug(SEG_LOAD_LOG_PREFIX, 'SEG parse complete', {
    SOPInstanceUID: segDisplaySet.SOPInstanceUID,
    labelMapImageCount: labelMapImageIds?.length ?? 0,
    labelMapImageIds,
    segmentIndices: Object.keys(segDisplaySet.segments || {}),
  });
}

function _segmentationExists(segDisplaySet) {
  return cstSegmentation.state.getSegmentation(segDisplaySet.displaySetInstanceUID);
}

function getSopClassHandlerModule(params: OhifTypes.Extensions.ExtensionParams) {
  const { servicesManager, extensionManager } = params;
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
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
