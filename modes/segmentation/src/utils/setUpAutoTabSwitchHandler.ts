/**
 * Sets up auto tab switching for when the first segmentation is added into the viewer.
 */
export default function setUpAutoTabSwitchHandler({
  segmentationService,
  viewportGridService,
  panelService,
}) {
  const autoTabSwitchEvents = [
    segmentationService.EVENTS.SEGMENTATION_MODIFIED,
    segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
  ];

  // Initially there are no segmentations, so we should switch the tab whenever the first segmentation is added.
  let shouldSwitchTab = true;

  const unsubscribeAutoTabSwitchEvents = autoTabSwitchEvents
    .map(eventName =>
      segmentationService.subscribe(eventName, () => {
        const segmentations = segmentationService.getSegmentations();

        if (!segmentations.length) {
          // If all the segmentations are removed, then the next time a segmentation is added, we should switch the tab.
          shouldSwitchTab = true;
          return;
        }

        const activeViewportId = viewportGridService.getActiveViewportId();
        const activeRepresentation = segmentationService
          .getSegmentationRepresentations(activeViewportId)
          ?.find(representation => representation.active);

        if (activeRepresentation && shouldSwitchTab) {
          shouldSwitchTab = false;

          switch (activeRepresentation.type) {
            case 'Labelmap':
              panelService.activatePanel(
                '@ohif/extension-cornerstone.panelModule.panelSegmentationWithToolsLabelMap',
                true
              );
              break;
            case 'Contour':
              panelService.activatePanel(
                '@ohif/extension-cornerstone.panelModule.panelSegmentationWithToolsContour',
                true
              );
              break;
          }
        }
      })
    )
    .map(subscription => subscription.unsubscribe);

  return { unsubscribeAutoTabSwitchEvents };
}
