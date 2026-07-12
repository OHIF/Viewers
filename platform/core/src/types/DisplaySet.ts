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
   * isLoaded is used for display sets containing a load operation that
   * is required before the display set can be shown.  This is separate from
   * isHydrated, which means it is loaded into view.
   */
  isLoaded?: boolean;
  isHydrated?: boolean;
  isRehydratable?: boolean;

  /**
   * The name of the comparison function (for sort) to use when comparing display
   * sets that are coming from same series instanceUID.
   */
  compareSameSeries?: string;

  /**
   * The deterministic, rule-namespaced group key assigned by the
   * `@cornerstonejs/metadata` split-rules engine when this display set was
   * created via the `useMetadataDisplaySet` customization.  Used to reconcile
   * re-splits of the same series with already-created display sets.
   */
  splitKey?: string;

  /** The id of the split rule that created this display set, when applicable. */
  splitRuleId?: string;

  /**
   * Incremental-merge hook for split-rule display sets.  Intentionally named
   * differently from `addInstances` (the SOP-class-handler merge hook) so the
   * legacy handler loop never feeds unmatched instances into split-rule
   * display sets.  Returns the updated display set, or undefined when the
   * display set cannot merge the instances.
   */
  updateInstances?(instances: InstanceMetadata[], displaySetService): DisplaySet | undefined;
};

export type DisplaySetSeriesMetadataInvalidatedEvent = {
  displaySetInstanceUID: string;
  invalidateData: boolean;
};
