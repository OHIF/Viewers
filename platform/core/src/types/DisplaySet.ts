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

  /**
   * The FrameOfReferenceUID shared by every frame within this display set.
   * It will be undefined if the frames do not all share the same Frame of Reference.
   */
  FrameOfReferenceUID?: string;

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
   * Fetches and decodes this display set's data, for display sets whose content
   * is not available from the metadata alone - SEG, RTSTRUCT, PMAP, SR, PDF,
   * video and microscopy annotations all provide one. It is attached by the SOP
   * class handler that creates the display set, and is absent on display sets
   * whose images are simply retrieved by image id.
   *
   * A load takes no viewport: what it makes available and where that gets
   * displayed are separate concerns. Implementations memoize, returning the
   * same in-flight promise to concurrent callers, so calling it repeatedly or
   * earlier than the viewport that will show the result is safe.
   *
   * Individual handlers accept options beyond `headers`, so the option bag is
   * deliberately open.
   */
  load?: (options?: { headers?: unknown; [key: string]: unknown }) => Promise<unknown>;

  /**
   * isLoaded is used for display sets containing a load operation that
   * is required before the display set can be shown.  This is separate from
   * isHydrated, which means it is loaded into view.
   */
  isLoaded?: boolean;

  /**
   * isHydrated means: display this display set as part of a standard view.
   * Nothing more and nothing less than that.
   *
   * It is orthogonal to isLoaded.  A display set can be loaded - decoded, and
   * for SEG/RTSTRUCT present in the segmentation state - without being
   * hydrated: isLoaded is a statement about whether the data is available,
   * isHydrated is a statement about whether it should be shown in the ordinary
   * viewports of the study.
   *
   * false (or undefined) means do not display it in anything except its own
   * dedicated viewport, i.e. the SEG or RTSTRUCT viewport that exists to
   * preview a single derived display set.  That viewport displays the display
   * set because the display set is what it was created for, so it is not
   * governed by this flag.
   */
  isHydrated?: boolean;
  isRehydratable?: boolean;

  /**
   * The name of the comparison function (for sort) to use when comparing display
   * sets that are coming from same series instanceUID.
   */
  compareSameSeries?: string;
};

export type DisplaySetSeriesMetadataInvalidatedEvent = {
  displaySetInstanceUID: string;
  invalidateData: boolean;
};
