import {
  cache,
  Enums as csEnums,
  eventTarget,
  geometryLoader,
  getEnabledElementByViewportId,
  imageLoader,
  Types as csTypes,
  utilities as csUtils,
  metaData,
} from '@cornerstonejs/core';
import {
  Enums as csToolsEnums,
  segmentation as cstSegmentation,
  Types as cstTypes,
} from '@cornerstonejs/tools';
import { PubSubService, Types as OHIFTypes } from '@ohif/core';
import i18n from '@ohif/i18n';
import { EasingFunctionEnum, EasingFunctionMap } from '../../utils/transitions';
import { mapROIContoursToRTStructData } from './RTSTRUCT/mapROIContoursToRTStructData';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import { addColorLUT } from '@cornerstonejs/tools/segmentation/addColorLUT';
import { getNextColorLUTIndex } from '@cornerstonejs/tools/segmentation/getNextColorLUTIndex';
import { Segment } from '@cornerstonejs/tools/types/SegmentationStateTypes';
import { ContourStyle, LabelmapStyle, SurfaceStyle } from '@cornerstonejs/tools/types';
import { ViewportType } from '@cornerstonejs/core/enums';
import { SegmentationPresentation, SegmentationPresentationItem } from '../../types/Presentation';
import { updateLabelmapSegmentationImageReferences } from '@cornerstonejs/tools/segmentation/updateLabelmapSegmentationImageReferences';
import { triggerSegmentationRepresentationModified } from '@cornerstonejs/tools/segmentation/triggerSegmentationEvents';
import { convertStackToVolumeLabelmap } from '@cornerstonejs/tools/segmentation/helpers/convertStackToVolumeLabelmap';
import { getLabelmapImageIds } from '@cornerstonejs/tools/segmentation';
import { VOLUME_LOADER_SCHEME } from '../../constants';

const LABELMAP = csToolsEnums.SegmentationRepresentations.Labelmap;
const CONTOUR = csToolsEnums.SegmentationRepresentations.Contour;

export type SegmentRepresentation = {
  segmentIndex: number;
  color: csTypes.Color;
  opacity: number;
  visible: boolean;
};

export type SegmentationData = cstTypes.Segmentation;

export type SegmentationRepresentation = cstTypes.SegmentationRepresentation & {
  viewportId: string;
  id: string;
  label: string;
  styles: cstTypes.RepresentationStyle;
  segments: {
    [key: number]: SegmentRepresentation;
  };
};

export type SegmentationInfo = {
  segmentation: SegmentationData;
  representation?: SegmentationRepresentation;
};

const EVENTS = {
  SEGMENTATION_MODIFIED: 'event::segmentation_modified',
  // fired when the segmentation is added
  SEGMENTATION_ADDED: 'event::segmentation_added',
  //
  SEGMENTATION_DATA_MODIFIED: 'event::segmentation_data_modified',
  // fired when the segmentation is removed
  SEGMENTATION_REMOVED: 'event::segmentation_removed',
  //
  // fired when segmentation representation is added
  SEGMENTATION_REPRESENTATION_MODIFIED: 'event::segmentation_representation_modified',
  // fired when segmentation representation is removed
  SEGMENTATION_REPRESENTATION_REMOVED: 'event::segmentation_representation_removed',
  //
  // LOADING EVENTS
  // fired when the active segment is loaded in SEG or RTSTRUCT
  SEGMENT_LOADING_COMPLETE: 'event::segment_loading_complete',
  // loading completed for all segments
  SEGMENTATION_LOADING_COMPLETE: 'event::segmentation_loading_complete',
};

const VALUE_TYPES = {};

class SegmentationService extends PubSubService {
  static REGISTRATION = {
    name: 'segmentationService',
    altName: 'SegmentationService',
    create: ({ servicesManager }: OHIFTypes.Extensions.ExtensionParams): SegmentationService => {
      return new SegmentationService({ servicesManager });
    },
  };

  private _segmentationIdToColorLUTIndexMap: Map<string, number>;
  private _segmentationGroupStatsMap: Map<string, any>;
  readonly servicesManager: AppTypes.ServicesManager;
  highlightIntervalId = null;
  readonly EVENTS = EVENTS;

  constructor({ servicesManager }) {
    super(EVENTS);

    this._segmentationIdToColorLUTIndexMap = new Map();

    this.servicesManager = servicesManager;

    this._segmentationGroupStatsMap = new Map();
  }

  public onModeEnter(): void {
    this._initSegmentationService();
  }

  public onModeExit(): void {
    this.destroy();
  }

  /**
   * Retrieves a segmentation by its ID.
   *
   * @param segmentationId - The unique identifier of the segmentation to retrieve.
   * @returns The segmentation object if found, or undefined if not found.
   *
   * @remarks
   * This method directly accesses the cornerstone tools segmentation state to fetch
   * the segmentation data. It's useful when you need to access specific properties
   * or perform operations on a particular segmentation.
   */
  public getSegmentation(segmentationId: string): cstTypes.Segmentation | undefined {
    return cstSegmentation.state.getSegmentation(segmentationId);
  }

  /**
   * Retrieves all segmentations from the cornerstone tools segmentation state.
   *
   * @returns An array of all segmentations currently stored in the state
   *
   * @remarks
   * This is a convenience method that directly accesses the cornerstone tools
   * segmentation state to get all available segmentations. It returns the raw
   * segmentation objects without any additional processing or filtering.
   */
  public getSegmentations(): cstTypes.Segmentation[] | [] {
    return cstSegmentation.state.getSegmentations();
  }

  public getPresentation(viewportId: string): SegmentationPresentation {
    const segmentationPresentations: SegmentationPresentation = [];
    const segmentationsMap = new Map<string, SegmentationPresentationItem>();

    const representations = this.getSegmentationRepresentations(viewportId);
    for (const representation of representations) {
      const { segmentationId } = representation;

      if (!representation) {
        continue;
      }

      const { type } = representation;

      segmentationsMap.set(segmentationId, {
        segmentationId,
        type,
        hydrated: true,
        config: representation.config || {},
      });
    }

    // Check inside the removedDisplaySetAndRepresentationMaps to see if any of the representations are not hydrated
    // const hydrationMap = this._segmentationRepresentationHydrationMaps.get(presentationId);

    // if (hydrationMap) {
    //   hydrationMap.forEach(rep => {
    //     segmentationsMap.set(rep.segmentationId, {
    //       segmentationId: rep.segmentationId,
    //       type: rep.type,
    //       hydrated: rep.hydrated,
    //       config: rep.config || {},
    //     });
    //   });
    // }

    // // Convert the Map to an array
    segmentationPresentations.push(...segmentationsMap.values());

    return segmentationPresentations;
  }

  public getRepresentationsForSegmentation(
    segmentationId: string
  ): { viewportId: string; representations: any[] }[] {
    const representations =
      cstSegmentation.state.getSegmentationRepresentationsBySegmentationId(segmentationId);

    return representations;
  }

