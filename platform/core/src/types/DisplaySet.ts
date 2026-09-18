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

  /**
   * The date and the time **of the display set**, which is what the series list
   * is ordered by - `dateTimeSortKey` in `sortStudy`. The two names are
   * historical: the value is not always the `SeriesDate`/`SeriesTime` of the
   * series that the instances belong to, and it must not be copied back to the
   * series metadata or to an instance.
   *
   * The SOP class handler that creates the display set writes both, and the two
   * kinds of handler take the value from different places:
   *
   * - An image display set takes the instance's `SeriesDate`/`SeriesTime`
   *   directly. Every instance of a series carries those two identically, so
   *   every display set of one image series holds the same value, ties on the
   *   sort key, and the display sets stay together in the series list - ordered
   *   among themselves by `compareSameSeriesDisplaySet`. Such a handler must not
   *   call `getLatestInstanceDateTime`, which also reads
   *   `AcquisitionDate`/`AcquisitionTime` and so differs per instance.
   * - A derived display set - SEG, RTSTRUCT, SR, PMAP, PDF, video, chart -
   *   takes the creation date/time of the instance it shows, from
   *   `getLatestInstanceDateTime`. A report saved
   *   today into a series created last week gets today's date, and the series
   *   list places that display set as today's work. The series' own
   *   `SeriesDate`/`SeriesTime`, in the instance metadata and in the archive,
   *   stay as they are.
   *
   * A display set that changes the instance it shows has to write both again,
   * or the series list keeps the position of the instance it no longer shows.
   * `addInstances` of the SR handler and of the chart handler does that. The
   * SEG, the RTSTRUCT and the PMAP handler have no `addInstances`, so
   * `DisplaySetService` gives each new instance its own display set, and that
   * display set writes its own date/time.
   *
   * Two display sets of one series that hold different values order by those
   * values, and a display set of another series can come between them. A split
   * that needs its display sets kept together gives all of them one value - the
   * value of the series - and registers a comparison with `addSameSeriesCompare`
   * to order them among themselves.
   */
  SeriesDate?: string;
  /** The time of the display set. See {@link DisplaySet.SeriesDate}. */
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
