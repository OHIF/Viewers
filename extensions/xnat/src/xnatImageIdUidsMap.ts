/**
 * Shared map from base image URI (no scheme, no &frame=) to UIDs for XNAT multi-frame instances.
 * Used by the Cornerstone metadata provider so getClosestImageId can resolve imagePlaneModule
 * for frame-level imageIds (e.g. dicomweb:...?frame=N) when the default OHIF provider lookup fails.
 */
export interface XNATImageIdUids {
  StudyInstanceUID: string;
  SeriesInstanceUID: string;
  SOPInstanceUID: string;
}

const map = new Map<string, XNATImageIdUids>();

export function setXNATImageIdUids(baseUri: string, uids: XNATImageIdUids): void {
  map.set(baseUri, uids);
}

export function getXNATImageIdUids(baseUri: string): XNATImageIdUids | undefined {
  return map.get(baseUri);
}

export function clearXNATImageIdUids(): void {
  map.clear();
}