  /**
   * Retrieves segmentation representations (labelmap, contour, surface) based on specified criteria.
   *
   * @param viewportId - The ID of the viewport.
   * @param specifier - An object containing optional `segmentationId` and `type` to filter the representations.
   * @returns An array of `SegmentationRepresentation` matching the criteria, or an empty array if none are found.
   *
   * @remarks
   * This method filters the segmentation representations according to the provided `specifier`:
   * - **No `segmentationId` or `type` provided**: Returns all representations associated with the given `viewportId`.
   * - **Only `segmentationId` provided**: Returns all representations with that `segmentationId`, regardless of `viewportId`.
   * - **Only `type` provided**: Returns all representations of that `type` associated with the given `viewportId`.
   * - **Both `segmentationId` and `type` provided**: Returns representations matching both criteria, regardless of `viewportId`.
   */
  public getSegmentationRepresentations(
    viewportId: string,
    specifier: {
      segmentationId?: string;
      type?: SegmentationRepresentations;
    } = {}
  ): SegmentationRepresentation[] {
    // Get all representations for the viewportId
    const representations = cstSegmentation.state.getSegmentationRepresentations(
      viewportId,
      specifier
    );

    // Map to our SegmentationRepresentation type
    const ohifRepresentations = representations.map(repr =>
      this._toOHIFSegmentationRepresentation(viewportId, repr)
    );

    return ohifRepresentations;
  }

  public destroy = () => {
    eventTarget.removeEventListener(
      csToolsEnums.Events.SEGMENTATION_MODIFIED,
      this._onSegmentationModifiedFromSource
    );

    eventTarget.removeEventListener(
      csToolsEnums.Events.SEGMENTATION_REMOVED,
      this._onSegmentationModifiedFromSource
    );

    eventTarget.removeEventListener(
      csToolsEnums.Events.SEGMENTATION_DATA_MODIFIED,
      this._onSegmentationDataModifiedFromSource
    );

    eventTarget.removeEventListener(
      csToolsEnums.Events.SEGMENTATION_REPRESENTATION_ADDED,
      this._onSegmentationModifiedFromSource
    );

    eventTarget.removeEventListener(
      csToolsEnums.Events.SEGMENTATION_ADDED,
      this._onSegmentationAddedFromSource
    );

    this.reset();
  };

  public async addSegmentationRepresentation(
    viewportId: string,
    {
      segmentationId,
      type,
      config,
      suppressEvents = false,
    }: {
      segmentationId: string;
      type?: csToolsEnums.SegmentationRepresentations;
      config?: {
        blendMode?: csEnums.BlendModes;
      };
      suppressEvents?: boolean;
    }
  ): Promise<void> {
    const segmentation = this.getSegmentation(segmentationId);
    const csViewport = this.getAndValidateViewport(viewportId);

    if (!csViewport) {
      return;
    }

    const colorLUTIndex = this._segmentationIdToColorLUTIndexMap.get(segmentationId);

    const defaultRepresentationType = csToolsEnums.SegmentationRepresentations.Labelmap;
    let representationTypeToUse = type || defaultRepresentationType;
    let isConverted = false;

    if (type === csToolsEnums.SegmentationRepresentations.Labelmap) {
      const { isVolumeViewport, isVolumeSegmentation } = this.determineViewportAndSegmentationType(
        csViewport,
        segmentation
      ) || { isVolumeViewport: false, isVolumeSegmentation: false };

      ({ representationTypeToUse, isConverted } = await this.handleViewportConversion(
        isVolumeViewport,
        isVolumeSegmentation,
        csViewport,
        segmentation,
        viewportId,
        segmentationId,
        representationTypeToUse
      ));
    }

    await this._addSegmentationRepresentation(
      viewportId,
      segmentationId,
      representationTypeToUse,
      colorLUTIndex,
      isConverted,
      config
    );

    if (!suppressEvents) {
      this._broadcastEvent(this.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED, { segmentationId });
    }
  }

  /**
   * Creates an labelmap segmentation for a given display set
   *
   * @param displaySet - The display set to create the segmentation for.
   * @param options - Optional parameters for creating the segmentation.
   * @param options.segmentationId - Custom segmentation ID. If not provided, a UUID will be generated.
   * @param options.FrameOfReferenceUID - Frame of reference UID for the segmentation.
   * @param options.label - Label for the segmentation.
   * @returns A promise that resolves to the created segmentation ID.
   */
  public async createLabelmapForDisplaySet(
    displaySet: AppTypes.DisplaySet,
    options?: {
      segmentationId?: string;
      segments?: { [segmentIndex: number]: Partial<cstTypes.Segment> };
      FrameOfReferenceUID?: string;
      label?: string;
    }
  ): Promise<string> {
    // Todo: random does not makes sense, make this better, like
    // labelmap 1, 2, 3 etc
    const segmentationId = options?.segmentationId ?? `${csUtils.uuidv4()}`;

    const isDynamicVolume = displaySet.isDynamicVolume;

    let referenceImageIds = displaySet.imageIds;
    if (isDynamicVolume) {
      // get the middle timepoint for referenceImageIds
      const timePoints = displaySet.dynamicVolumeInfo.timePoints;
      const middleTimePoint = timePoints[Math.floor(timePoints.length / 2)];
      referenceImageIds = middleTimePoint;
    }

    const derivedImages = await imageLoader.createAndCacheDerivedLabelmapImages(referenceImageIds);

    const segs = this.getSegmentations();
    const label = options.label || `Segmentation ${segs.length + 1}`;

    const segImageIds = derivedImages.map(image => image.imageId);

    const segmentationPublicInput: cstTypes.SegmentationPublicInput = {
      segmentationId,
      representation: {
        type: LABELMAP,
        data: {
          imageIds: segImageIds,
          // referencedVolumeId: this._getVolumeIdForDisplaySet(displaySet),
          referencedImageIds: referenceImageIds,
        },
      },
      config: {
        label,
        segments:
          options.segments && Object.keys(options.segments).length > 0
            ? options.segments
            : {
                1: {
                  label: `${i18n.t('Segment')} 1`,
                  active: true,
                },
              },
        cachedStats: {
          info: `S${displaySet.SeriesNumber}: ${displaySet.SeriesDescription}`,
        },
      },
    };

    this.addOrUpdateSegmentation(segmentationPublicInput);
    return segmentationId;
  }

