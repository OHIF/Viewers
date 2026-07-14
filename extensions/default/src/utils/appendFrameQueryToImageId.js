/**
 * Appends ?frame= or &frame= to a local/wadouri imageId.
 */
export function appendFrameQueryToImageId(baseImageId, frame) {
  const withoutFrame = baseImageId.split('&frame=')[0].split('?frame=')[0];
  const separator = withoutFrame.includes('?') ? '&' : '?';

  return `${withoutFrame}${separator}frame=${frame}`;
}
