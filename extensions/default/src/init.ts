import { DicomMetadataStore, classes } from '@ohif/core';
import { calculateSUVScalingFactors } from '@cornerstonejs/calculate-suv';

import getPTImageIdInstanceMetadata from './getPTImageIdInstanceMetadata';
import { registerHangingProtocolAttributes } from './hangingprotocols';

const metadataProvider = classes.MetadataProvider;

/**
 *
 * @param {Object} servicesManager
 * @param {Object} configuration
 */
export default function init({
  servicesManager,
  configuration = {},
  commandsManager,
}: withAppTypes): void {
  const { stateSyncService, toolbarService, cineService, viewportGridService } =
    servicesManager.services;

  toolbarService.registerEventForToolbarUpdate(cineService, [
    cineService.EVENTS.CINE_STATE_CHANGED,
  ]);
  // Add
  DicomMetadataStore.subscribe(DicomMetadataStore.EVENTS.INSTANCES_ADDED, handlePETImageMetadata);

  // If the metadata for PET has changed by the user (e.g. manually changing the PatientWeight)
  // we need to recalculate the SUV Scaling Factors
  DicomMetadataStore.subscribe(DicomMetadataStore.EVENTS.SERIES_UPDATED, handlePETImageMetadata);

  // viewportGridStore is a sync state which stores the entire
  // ViewportGridService getState, by the keys `<activeStudyUID>:<protocolId>:<stageIndex>`
  // Used to recover manual changes to the layout of a stage.
  stateSyncService.register('viewportGridStore', { clearOnModeExit: true });

  // uiStateStore is a sync state which stores the relevant
  // UI state for the viewer
  stateSyncService.register('uiStateStore', { clearOnModeExit: true });

  // displaySetSelectorMap stores a map from
  // `<activeStudyUID>:<displaySetSelectorId>:<matchOffset>` to
  // a displaySetInstanceUID, used to display named display sets in
  // specific spots within a hanging protocol and be able to remember what the
  // user did with those named spots between stages and protocols.
  stateSyncService.register('displaySetSelectorMap', { clearOnModeExit: true });

  // Stores a map from `<activeStudyUID>:${protocolId}` to the getHPInfo results
  // in order to recover the correct stage when returning to a Hanging Protocol.
  stateSyncService.register('hangingProtocolStageIndexMap', {
    clearOnModeExit: true,
  });

  // Stores a map from the to be applied hanging protocols `<activeStudyUID>:<protocolId>`
  // to the previously applied hanging protocolStageIndexMap key, in order to toggle
  // off the applied protocol and remember the old state.
  stateSyncService.register('toggleHangingProtocol', { clearOnModeExit: true });

  // Stores the viewports by `rows-cols` position so that when the layout
  // changes numRows and numCols, the viewports can be remembers and then replaced
  // afterwards.
  stateSyncService.register('viewportsByPosition', { clearOnModeExit: true });

  // Adds extra custom attributes for use by hanging protocols
  registerHangingProtocolAttributes({ servicesManager });

  // Function to process and subscribe to events for a given set of commands and listeners
  const subscribeToEvents = listeners => {
    Object.entries(listeners).forEach(([event, commands]) => {
      const supportedEvents = [
        viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
        viewportGridService.EVENTS.VIEWPORTS_READY,
      ];

      if (supportedEvents.includes(event)) {
        viewportGridService.subscribe(event, eventData => {
          const viewportId = eventData?.viewportId ?? viewportGridService.getActiveViewportId();

          commandsManager.run(commands, { viewportId });
        });
      }
    });
  };

  toolbarService.subscribe(toolbarService.EVENTS.TOOL_BAR_MODIFIED, state => {
    const { buttons } = state;
    for (const [id, button] of Object.entries(buttons)) {
      const { groupId, items, listeners } = button.props || {};

      // Handle group items' listeners
      if (groupId && items) {
        items.forEach(item => {
          if (item.listeners) {
            subscribeToEvents(item.listeners);
          }
        });
      }

      // Handle button listeners
      if (listeners) {
        subscribeToEvents(listeners);
      }
    }
  });
}

const handlePETImageMetadata = ({ SeriesInstanceUID, StudyInstanceUID }) => {
  const { instances } = DicomMetadataStore.getSeries(StudyInstanceUID, SeriesInstanceUID);

  if (!instances?.length) {
    return;
  }

  const modality = instances[0].Modality;

  if (!modality || modality !== 'PT') {
    return;
  }

  const imageIds = instances.map(instance => instance.imageId);
  const instanceMetadataArray = [];

  // try except block to prevent errors when the metadata is not correct
  try {
    imageIds.forEach(imageId => {
      const instanceMetadata = getPTImageIdInstanceMetadata(imageId);
      if (instanceMetadata) {
        instanceMetadataArray.push(instanceMetadata);
      }
    });

    if (!instanceMetadataArray.length) {
      return;
    }

    const suvScalingFactors = calculateSUVScalingFactors(instanceMetadataArray);
    instanceMetadataArray.forEach((instanceMetadata, index) => {
      metadataProvider.addCustomMetadata(
        imageIds[index],
        'scalingModule',
        suvScalingFactors[index]
      );
    });
  } catch (error) {
    console.log(error);
  }
};