  public async createSegmentationForSEGDisplaySet(
    segDisplaySet,
    options: {
      segmentationId?: string;
      type: SegmentationRepresentations;
    } = {
      type: LABELMAP,
    }
  ): Promise<string> {
    const { type } = options;
    let { segmentationId } = options;
    const { labelMapImages } = segDisplaySet;

    if (type !== LABELMAP) {
      throw new Error('Only labelmap type is supported for SEG display sets right now');
    }

    if (!labelMapImages || !labelMapImages.length) {
      throw new Error('SEG reading failed');
    }

    segmentationId = segmentationId ?? segDisplaySet.displaySetInstanceUID;
    const referencedDisplaySetInstanceUID = segDisplaySet.referencedDisplaySetInstanceUID;
    const referencedDisplaySet = this.servicesManager.services.displaySetService.getDisplaySetByUID(
      referencedDisplaySetInstanceUID
    );

    const images = referencedDisplaySet.instances;

    if (!images.length) {
      throw new Error('No instances were provided for the referenced display set of the SEG');
    }

    const imageIds = images.map(image => image.imageId);
    const derivedImages = labelMapImages?.flat();
    const derivedImageIds = derivedImages.map(image => image.imageId);

    segDisplaySet.images = derivedImages.map(image => ({
      ...image,
      ...metaData.get('instance', image.referencedImageId),
    }));

    segDisplaySet.imageIds = derivedImageIds;

    // We should parse the segmentation as separate slices to support overlapping segments.
    // This parsing should occur in the CornerstoneJS library adapters.
    // For now, we use the volume returned from the library and chop it here.
    let firstSegmentedSliceImageId = null;
    for (let i = 0; i < derivedImages.length; i++) {
      const voxelManager = derivedImages[i].voxelManager as csTypes.IVoxelManager<number>;
      const scalarData = voxelManager.getScalarData();
      voxelManager.setScalarData(scalarData);

      // Check if this slice has any non-zero voxels and we haven't found one yet
      if (!firstSegmentedSliceImageId && scalarData.some(value => value !== 0)) {
        firstSegmentedSliceImageId = derivedImages[i].referencedImageId;
      }
    }

    // assign the first non zero voxel image id to the segDisplaySet
    segDisplaySet.firstSegmentedSliceImageId = firstSegmentedSliceImageId;

    const segmentsInfo = segDisplaySet.segMetadata.data;

    const segments: { [segmentIndex: string]: cstTypes.Segment } = {};
    const colorLUT = [];

    segmentsInfo.forEach((segmentInfo, index) => {
      if (index === 0) {
        colorLUT.push([0, 0, 0, 0]);
        return;
      }

      const {
        SegmentedPropertyCategoryCodeSequence,
        SegmentNumber,
        SegmentLabel,
        SegmentAlgorithmType,
        SegmentAlgorithmName,
        SegmentedPropertyTypeCodeSequence,
        rgba,
      } = segmentInfo;

      colorLUT.push(rgba);

      const segmentIndex = Number(SegmentNumber);

      const centroid = segDisplaySet.centroids?.get(index);
      const imageCentroidXYZ = centroid?.image || { x: 0, y: 0, z: 0 };
      const worldCentroidXYZ = centroid?.world || { x: 0, y: 0, z: 0 };

      segments[segmentIndex] = {
        segmentIndex,
        label: SegmentLabel || `Segment ${SegmentNumber}`,
        locked: false,
        active: false,
        cachedStats: {
          center: {
            image: [imageCentroidXYZ.x, imageCentroidXYZ.y, imageCentroidXYZ.z],
            world: [worldCentroidXYZ.x, worldCentroidXYZ.y, worldCentroidXYZ.z],
          },
          modifiedTime: segDisplaySet.SeriesDate,
          category: SegmentedPropertyCategoryCodeSequence
            ? SegmentedPropertyCategoryCodeSequence.CodeMeaning
            : '',
          type: SegmentedPropertyTypeCodeSequence
            ? SegmentedPropertyTypeCodeSequence.CodeMeaning
            : '',
          algorithmType: SegmentAlgorithmType,
          algorithmName: SegmentAlgorithmName,
        },
      };
    });

    // get next color lut index
    const colorLUTIndex = getNextColorLUTIndex();
    addColorLUT(colorLUT, colorLUTIndex);
    this._segmentationIdToColorLUTIndexMap.set(segmentationId, colorLUTIndex);

    this._broadcastEvent(EVENTS.SEGMENTATION_LOADING_COMPLETE, {
      segmentationId,
      segDisplaySet,
    });

    const seg: cstTypes.SegmentationPublicInput = {
      segmentationId,
      representation: {
        type: LABELMAP,
        data: {
          imageIds: derivedImageIds,
          // referencedVolumeId: this._getVolumeIdForDisplaySet(referencedDisplaySet),
          referencedImageIds: imageIds as string[],
        },
      },
      config: {
        label: segDisplaySet.SeriesDescription,
        segments,
      },
    };

    segDisplaySet.isLoaded = true;

    this.addOrUpdateSegmentation(seg);

    return segmentationId;
  }

  public async createSegmentationForRTDisplaySet(
    rtDisplaySet,
    options: {
      segmentationId?: string;
      type: SegmentationRepresentations;
    } = {
      type: CONTOUR,
    }
  ): Promise<string> {
    const { type } = options;
    let { segmentationId } = options;

    // Currently, only contour representation is supported for RT display
    if (type !== CONTOUR) {
      throw new Error('Only contour type is supported for RT display sets right now');
    }

    // Assign segmentationId if not provided
    segmentationId = segmentationId ?? rtDisplaySet.displaySetInstanceUID;
    const { structureSet } = rtDisplaySet;

    if (!structureSet) {
      throw new Error(
        'To create the contours from RT displaySet, the displaySet should be loaded first. You can perform rtDisplaySet.load() before calling this method.'
      );
    }

    const rtDisplaySetUID = rtDisplaySet.displaySetInstanceUID;
    const referencedDisplaySet = this.servicesManager.services.displaySetService.getDisplaySetByUID(
      rtDisplaySet.referencedDisplaySetInstanceUID
    );

    const referencedImageIdsWithGeometry = Array.from(structureSet.ReferencedSOPInstanceUIDsSet);

    const referencedImageIds = referencedDisplaySet.imageIds;
    // find the first image id that contains a referenced SOP instance UID
    const firstSegmentedSliceImageId =
      referencedImageIds?.find(imageId =>
        referencedImageIdsWithGeometry.some(referencedId =>
          imageId.includes(referencedId as string)
        )
      ) || null;

    rtDisplaySet.firstSegmentedSliceImageId = firstSegmentedSliceImageId;

    if (!structureSet.ROIContours?.length) {
      throw new Error(
        'The structureSet does not contain any ROIContours. Please ensure the structureSet is loaded first.'
      );
    }

    // Map ROI contours to RT Struct Data
    const allRTStructData = mapROIContoursToRTStructData(structureSet, rtDisplaySetUID);

    // Sort by segmentIndex for consistency
    allRTStructData.sort((a, b) => a.segmentIndex - b.segmentIndex);

    const geometryIds = allRTStructData.map(({ geometryId }) => geometryId);

    // Initialize SegmentationPublicInput similar to SEG function
    const segmentation: cstTypes.SegmentationPublicInput = {
      segmentationId,
      representation: {
        type: CONTOUR,
        data: {
          geometryIds,
        },
      },
      config: {
        label: rtDisplaySet.SeriesDescription,
      },
    };

    const segments: { [segmentIndex: string]: cstTypes.Segment } = {};
    let segmentsCachedStats = {};

    // Create colorLUT array for RT structures
    const colorLUT = [[0, 0, 0, 0]]; // First entry is transparent for index 0

    // Process each segment similarly to the SEG function
    for (const rtStructData of allRTStructData) {
      const { data, id, color, segmentIndex, geometryId, group } = rtStructData;

      // Add the color to the colorLUT array
      colorLUT.push(color);

      try {
        const geometry = await geometryLoader.createAndCacheGeometry(geometryId, {
          geometryData: {
            data,
            id,
            color,
            frameOfReferenceUID: structureSet.frameOfReferenceUID,
            segmentIndex,
          },
          type: csEnums.GeometryType.CONTOUR,
        });

        const contourSet = geometry.data as csTypes.IContourSet;
        const centroid = contourSet.centroid;

        segmentsCachedStats = {
          center: { world: centroid },
          modifiedTime: rtDisplaySet.SeriesDate, // Using SeriesDate as modifiedTime
        };

        segments[segmentIndex] = {
          label: id,
          segmentIndex,
          cachedStats: segmentsCachedStats,
          locked: false,
          active: false,
          group,
        };

        // Broadcast segment loading progress
        const numInitialized = Object.keys(segmentsCachedStats).length;
        const percentComplete = Math.round((numInitialized / allRTStructData.length) * 100);
        this._broadcastEvent(EVENTS.SEGMENT_LOADING_COMPLETE, {
          percentComplete,
          numSegments: allRTStructData.length,
        });
      } catch (e) {
        console.warn(`Error initializing contour for segment ${segmentIndex}:`, e);
        continue; // Continue processing other segments even if one fails
      }
    }

    // Create and register the colorLUT
    const colorLUTIndex = getNextColorLUTIndex();
    addColorLUT(colorLUT, colorLUTIndex);
    this._segmentationIdToColorLUTIndexMap.set(segmentationId, colorLUTIndex);

    // Assign processed segments to segmentation config
    segmentation.config.segments = segments;

    // Broadcast segmentation loading complete event
    this._broadcastEvent(EVENTS.SEGMENTATION_LOADING_COMPLETE, {
      segmentationId,
      rtDisplaySet,
    });

    // Mark the RT display set as loaded
    rtDisplaySet.isLoaded = true;
    // Add or update the segmentation in the state
    this.addOrUpdateSegmentation(segmentation);

    return segmentationId;
  }

