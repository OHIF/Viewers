/**
 * Text of the viewport series indicator: "n/N · #SeriesNumber SeriesDescription".
 */

export type SeriesIndicatorDisplaySet = {
  displaySetInstanceUID: string;
  StudyInstanceUID?: string;
  SeriesNumber?: number | string;
  SeriesDescription?: string;
  Modality?: string;
  imageIds?: unknown[];
  numImageFrames?: number;
  images?: unknown[];
  instances?: unknown[];
  unsupported?: boolean;
  excludeFromThumbnailBrowser?: boolean;
};

/** Modalities that are not image series (reports, segmentations, documents, ...). */
export const NON_IMAGE_MODALITIES = [
  'SR',
  'SEG',
  'RTSTRUCT',
  'RTPLAN',
  'RTDOSE',
  'PR',
  'KO',
  'DOC',
  'PMAP',
];

/**
 * Number of images of a display set. `imageIds` is filled only when a viewport
 * loads the display set, so the frame and instance counts set when the display
 * set is created are used as well; otherwise N would grow as the user
 * navigates through the series.
 */
function imageCount(displaySet: SeriesIndicatorDisplaySet): number {
  const lengthOf = (list: unknown) => (Array.isArray(list) ? list.length : 0);
  return Math.max(
    lengthOf(displaySet.imageIds),
    Number(displaySet.numImageFrames) || 0,
    lengthOf(displaySet.images),
    lengthOf(displaySet.instances)
  );
}

/** An image series: an image modality with images to show. */
export function isImageSeries(displaySet?: SeriesIndicatorDisplaySet): boolean {
  return (
    !!displaySet &&
    !displaySet.unsupported &&
    !NON_IMAGE_MODALITIES.includes(displaySet.Modality ?? '') &&
    imageCount(displaySet) > 0
  );
}

function seriesDetails(displaySet: SeriesIndicatorDisplaySet): string {
  const number =
    displaySet.SeriesNumber !== undefined && displaySet.SeriesNumber !== ''
      ? `#${displaySet.SeriesNumber}`
      : '';
  return [number, displaySet.SeriesDescription || ''].filter(Boolean).join(' ');
}

/**
 * @param displaySetInstanceUIDs the display sets of the viewport (the first is shown)
 * @param displaySets the active display sets, in the order the thumbnails are listed
 * @returns "n/N · #number description" for an image series, where n/N is its
 *   position among the image series of its own study in that order;
 *   "#number description" for other display sets (SR, SEG, ...); '' when the
 *   viewport shows no known display set.
 */
export function seriesIndicatorText(
  displaySetInstanceUIDs: string[] = [],
  displaySets: SeriesIndicatorDisplaySet[] = []
): string {
  const uid = displaySetInstanceUIDs[0];
  const current = uid
    ? displaySets.find(displaySet => displaySet.displaySetInstanceUID === uid)
    : undefined;
  if (!current) {
    return '';
  }
  const details = seriesDetails(current);
  if (!isImageSeries(current)) {
    return details;
  }
  const studySeries = displaySets.filter(
    displaySet =>
      displaySet.StudyInstanceUID === current.StudyInstanceUID &&
      !displaySet.excludeFromThumbnailBrowser &&
      isImageSeries(displaySet)
  );
  const index = studySeries.indexOf(current);
  if (index < 0) {
    return details;
  }
  const position = `${index + 1}/${studySeries.length}`;
  return details ? `${position} · ${details}` : position;
}
