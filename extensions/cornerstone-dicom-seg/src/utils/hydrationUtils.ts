import { Enums, cache } from '@cornerstonejs/core';

/**
 * Updates the viewports in preparation for rendering segmentations.
 * Evaluates each viewport to determine which need modifications,
 * then for those viewports, changes them to a volume type and ensures
 * they are ready for segmentation rendering.
 *
 * @param {Object} params - Parameters for the function.
 * @param params.viewportId - ID of the viewport to be updated.
 * @param params.loadFn - Function to load the segmentation data.
 * @param params.servicesManager - The services manager.
 * @param params.displaySet -  the display set.
 * @param params.initialSliceIndex - The initial slice index.
 *
 * @returns Returns true upon successful update of viewports for segmentation rendering.
 */
async function updateViewportsForSegmentationRendering({
  viewportId,
  loadFn,
  servicesManager,
  displaySet,
  initialSliceIndex = null,
}: {
  viewportId: string;
  loadFn: () => Promise<string>;
  servicesManager: AppTypes.ServicesManager;
  displaySet?: any;
  initialSliceIndex?: number;
}) {
  const { cornerstoneViewportService, segmentationService, viewportGridService } =
    servicesManager.services;

  const viewport = getTargetViewport({ viewportId, viewportGridService });
  const targetViewportId = viewport.viewportOptions.viewportId;

  const referencedDisplaySetInstanceUID =
    displaySet?.referencedDisplaySetInstanceUID || viewport?.displaySetInstanceUIDs[0];

  const updatedViewports = getUpdatedViewportsForSegmentation({
    viewportId,
    servicesManager,
    displaySet,
  });

  // create Segmentation callback which needs to be waited until
  // the volume is created (if coming from stack)
  const createSegmentationForVolume = async () => {
    const segmentationId = await loadFn();
    segmentationService.hydrateSegmentation(segmentationId);
  };

  // the reference volume that is used to draw the segmentation. so check if the
  // volume exists in the cache (the target Viewport is already a volume viewport)
  const volumeExists = Array.from(cache._volumeCache.keys()).some(volumeId =>
    volumeId.includes(referencedDisplaySetInstanceUID)
  );

  updatedViewports.forEach(async viewport => {
    viewport.viewportOptions = {
      ...viewport.viewportOptions,
      viewportType: displaySet?.Modality === 'RTSTRUCT' ? 'stack' : 'volume',
      needsRerendering: true,
    };
    const viewportId = viewport.viewportId;

    // maintain the prehydration slice on the target viewport only
    if (viewportId === targetViewportId) {
      viewport.viewportOptions.initialImageOptions = {
        index: initialSliceIndex,
        useOnce: true,
      };
    }

    const csViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    const prevCamera = csViewport.getCamera();

    // only run the createSegmentationForVolume for the targetViewportId
    // since the rest will get handled by cornerstoneViewportService
    if ((volumeExists || displaySet.Modality === 'RTSTRUCT') && viewportId === targetViewportId) {
      await createSegmentationForVolume();
      return;
    }

    const createNewSegmentationWhenVolumeMounts = async evt => {
      const isTheActiveViewportVolumeMounted = evt.detail.volumeActors?.find(ac =>
        ac.uid.includes(referencedDisplaySetInstanceUID)
      );

      // Note: make sure to re-grab the viewport since it might have changed
      // during the time it took for the volume to be mounted, for instance
      // the stack viewport has been changed to a volume viewport
      const volumeViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      volumeViewport.setCamera(prevCamera);

      volumeViewport.element.removeEventListener(
        Enums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
        createNewSegmentationWhenVolumeMounts
      );

      if (!isTheActiveViewportVolumeMounted) {
        // it means it is one of those other updated viewports so just update the camera
        return;
      }

      if (viewportId === targetViewportId) {
        await createSegmentationForVolume();
      }
    };

    csViewport.element.addEventListener(
      Enums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
      createNewSegmentationWhenVolumeMounts
    );
  });

  // Set the displaySets for the viewports that require to be updated
  viewportGridService.setDisplaySetsForViewports(updatedViewports);

  return true;
}

const getTargetViewport = ({ viewportId, viewportGridService }) => {
  const { viewports, activeViewportId } = viewportGridService.getState();
  const targetViewportId = viewportId || activeViewportId;

  const viewport = viewports.get(targetViewportId);

  return viewport;
};

/**
 * Retrieves a list of viewports that require updates in preparation for segmentation rendering.
 * This function evaluates viewports based on their compatibility with the provided segmentation's
 * frame of reference UID and appends them to the updated list if they should render the segmentation.
 *
 * @param {Object} params - Parameters for the function.
 * @param params.viewportId - the ID of the viewport to be updated.
 * @param params.servicesManager - The services manager
 * @param params.displaySet -  the display set.
 *
 * @returns {Array} Returns an array of viewports that require updates for segmentation rendering.
 */
function getUpdatedViewportsForSegmentation({
  viewportId,
  servicesManager,
  displaySet,
}: withAppTypes) {
  const { hangingProtocolService, displaySetService, segmentationService, viewportGridService } =
    servicesManager.services;

  const { viewports, isHangingProtocolLayout } = viewportGridService.getState();

  const viewport = getTargetViewport({ viewportId, viewportGridService });
  const targetViewportId = viewport.viewportOptions.viewportId;

  const displaySetInstanceUIDs = viewports.get(targetViewportId).displaySetInstanceUIDs;

  const referenceDisplaySetInstanceUID =
    displaySet?.referencedDisplaySetInstanceUID || displaySetInstanceUIDs[0];

  const referencedDisplaySet = displaySetService.getDisplaySetByUID(referenceDisplaySetInstanceUID);
  const segmentationFrameOfReferenceUID = referencedDisplaySet.instances[0].FrameOfReferenceUID;

  const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
    targetViewportId,
    referenceDisplaySetInstanceUID,
    isHangingProtocolLayout
  );

  viewports.forEach((viewport, viewportId) => {
    if (
      targetViewportId === viewportId ||
      updatedViewports.find(v => v.viewportId === viewportId)
    ) {
      return;
    }

    const shouldDisplaySeg = segmentationService.shouldRenderSegmentation(
      viewport.displaySetInstanceUIDs,
      segmentationFrameOfReferenceUID
    );

    if (shouldDisplaySeg) {
      updatedViewports.push({
        viewportId,
        displaySetInstanceUIDs: viewport.displaySetInstanceUIDs,
        viewportOptions: {
          viewportType: displaySet?.Modality === 'RTSTRUCT' ? 'stack' : 'volume',
          needsRerendering: true,
        },
      });
    }
  });

  return updatedViewports.filter(v => v.viewportOptions?.viewportType !== 'volume3d');
}

export {
  updateViewportsForSegmentationRendering,
  getUpdatedViewportsForSegmentation,
  getTargetViewport,
};