  /**
   * Adds or updates a segmentation in the state
   * @param segmentationId - The ID of the segmentation to add or update
   * @param data - The data to add or update the segmentation with
   *
   * @remarks
   * This method handles the addition or update of a segmentation in the state.
   * If the segmentation already exists, it updates the existing segmentation.
   * If the segmentation does not exist, it adds a new segmentation.
   */
  public addOrUpdateSegmentation(
    data: cstTypes.SegmentationPublicInput | Partial<cstTypes.Segmentation>
  ) {
    const segmentationId = data.segmentationId;
    const existingSegmentation = cstSegmentation.state.getSegmentation(segmentationId);

    if (existingSegmentation) {
      // Update the existing segmentation
      this.updateSegmentationInSource(segmentationId, data as Partial<cstTypes.Segmentation>);
    } else {
      // Add a new segmentation
      this.addSegmentationToSource(data as cstTypes.SegmentationPublicInput);
    }
  }

  public setActiveSegmentation(viewportId: string, segmentationId: string): void {
    cstSegmentation.activeSegmentation.setActiveSegmentation(viewportId, segmentationId);
  }

  /**
   * Gets the active segmentation for a viewport
   * @param viewportId - The ID of the viewport to get the active segmentation for
   * @returns The active segmentation object, or null if no segmentation is active
   *
   * @remarks
   * This method retrieves the currently active segmentation for the specified viewport.
   * The active segmentation is the one that is currently selected for editing operations.
   * Returns null if no segmentation is active in the viewport.
   */
  public getActiveSegmentation(viewportId: string): cstTypes.Segmentation | null {
    return cstSegmentation.activeSegmentation.getActiveSegmentation(viewportId);
  }

  /**
   * Gets the active segment from the active segmentation in a viewport
   * @param viewportId - The ID of the viewport to get the active segment from
   * @returns The active segment object, or undefined if no segment is active
   *
   * @remarks
   * This method retrieves the currently active segment from the active segmentation
   * in the specified viewport. The active segment is the one that is currently
   * selected for editing operations. Returns undefined if no segment is active or
   * if there is no active segmentation.
   */
  public getActiveSegment(viewportId: string): cstTypes.Segment | undefined {
    const activeSegmentation = this.getActiveSegmentation(viewportId);

    if (!activeSegmentation) {
      return;
    }

    const { segments } = activeSegmentation;

    let activeSegment;
    for (const segment of Object.values(segments)) {
      if (segment.active) {
        activeSegment = segment;
        break;
      }
    }

    return activeSegment;
  }

  public hasCustomStyles(specifier: {
    viewportId: string;
    segmentationId: string;
    type: SegmentationRepresentations;
  }): boolean {
    return cstSegmentation.config.style.hasCustomStyle(specifier);
  }

  public getStyle = (specifier: {
    viewportId: string;
    segmentationId: string;
    type: SegmentationRepresentations;
    segmentIndex?: number;
  }) => {
    const style = cstSegmentation.config.style.getStyle(specifier);

    return style;
  };

  public setStyle = (
    specifier: {
      type: SegmentationRepresentations;
      viewportId?: string;
      segmentationId?: string;
      segmentIndex?: number;
    },
    style: LabelmapStyle | ContourStyle | SurfaceStyle
  ) => {
    cstSegmentation.config.style.setStyle(specifier, style);
  };

  public resetToGlobalStyle = () => {
    cstSegmentation.config.style.resetToGlobalStyle();
  };

  /**
   * Adds a new segment to the specified segmentation.
   * @param segmentationId - The ID of the segmentation to add the segment to.
   * @param viewportId: The ID of the viewport to add the segment to, it is used to get the representation, if it is not
   * provided, the first available representation for the segmentationId will be used.
   * @param config - An object containing the configuration options for the new segment.
   *   - segmentIndex: (optional) The index of the segment to add. If not provided, the next available index will be used.
   *   - properties: (optional) An object containing the properties of the new segment.
   *     - label: (optional) The label of the new segment. If not provided, a default label will be used.
   *     - color: (optional) The color of the new segment in RGB format. If not provided, a default color will be used.
   *     - visibility: (optional) Whether the new segment should be visible. If not provided, the segment will be visible by default.
   *     - isLocked: (optional) Whether the new segment should be locked for editing. If not provided, the segment will not be locked by default.
   *     - active: (optional) Whether the new segment should be the active segment to be edited. If not provided, the segment will not be active by default.
   */
  public addSegment(
    segmentationId: string,
    config: {
      segmentIndex?: number;
      label?: string;
      isLocked?: boolean;
      active?: boolean;
      color?: csTypes.Color; // Add color type
      visibility?: boolean; // Add visibility option
    } = {}
  ): void {
    if (config?.segmentIndex === 0) {
      throw new Error(i18n.t('Segment') + ' index 0 is reserved for "no label"');
    }

    const csSegmentation = this.getCornerstoneSegmentation(segmentationId);

    let segmentIndex = config.segmentIndex;
    if (!segmentIndex) {
      // grab the next available segment index based on the object keys,
      // so basically get the highest segment index value + 1
      const segmentKeys = Object.keys(csSegmentation.segments);
      segmentIndex = segmentKeys.length === 0 ? 1 : Math.max(...segmentKeys.map(Number)) + 1;
    }

    // update the segmentation
    if (!config.label) {
      config.label = `${i18n.t('Segment')} ${segmentIndex}`;
    }

    const currentSegments = csSegmentation.segments;

    cstSegmentation.updateSegmentations([
      {
        segmentationId,
        payload: {
          segments: {
            ...currentSegments,
            [segmentIndex]: {
              ...currentSegments[segmentIndex],
              segmentIndex,
              cachedStats: {},
              locked: false,
              ...config,
            },
          },
        },
      },
    ]);

    this.setActiveSegment(segmentationId, segmentIndex);

    // Apply additional configurations
    if (config.isLocked !== undefined) {
      this._setSegmentLockedStatus(segmentationId, segmentIndex, config.isLocked);
    }

    // Get all viewports that have this segmentation
    const viewportIds = this.getViewportIdsWithSegmentation(segmentationId);

    viewportIds.forEach(viewportId => {
      // Set color if provided
      if (config.color !== undefined) {
        this.setSegmentColor(viewportId, segmentationId, segmentIndex, config.color);
      }

      // Set visibility if provided
      if (config.visibility !== undefined) {
        this.setSegmentVisibility(viewportId, segmentationId, segmentIndex, config.visibility);
      }
    });
  }

