import { cache, utilities as csUtils } from '@cornerstonejs/core';
import { promptTimePointScope, type TimePointScope } from './promptTimePointScope';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import i18n from '@ohif/i18n';
import { ServicesManager } from '@ohif/core';

function _createDefaultSegments(createInitialSegment?: boolean) {
  return createInitialSegment
    ? {
        1: {
          label: `${i18n.t('Tools:Segment')} 1`,
          active: true,
        },
      }
    : {};
}

type CreateSegmentationForViewportOptions = {
  displaySetInstanceUID?: string;
  label?: string;
  segmentationId?: string;
  createInitialSegment?: boolean;
  /** For a 4D labelmap; when not set, a dialog asks the user. */
  timePointScope?: TimePointScope;
};

type CreateSegmentationForViewportParams = {
  viewportId: string;
  options?: CreateSegmentationForViewportOptions;
  segmentationType: SegmentationRepresentations;
};

/**
 * Creates a segmentation for the active viewport
 *
 * The created segmentation will be registered as a display set and also added
 * as a segmentation representation to the viewport.
 */
export async function createSegmentationForViewport(
  servicesManager: ServicesManager,
  { viewportId, options = {}, segmentationType }: CreateSegmentationForViewportParams
): Promise<string | undefined> {
  const {
    viewportGridService,
    displaySetService,
    segmentationService,
    uiDialogService,
    cornerstoneViewportService,
  } = servicesManager.services;
  const { viewports } = viewportGridService.getState();
  const targetViewportId = viewportId;

  const viewport = viewports.get(targetViewportId);

  // Todo: add support for multiple display sets
  // Guard against the grid not having this viewport yet (a transient race when
  // "Add segmentation" runs before the viewport is registered in the grid). Bail
  // gracefully instead of throwing, which would surface an uncaught error overlay.
  const displaySetInstanceUID =
    options.displaySetInstanceUID || viewport?.displaySetInstanceUIDs?.[0];

  if (!displaySetInstanceUID) {
    return undefined;
  }

  const segs = segmentationService.getSegmentations();

  const label = options.label || `${i18n.t('Tools:Segmentation')} ${segs.length + 1}`;
  const segmentationId = options.segmentationId || `${csUtils.uuidv4()}`;

  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

  // A 4D labelmap that applies to all time points is one 3D labelmap of the
  // time point on display.
  let timePointIndex: number | undefined;
  let timePointScope: TimePointScope | undefined;
  if (displaySet.isDynamicVolume && segmentationType === SegmentationRepresentations.Labelmap) {
    timePointScope = options.timePointScope;
    if (!timePointScope) {
      timePointScope = await promptTimePointScope(uiDialogService);
    }
    if (!timePointScope) {
      return undefined;
    }
    if (timePointScope === 'all') {
      const csViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      const volumeId = csViewport?.getVolumeId?.();
      const groupNumber = volumeId && cache.getVolume(volumeId)?.dimensionGroupNumber;
      timePointIndex = (groupNumber || 1) - 1;
    }
  }

  const segmentationCreationOptions = {
    label,
    segmentationId,
    labelIsGenerated: !options.label,
    segments: _createDefaultSegments(options.createInitialSegment),
    timePointScope,
    timePointIndex,
  };

  // This will create the segmentation and register it as a display set
  const generatedSegmentationId = await (segmentationType === SegmentationRepresentations.Labelmap
    ? segmentationService.createLabelmapForDisplaySet(displaySet, segmentationCreationOptions)
    : segmentationService.createContourForDisplaySet(displaySet, segmentationCreationOptions));

  // Also add the segmentation representation to the viewport
  await segmentationService.addSegmentationRepresentation(viewportId, {
    segmentationId,
    type: segmentationType,
  });

  return generatedSegmentationId;
}
