export default function shouldPreventScroll(
  keyPressed: boolean,
  imageIdIndex: number,
  servicesManager
): boolean {
  const { stateSyncService, viewportGridService } = servicesManager.services;
  const { cachedSlicesPerSeries } = stateSyncService.getState();
  const { activeViewportId, viewports } = viewportGridService.getState();
  const cachedSlices = cachedSlicesPerSeries[
    viewports.get(activeViewportId).displaySetInstanceUIDs[0]
  ] as number[];

  if (!cachedSlices) {
    return false;
  }

  return !keyPressed && !cachedSlices.includes(imageIdIndex);
}