  /**
   * Removes a segment from a segmentation and updates the active segment index if necessary.
   *
   * @param segmentationId - The ID of the segmentation containing the segment to remove.
   * @param segmentIndex - The index of the segment to remove.
   *
   * @remarks
   * This method performs the following actions:
   * 1. Clears the segment value in the Cornerstone segmentation.
   * 2. Updates all related segmentation representations to remove the segment.
   * 3. If the removed segment was the active segment, it updates the active segment index.
   *
   */
  public removeSegment(segmentationId: string, segmentIndex: number): void {
    cstSegmentation.removeSegment(segmentationId, segmentIndex);
  }

  public setSegmentVisibility(
    viewportId: string,
    segmentationId: string,
    segmentIndex: number,
    isVisible: boolean,
    type?: SegmentationRepresentations
  ): void {
    this._setSegmentVisibility(viewportId, segmentationId, segmentIndex, isVisible, type);
  }

  /**
   * Sets the locked status of a segment in a segmentation.
   *
   * @param segmentationId - The ID of the segmentation containing the segment.
   * @param segmentIndex - The index of the segment to set the locked status for.
   * @param isLocked - The new locked status of the segment.
   *
   * @remarks
   * This method updates the locked status of a specific segment within a segmentation.
   * A locked segment cannot be modified or edited.
   */
  public setSegmentLocked(segmentationId: string, segmentIndex: number, isLocked: boolean): void {
    this._setSegmentLockedStatus(segmentationId, segmentIndex, isLocked);
  }

  /**
   * Toggles the locked state of a segment in a segmentation.
   * @param segmentationId - The ID of the segmentation.
   * @param segmentIndex - The index of the segment to toggle.
   */
  public toggleSegmentLocked(segmentationId: string, segmentIndex: number): void {
    const isLocked = cstSegmentation.segmentLocking.isSegmentIndexLocked(
      segmentationId,
      segmentIndex
    );
    this._setSegmentLockedStatus(segmentationId, segmentIndex, !isLocked);
  }

  public toggleSegmentVisibility(
    viewportId: string,
    segmentationId: string,
    segmentIndex: number,
    type: SegmentationRepresentations
  ): void {
    const isVisible = cstSegmentation.config.visibility.getSegmentIndexVisibility(
      viewportId,
      {
        segmentationId,
        type,
      },
      segmentIndex
    );
    this._setSegmentVisibility(viewportId, segmentationId, segmentIndex, !isVisible, type);
  }

  /**
   * Sets the color of a specific segment in a segmentation.
   *
   * @param viewportId - The ID of the viewport containing the segmentation
   * @param segmentationId - The ID of the segmentation containing the segment
   * @param segmentIndex - The index of the segment to set the color for
   * @param color - The new color to apply to the segment as an array of RGBA values
   *
   * @remarks
   * This method updates the color of a specific segment within a segmentation.
   * The color parameter should be an array of 4 numbers representing RGBA values.
   */
  public setSegmentColor(
    viewportId: string,
    segmentationId: string,
    segmentIndex: number,
    color: csTypes.Color
  ): void {
    cstSegmentation.config.color.setSegmentIndexColor(
      viewportId,
      segmentationId,
      segmentIndex,
      color
    );
  }

  /**
   * Gets the current color of a specific segment in a segmentation.
   *
   * @param viewportId - The ID of the viewport containing the segmentation
   * @param segmentationId - The ID of the segmentation containing the segment
   * @param segmentIndex - The index of the segment to get the color for
   * @returns An array of 4 numbers representing the RGBA color values of the segment
   *
   * @remarks
   * This method retrieves the current color of a specific segment within a segmentation.
   * The returned color is an array of 4 numbers representing RGBA values.
   */
  public getSegmentColor(viewportId: string, segmentationId: string, segmentIndex: number) {
    return cstSegmentation.config.color.getSegmentIndexColor(
      viewportId,
      segmentationId,
      segmentIndex
    );
  }

  /**
   * Gets the labelmap volume for a segmentation
   * @param segmentationId - The ID of the segmentation to get the labelmap volume for
   * @returns The labelmap volume for the segmentation, or null if not found
   *
   * @remarks
   * This method retrieves the labelmap volume data for a specific segmentation.
   * The labelmap volume contains the actual segmentation data in the form of a 3D volume.
   * Returns null if the segmentation does not have valid labelmap volume data.
   */
  public getLabelmapVolume(segmentationId: string) {
    const csSegmentation = cstSegmentation.state.getSegmentation(segmentationId);
    const labelmapData = csSegmentation.representationData[
      SegmentationRepresentations.Labelmap
    ] as cstTypes.LabelmapToolOperationDataVolume;

    if (!labelmapData || !labelmapData.volumeId) {
      return null;
    }

    const { volumeId } = labelmapData;
    const labelmapVolume = cache.getVolume(volumeId);

    return labelmapVolume;
  }

  /**
   * Sets the label for a specific segment in a segmentation
   * @param segmentationId - The ID of the segmentation containing the segment
   * @param segmentIndex - The index of the segment to set the label for
   * @param label - The new label to apply to the segment
   *
   * @remarks
   * This method updates the text label of a specific segment within a segmentation.
   * The label is used to identify and describe the segment in the UI.
   */
  public setSegmentLabel(segmentationId: string, segmentIndex: number, label: string) {
    this._setSegmentLabel(segmentationId, segmentIndex, label);
  }

  /**
   * Sets the active segment for a segmentation
   * @param segmentationId - The ID of the segmentation containing the segment
   * @param segmentIndex - The index of the segment to set as active
   *
   * @remarks
   * This method updates which segment is considered "active" within a segmentation.
   * The active segment is typically highlighted and available for editing operations.
   */
  public setActiveSegment(segmentationId: string, segmentIndex: number): void {
    this._setActiveSegment(segmentationId, segmentIndex);
  }

  /**
   * Controls whether inactive segmentations should be rendered in a viewport
   * @param viewportId - The ID of the viewport to update
   * @param renderInactive - Whether inactive segmentations should be rendered
   *
   * @remarks
   * This method configures if segmentations that are not currently active
   * should still be visible in the specified viewport. This can be useful
   * for comparing or viewing multiple segmentations simultaneously.
   */
  public setRenderInactiveSegmentations(viewportId: string, renderInactive: boolean): void {
    cstSegmentation.config.style.setRenderInactiveSegmentations(viewportId, renderInactive);
  }

  /**
   * Gets whether inactive segmentations are being rendered for a viewport
   * @param viewportId - The ID of the viewport to check
   * @returns boolean indicating if inactive segmentations are rendered
   *
   * @remarks
   * This method retrieves the current rendering state for inactive segmentations
   * in the specified viewport. Returns true if inactive segmentations are visible.
   */
  public getRenderInactiveSegmentations(viewportId: string): boolean {
    return cstSegmentation.config.style.getRenderInactiveSegmentations(viewportId);
  }
  /**
   * Sets statistics for a group of segmentations
   * @param segmentationIds - Array of segmentation IDs that form the group
   * @param stats - Statistics object containing metrics for the segmentation group
   *
   * @remarks
   * This method stores statistical data for a group of related segmentations.
   * The stats are stored using a composite key created from the sorted and joined
   */
  public setSegmentationGroupStats(segmentationIds: string[], stats: any) {
    const groupId = this.getGroupId(segmentationIds);
    this._segmentationGroupStatsMap.set(groupId, stats);
  }

