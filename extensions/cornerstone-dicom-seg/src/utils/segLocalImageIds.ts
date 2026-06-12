export function isLocalSchemeImageId(imageId: string): boolean {
  return /^(wadouri:|dicomfile:|dicomweb:)/.test(imageId);
}

export function stripFrameFromImageId(imageId: string): string {
  return imageId.split('&frame=')[0].split('?frame=')[0];
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
