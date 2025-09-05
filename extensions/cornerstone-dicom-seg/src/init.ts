export default function init({ servicesManager }: withAppTypes): void {
  const { segmentationService, toolbarService } = servicesManager.services;

  toolbarService.registerEventForToolbarUpdate(segmentationService, [
    segmentationService.EVENTS.SEGMENTATION_MODIFIED,
    segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
  ]);
}