  /**
   * Gets statistics for a group of segmentations
   * @param segmentationIds - Array of segmentation IDs that form the group
   * @returns The stored statistics object for the segmentation group if found, undefined otherwise
   */
  public getSegmentationGroupStats(segmentationIds: string[]) {
    const groupId = this.getGroupId(segmentationIds);
    return this._segmentationGroupStatsMap.get(groupId);
  }

  private getGroupId(segmentationIds: string[]) {
    return segmentationIds.sort().join(',');
  }

  /**
   * Toggles the visibility of a segmentation in the state, and broadcasts the event.
   * Note: this method does not update the segmentation state in the source. It only
   * updates the state, and there should be separate listeners for that.
   * @param ids segmentation ids
   */
  public toggleSegmentationRepresentationVisibility = (
    viewportId: string,
    { segmentationId, type }: { segmentationId: string; type: SegmentationRepresentations }
  ): void => {
    this._toggleSegmentationRepresentationVisibility(viewportId, segmentationId, type);
  };

  public getViewportIdsWithSegmentation = (segmentationId: string): string[] => {
    const viewportIds = cstSegmentation.state.getViewportIdsWithSegmentation(segmentationId);
    return viewportIds;
  };

  /**
   * Clears segmentation representations from the viewport.
   * Unlike removeSegmentationRepresentations, this doesn't update
   * removed display set and representation maps.
   * We track removed segmentations manually to avoid re-adding them
   * when the display set is added again.
   * @param viewportId - The viewport ID to clear segmentation representations from.
   */
  public clearSegmentationRepresentations(viewportId: string): void {
    this.removeSegmentationRepresentations(viewportId);
  }

  /**
   * Completely removes a segmentation from the state
   * @param segmentationId - The ID of the segmentation to remove.
   */
  public remove(segmentationId: string): void {
    cstSegmentation.state.removeSegmentation(segmentationId);
  }

  public removeAllSegmentations(): void {
    cstSegmentation.state.removeAllSegmentations();
  }

  /**
   * It removes the segmentation representations from the viewport.
   * @param viewportId - The viewport id to remove the segmentation representations from.
   * @param specifier - The specifier to remove the segmentation representations.
   *
   * @remarks
   * If no specifier is provided, all segmentation representations for the viewport are removed.
   * If a segmentationId specifier is provided, only the segmentation representation with the specified segmentationId and type are removed.
   * If a type specifier is provided, only the segmentation representation with the specified type are removed.
   * If both a segmentationId and type specifier are provided, only the segmentation representation with the specified segmentationId and type are removed.
   */
  public removeSegmentationRepresentations(
    viewportId: string,
    specifier: {
      segmentationId?: string;
      type?: SegmentationRepresentations;
    } = {}
  ): void {
    cstSegmentation.removeSegmentationRepresentations(viewportId, specifier);
  }

  public jumpToSegmentCenter(
    segmentationId: string,
    segmentIndex: number,
    viewportId?: string,
    highlightAlpha = 0.9,
    highlightSegment = true,
    animationLength = 750,
    highlightHideOthers = false,
    animationFunctionType: EasingFunctionEnum = EasingFunctionEnum.EASE_IN_OUT
  ): void {
    const center = this._getSegmentCenter(segmentationId, segmentIndex);
    if (!center) {
      console.warn('No center found for segmentation', segmentationId, segmentIndex);
      return;
    }

    const { world } = center as { world: csTypes.Point3 };

    // need to find which viewports are displaying the segmentation
    const viewportIds = viewportId
      ? [viewportId]
      : this.getViewportIdsWithSegmentation(segmentationId);

    viewportIds.forEach(viewportId => {
      const { viewport } = getEnabledElementByViewportId(viewportId);
      viewport.jumpToWorld(world);

      highlightSegment &&
        this.highlightSegment(
          segmentationId,
          segmentIndex,
          viewportId,
          highlightAlpha,
          animationLength,
          highlightHideOthers,
          animationFunctionType
        );
    });
  }

  public highlightSegment(
    segmentationId: string,
    segmentIndex: number,
    viewportId?: string,
    alpha = 0.9,
    animationLength = 750,
    hideOthers = true,
    animationFunctionType: EasingFunctionEnum = EasingFunctionEnum.EASE_IN_OUT
  ): void {
    if (this.highlightIntervalId) {
      clearInterval(this.highlightIntervalId);
    }

    const csSegmentation = this.getCornerstoneSegmentation(segmentationId);

    const viewportIds = viewportId
      ? [viewportId]
      : this.getViewportIdsWithSegmentation(segmentationId);

    viewportIds.forEach(viewportId => {
      const segmentationRepresentation = this.getSegmentationRepresentations(viewportId, {
        segmentationId,
      });

      const representation = segmentationRepresentation[0];
      const { type } = representation;
      const segments = csSegmentation.segments;

      const highlightFn =
        type === LABELMAP ? this._highlightLabelmap.bind(this) : this._highlightContour.bind(this);

      const adjustedAlpha = type === LABELMAP ? alpha : 1 - alpha;

      highlightFn(
        segmentIndex,
        adjustedAlpha,
        hideOthers,
        segments,
        viewportId,
        animationLength,
        representation,
        animationFunctionType
      );
    });
  }

  private getAndValidateViewport(viewportId: string) {
    const csViewport =
      this.servicesManager.services.cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (!csViewport) {
      console.warn(`Viewport with id ${viewportId} not found.`);
      return null;
    }
    return csViewport;
  }

  /**
   * Sets the visibility of a segmentation representation.
   *
   * @param viewportId - The ID of the viewport.
   * @param segmentationId - The ID of the segmentation.
   * @param isVisible - The new visibility state.
   */
  private _setSegmentationRepresentationVisibility(
    viewportId: string,
    segmentationId: string,
    type: SegmentationRepresentations,
    isVisible: boolean
  ): void {
    const representations = this.getSegmentationRepresentations(viewportId, {
      segmentationId,
      type,
    });
    const representation = representations[0];

    if (!representation) {
      console.debug(
        'No segmentation representation found for the given viewportId and segmentationId'
      );
      return;
    }

    cstSegmentation.config.visibility.setSegmentationRepresentationVisibility(
      viewportId,
      {
        segmentationId,
        type,
      },
      isVisible
    );
  }

  private determineViewportAndSegmentationType(csViewport, segmentation) {
    const isVolumeViewport =
      csViewport.type === ViewportType.ORTHOGRAPHIC || csViewport.type === ViewportType.VOLUME_3D;
    const isVolumeSegmentation = 'volumeId' in segmentation.representationData[LABELMAP];
    return { isVolumeViewport, isVolumeSegmentation };
  }

  private async handleViewportConversion(
    isVolumeViewport: boolean,
    isVolumeSegmentation: boolean,
    csViewport: csTypes.IViewport,
    segmentation: cstTypes.Segmentation,
    viewportId: string,
    segmentationId: string,
    representationType: csToolsEnums.SegmentationRepresentations
  ) {
    let representationTypeToUse = representationType;
    let isConverted = false;

    const handler = isVolumeViewport ? this.handleVolumeViewportCase : this.handleStackViewportCase;

    ({ representationTypeToUse, isConverted } = await handler.apply(this, [
      csViewport,
      segmentation,
      isVolumeSegmentation,
      viewportId,
      segmentationId,
    ]));

    return { representationTypeToUse, isConverted };
  }

  private async handleVolumeViewportCase(csViewport, segmentation, isVolumeSegmentation) {
    if (csViewport.type === ViewportType.VOLUME_3D) {
      return { representationTypeToUse: SegmentationRepresentations.Surface, isConverted: false };
    } else {
      await this.handleVolumeViewport(
        csViewport as csTypes.IVolumeViewport,
        segmentation,
        isVolumeSegmentation
      );
      return { representationTypeToUse: SegmentationRepresentations.Labelmap, isConverted: false };
    }
  }

