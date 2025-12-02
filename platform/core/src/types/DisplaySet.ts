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
   * The sort vector is used to order display sets having the same
   * series instance UID (ie split out from a single series).  Otherwise
   * the positioning ends up being somewhat random based on when the items got added.
   *
   * By convention, sortVector[0] is used to both identify the overall
   * sorting order for that "type" of sort vector, as well as to identify
   * the types of the remaining items since it doesn't make sense to compare
   * items of different types such as dates and strings.  However, if all your
   * `getSopClassHandlers` use a different convention, then as long as that is all
   * you get for that series instance uid, the sort vector is just compared each
   * element at a time until all elements have been compared.
   *
   * For example, the "time sorted" entries might be in considered to be
   * position `37` and have the next value in seconds.  Other sort vectors
   * could be created using the `37` starting value, as long as they also put
   * seconds in the next value.
   *
   * Those could have values:
   * `[37, 0]` and `[37,1.5]` so that the second 1.5 value would sort last
   * in a default ascending sort.  The might be after the "T1/T2" value sort which
   * could be defined as overall sort '36' and might have T1/T2 in the second position.
   */
  sortVector?: (number | string)[];
};

export type DisplaySetSeriesMetadataInvalidatedEvent = {
  displaySetInstanceUID: string;
  invalidateData: boolean;
};
