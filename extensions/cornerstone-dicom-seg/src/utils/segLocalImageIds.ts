export function isLocalSchemeImageId(imageId: string): boolean {
  return /^(wadouri:|dicomfile:|dicomweb:)/.test(imageId);
}

export function stripFrameFromImageId(imageId: string): string {
  const queryIndex = imageId.indexOf('?');
  if (queryIndex === -1) {
    return imageId;
  }

  const basePath = imageId.slice(0, queryIndex);
  const rebuiltQuery = imageId
    .slice(queryIndex + 1)
    .split('&')
    .filter(param => param.split('=')[0] !== 'frame')
    .join('&');

  return rebuiltQuery ? `${basePath}?${rebuiltQuery}` : basePath;
}

export function appendFrameToImageId(baseImageId: string, frame: number): string {
  const withoutFrame = stripFrameFromImageId(baseImageId);
  const separator = withoutFrame.includes('?') ? '&' : '?';

  return `${withoutFrame}${separator}frame=${frame}`;
}

export function getFrameIndexFromImageId(imageId: string): number {
  const frameMatch = imageId.match(/(?:&|\?)frame=(\d+)/);

  return frameMatch ? Number(frameMatch[1]) : 1;
}