  private async handleStackViewportCase(
    csViewport: csTypes.IViewport,
    segmentation: cstTypes.Segmentation,
    isVolumeSegmentation: boolean,
    viewportId: string,
    segmentationId: string
  ): Promise<{ representationTypeToUse: SegmentationRepresentations; isConverted: boolean }> {
    if (isVolumeSegmentation) {
      const isConverted = await this.convertStackToVolumeViewport(csViewport);
      return { representationTypeToUse: SegmentationRepresentations.Labelmap, isConverted };
    }

    if (updateLabelmapSegmentationImageReferences(viewportId, segmentationId)) {
      return { representationTypeToUse: SegmentationRepresentations.Labelmap, isConverted: false };
    }

    const isConverted = await this.attemptStackToVolumeConversion(
      csViewport as csTypes.IStackViewport,
      segmentation,
      viewportId,
      segmentationId
    );

    return { representationTypeToUse: SegmentationRepresentations.Labelmap, isConverted };
  }

  private async _addSegmentationRepresentation(
    viewportId: string,
    segmentationId: string,
    representationType: csToolsEnums.SegmentationRepresentations,
    colorLUTIndex: number,
    isConverted: boolean,
    config?: {
      blendMode?: csEnums.BlendModes;
    }
  ): Promise<void> {
    const representation = {
      type: representationType,
      segmentationId,
      config: { colorLUTOrIndex: colorLUTIndex, ...config },
    };

    const addRepresentation = () =>
      cstSegmentation.addSegmentationRepresentations(viewportId, [representation]);

    if (isConverted) {
      const { viewportGridService } = this.servicesManager.services;
      await new Promise<void>(resolve => {
        const { unsubscribe } = viewportGridService.subscribe(
          viewportGridService.EVENTS.GRID_STATE_CHANGED,
          () => {
            addRepresentation();
            unsubscribe();
            resolve();
          }
        );
      });
    } else {
      addRepresentation();
    }
  }
  private async handleVolumeViewport(
    viewport: csTypes.IVolumeViewport,
    segmentation: SegmentationData,
    isVolumeSegmentation: boolean
  ): Promise<void> {
    if (isVolumeSegmentation) {
      return; // Volume Labelmap on Volume Viewport is natively supported
    }

    const frameOfReferenceUID = viewport.getFrameOfReferenceUID();
    const imageIds = getLabelmapImageIds(segmentation.segmentationId);
    const segImage = cache.getImage(imageIds[0]);

    if (segImage?.FrameOfReferenceUID === frameOfReferenceUID) {
      await convertStackToVolumeLabelmap(segmentation);
    }
  }

  private async convertStackToVolumeViewport(viewport: csTypes.IViewport): Promise<boolean> {
    const { viewportGridService, cornerstoneViewportService } = this.servicesManager.services;
    const state = viewportGridService.getState();
    const gridViewport = state.viewports.get(viewport.id);

    const prevViewPresentation = viewport.getViewPresentation();
    const prevViewReference = viewport.getViewReference();
    const stackViewport = cornerstoneViewportService.getCornerstoneViewport(viewport.id);
    const { element } = stackViewport;

    const volumeViewportNewVolumeHandler = () => {
      const volumeViewport = cornerstoneViewportService.getCornerstoneViewport(viewport.id);
      volumeViewport.setViewPresentation(prevViewPresentation);
      volumeViewport.setViewReference(prevViewReference);
      volumeViewport.render();

      element.removeEventListener(
        csEnums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
        volumeViewportNewVolumeHandler
      );
    };

    element.addEventListener(
      csEnums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
      volumeViewportNewVolumeHandler
    );

    viewportGridService.setDisplaySetsForViewport({
      viewportId: viewport.id,
      displaySetInstanceUIDs: gridViewport.displaySetInstanceUIDs,
      viewportOptions: {
        ...gridViewport.viewportOptions,
        viewportType: ViewportType.ORTHOGRAPHIC,
      },
    });

    return true;
  }

  private async attemptStackToVolumeConversion(
    viewport: csTypes.IStackViewport,
    segmentation: SegmentationData,
    viewportId: string,
    segmentationId: string
  ): Promise<boolean> {
    const imageIds = getLabelmapImageIds(segmentation.segmentationId);
    const frameOfReferenceUID = viewport.getFrameOfReferenceUID();
    const segImage = cache.getImage(imageIds[0]);

    if (
      segImage?.FrameOfReferenceUID &&
      frameOfReferenceUID &&
      segImage.FrameOfReferenceUID === frameOfReferenceUID
    ) {
      const isConverted = await this.convertStackToVolumeViewport(viewport);
      triggerSegmentationRepresentationModified(
        viewportId,
        segmentationId,
        SegmentationRepresentations.Labelmap
      );

      return isConverted;
    }
  }

  private addSegmentationToSource(segmentationPublicInput: cstTypes.SegmentationPublicInput) {
    cstSegmentation.addSegmentations([segmentationPublicInput]);
  }

  private updateSegmentationInSource(
    segmentationId: string,
    payload: Partial<cstTypes.Segmentation>
  ) {
    cstSegmentation.updateSegmentations([{ segmentationId, payload }]);
  }

  private _toOHIFSegmentationRepresentation(
    viewportId: string,
    csRepresentation: cstTypes.SegmentationRepresentation
  ): SegmentationRepresentation {
    const { segmentationId, type, active, visible } = csRepresentation;
    const { colorLUTIndex } = csRepresentation;

    const segmentsRepresentations: { [segmentIndex: number]: SegmentRepresentation } = {};

    const segmentation = cstSegmentation.state.getSegmentation(segmentationId);

    if (!segmentation) {
      throw new Error(`Segmentation with ID ${segmentationId} not found.`);
    }

    const segmentIds = Object.keys(segmentation.segments);

    for (const segmentId of segmentIds) {
      const segmentIndex = parseInt(segmentId, 10);

      const color = cstSegmentation.config.color.getSegmentIndexColor(
        viewportId,
        segmentationId,
        segmentIndex
      );

      const isVisible = cstSegmentation.config.visibility.getSegmentIndexVisibility(
        viewportId,
        {
          segmentationId,
          type,
        },
        segmentIndex
      );

      segmentsRepresentations[segmentIndex] = {
        color,
        segmentIndex,
        opacity: color[3],
        visible: isVisible,
      };
    }

    const styles = cstSegmentation.config.style.getStyle({
      viewportId,
      segmentationId,
      type,
    });

    const id = `${segmentationId}-${type}-${viewportId}`;

    return {
      id: id,
      segmentationId,
      label: segmentation.label,
      active,
      type,
      visible,
      segments: segmentsRepresentations,
      styles,
      viewportId,
      colorLUTIndex,
      config: {},
    };
  }

