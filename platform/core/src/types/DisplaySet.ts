import { InstanceMetadata } from './StudyMetadata';

export type ReferencedInstance = {
  ReferencedSOPClassUID: string;
  ReferencedSOPInstanceUID: string;
};

export type ReferencedSeriesSequence = {
  SeriesInstanceUID: string;
  ReferencedInstanceSequence: ReferencedInstance[];
};

export type DisplaySet = {
  displaySetInstanceUID: string;
  instances: InstanceMetadata[];
  isReconstructable?: boolean;
  StudyInstanceUID: string;
  SeriesInstanceUID?: string;
  SeriesNumber?: number;
  SeriesDescription?: string;
  numImages?: number;
  unsupported?: boolean;
  Modality?: string;
  imageIds?: string[];
  images?: unknown[];
  label?: string;
  /** Flag indicating if this is an overlay display set (e.g., SEG, RTSTRUCT) */
  isOverlayDisplaySet?: boolean;
  /** Flag indicating this is a derived dataset */
  isDerived?: boolean;
  /** flag indicating if it supports window level */
  supportsWindowLevel?: boolean;

  // Details about how to display:
  /**
   *  A URL that can be used to display the thumbnail.  Typically a data url
   * This can be set to null to avoid trying to display a thumbnail, eg for
   * display sets without a thumbnail.
   */
  thumbnailSrc?: string;
  /** A fetch method to get the thumbnail */
  getThumbnailSrc?(imageId?: string): Promise<string>;

  /** An opaque type of this viewport, used internally to specify which viewport to use */
  viewportType;

  /**
   * A fetch URL to display the content.  This is used for content such as
   * pdf display.
   */
  renderedUrl?: string;

  /**
   * The instance UID of the display set that this display set references.
   * This is used to determine if the display set is a referenced display set.
   * It usually is for SEG, RTSTRUCT, etc.
   */
  referencedDisplaySetInstanceUID?: string;

  SeriesDate?: string;
  SeriesTime?: string;
  instance?: InstanceMetadata;

  /**
   * The predecessor image id refers to the SOP instance that is currently loaded
   * into this display set for SEG/SR/RTSTRUCT type values.  The name is chosen
   * for consistency when this value is used as the origin instance
   * for saving a new instance intended to replace this instance where the
   * new instance has a "predecessor sequence".
   */
  predecessorImageId?: string;

  /**
   * isLoaded is used for display sets containing a load operation that
   * is required before the display set can be shown.  This is separate from
   * isHydrated, which means it is loaded into view.
   */
  isLoaded?: boolean;
  isHydrated?: boolean;
  isRehydratable?: boolean;

  /**
   * The sort vector is used to order display sets on the same series instance
   * uid having the same other sort criteria.  The values are compared
   * one at a time starting with the sortVector[0] element.  This allows
   * defining the overall sort order between different types of sort values,
   * and then allows sorting on the remaining values.
   *
   * For example, the "time sorted" entries might be in position "37", and the
   * second value would be defined as time.  Those could have values:
   * `[37, 0]` and `[37,1.5]` so that the second 1.5 value would sort last
   * in a default ascending sort.  The might be after the "T1/T2" value sort which
   * could be defined as overall sort '36'.
   */
  sortVector?: (number | string)[];
};

export type DisplaySetSeriesMetadataInvalidatedEvent = {
  displaySetInstanceUID: string;
  invalidateData: boolean;
};
