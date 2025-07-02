/**
 * Retrieves the DICOM instance associated with a specific imageId
 * @param services - The OHIF services object
 * @param imageId - The image ID to find the instance for
 * @returns The DICOM instance object or undefined if not found
 */
export default function getInstanceByImageId(services: AppTypes.Services, imageId: string) {
  const activeDisplaySets = services.displaySetService.getActiveDisplaySets();
  const displaySet = activeDisplaySets.find(displaySet => displaySet?.imageIds?.includes(imageId));
  return displaySet?.instance;
}