  private _initSegmentationService() {
    eventTarget.addEventListener(
      csToolsEnums.Events.SEGMENTATION_MODIFIED,
      this._onSegmentationModifiedFromSource
    );

    eventTarget.addEventListener(
      csToolsEnums.Events.SEGMENTATION_REMOVED,
      this._onSegmentationModifiedFromSource
    );

    eventTarget.addEventListener(
      csToolsEnums.Events.SEGMENTATION_DATA_MODIFIED,
      this._onSegmentationDataModifiedFromSource
    );

    eventTarget.addEventListener(
      csToolsEnums.Events.SEGMENTATION_REPRESENTATION_MODIFIED,
      this._onSegmentationRepresentationModifiedFromSource
    );

    eventTarget.addEventListener(
      csToolsEnums.Events.SEGMENTATION_REPRESENTATION_ADDED,
      this._onSegmentationRepresentationModifiedFromSource
    );

    eventTarget.addEventListener(
      csToolsEnums.Events.SEGMENTATION_REPRESENTATION_REMOVED,
      this._onSegmentationRepresentationModifiedFromSource
    );

    eventTarget.addEventListener(
      csToolsEnums.Events.SEGMENTATION_ADDED,
      this._onSegmentationAddedFromSource
    );
  }

  private getCornerstoneSegmentation(segmentationId: string) {
    return cstSegmentation.state.getSegmentation(segmentationId);
  }

  private _highlightLabelmap(
    segmentIndex: number,
    alpha: number,
    hideOthers: boolean,
    segments: Segment[],
    viewportId: string,
    animationLength: number,
    representation: cstTypes.SegmentationRepresentation,
    animationFunctionType: EasingFunctionEnum
  ) {
    const { segmentationId } = representation;
    const newSegmentSpecificConfig = {
      fillAlpha: alpha,
    };

    if (hideOthers) {
      throw new Error('hideOthers is not working right now');
      for (let i = 0; i < segments.length; i++) {
        if (i !== segmentIndex) {
          newSegmentSpecificConfig[i] = {
            fillAlpha: 0,
          };
        }
      }
    }

    const { fillAlpha } = this.getStyle({
      viewportId,
      segmentationId,
      type: LABELMAP,
      segmentIndex,
    }) as cstTypes.LabelmapStyle;

    let startTime: number = null;
    const animation = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationLength, 1);

      const easingFunction = EasingFunctionMap.get(animationFunctionType);

      cstSegmentation.config.style.setStyle(
        {
          segmentationId,
          segmentIndex,
          type: LABELMAP,
        },
        {
          fillAlpha: easingFunction(progress, fillAlpha),
        }
      );

      if (progress < 1) {
        requestAnimationFrame(animation);
      } else {
        cstSegmentation.config.style.setStyle(
          {
            segmentationId,
            segmentIndex,
            type: LABELMAP,
          },
          {}
        );
      }
    };

    requestAnimationFrame(animation);
  }

  private _highlightContour(
    segmentIndex: number,
    alpha: number,
    hideOthers: boolean,
    segments: Segment[],
    viewportId: string,
    animationLength: number,
    representation: cstTypes.SegmentationRepresentation,
    animationFunctionType: EasingFunctionEnum
  ) {
    const { segmentationId } = representation;
    const startTime = performance.now();

    const prevStyle = cstSegmentation.config.style.getStyle({
      type: CONTOUR,
    }) as ContourStyle;

    const prevOutlineWidth = prevStyle.outlineWidth;

    const animate = (currentTime: number) => {
      const progress = (currentTime - startTime) / animationLength;
      if (progress >= 1) {
        cstSegmentation.config.style.resetToGlobalStyle();
        return;
      }

      const OUTLINE_ANIMATION_SCALE_FACTOR = 5;
      const easingFunction = EasingFunctionMap.get(animationFunctionType);

      cstSegmentation.config.style.setStyle(
        {
          segmentationId,
          segmentIndex,
          type: CONTOUR,
        },
        {
          outlineWidth: easingFunction(progress, prevOutlineWidth, OUTLINE_ANIMATION_SCALE_FACTOR),
        }
      );

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  private _toggleSegmentationRepresentationVisibility = (
    viewportId: string,
    segmentationId: string,
    type: SegmentationRepresentations
  ): void => {
    const representations = this.getSegmentationRepresentations(viewportId, {
      segmentationId,
      type,
    });
    const representation = representations[0];

    const segmentsHidden = cstSegmentation.config.visibility.getHiddenSegmentIndices(viewportId, {
      segmentationId,
      type: representation.type,
    });

    const currentVisibility = segmentsHidden.size === 0;
    this._setSegmentationRepresentationVisibility(
      viewportId,
      segmentationId,
      representation.type,
      !currentVisibility
    );
  };

  private _setActiveSegment(segmentationId: string, segmentIndex: number) {
    cstSegmentation.segmentIndex.setActiveSegmentIndex(segmentationId, segmentIndex);
  }

  private _getVolumeIdForDisplaySet(displaySet) {
    const volumeLoaderSchema = displaySet.volumeLoaderSchema ?? VOLUME_LOADER_SCHEME;

    return `${volumeLoaderSchema}:${displaySet.displaySetInstanceUID}`;
  }

  private _getSegmentCenter(
    segmentationId: string,
    segmentIndex: number
  ): { image?: csTypes.Point3; world: csTypes.Point3 } | undefined {
    const segmentation = this.getSegmentation(segmentationId);

    if (!segmentation) {
      return;
    }

    const { segments } = segmentation;

    const { cachedStats } = segments[segmentIndex];

    if (cachedStats?.center) {
      const { center } = cachedStats;

      return center as { image: csTypes.Point3; world: csTypes.Point3 };
    }

    if (cachedStats?.namedStats?.center) {
      return {
        world: cachedStats.namedStats.center.value,
      };
    }
  }

  private _setSegmentLockedStatus(segmentationId: string, segmentIndex: number, isLocked: boolean) {
    cstSegmentation.segmentLocking.setSegmentIndexLocked(segmentationId, segmentIndex, isLocked);
  }

  private _setSegmentVisibility(
    viewportId: string,
    segmentationId: string,
    segmentIndex: number,
    isVisible: boolean,
    type?: SegmentationRepresentations
  ) {
    cstSegmentation.config.visibility.setSegmentIndexVisibility(
      viewportId,
      {
        segmentationId,
        type,
      },
      segmentIndex,
      isVisible
    );
  }

  private _setSegmentLabel(segmentationId: string, segmentIndex: number, segmentLabel: string) {
    const segmentation = this.getCornerstoneSegmentation(segmentationId);
    const { segments } = segmentation;

    segments[segmentIndex].label = segmentLabel;

    cstSegmentation.updateSegmentations([
      {
        segmentationId,
        payload: {
          segments,
        },
      },
    ]);
  }

  private _onSegmentationDataModifiedFromSource = evt => {
    const { segmentationId } = evt.detail;
    this._broadcastEvent(this.EVENTS.SEGMENTATION_DATA_MODIFIED, {
      segmentationId,
    });
  };

  private _onSegmentationRepresentationModifiedFromSource = evt => {
    const { segmentationId, viewportId } = evt.detail;
    this._broadcastEvent(this.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED, {
      segmentationId,
      viewportId,
    });
  };

  private _onSegmentationModifiedFromSource = (
    evt: cstTypes.EventTypes.SegmentationModifiedEventType
  ) => {
    const { segmentationId } = evt.detail;

    this._broadcastEvent(this.EVENTS.SEGMENTATION_MODIFIED, {
      segmentationId,
    });
  };

  private _onSegmentationAddedFromSource = (
    evt: cstTypes.EventTypes.SegmentationAddedEventType
  ) => {
    const { segmentationId } = evt.detail;

    this._broadcastEvent(this.EVENTS.SEGMENTATION_ADDED, {
      segmentationId,
    });
  };
}

export default SegmentationService;
export { EVENTS, VALUE_TYPES };
