import {
  cache,
  Enums as csEnums,
  eventTarget,
  geometryLoader,
  getEnabledElementByViewportId,
  imageLoader,
  Types as csTypes,
  utilities as csUtils,
  VolumeViewport,
} from '@cornerstonejs/core';
import {
  Enums as csToolsEnums,
  segmentation as cstSegmentation,
  Types as cstTypes,
  utilities as cstUtils,
} from '@cornerstonejs/tools';
import { PubSubService, Types as OHIFTypes } from '@ohif/core';
import { easeInOutBell, reverseEaseInOutBell } from '../../utils/transitions';
import { mapROIContoursToRTStructData } from './RTSTRUCT/mapROIContoursToRTStructData';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';

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
  //
  SEGMENTATION_DATA_MODIFIED: 'event::segmentation_data_modified',
  // fired when the segmentation is removed
  SEGMENTATION_REMOVED: 'event::segmentation_removed',
  //
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

const VOLUME_LOADER_SCHEME = 'cornerstoneStreamingImageVolume';

class SegmentationService extends PubSubService {
  static REGISTRATION = {
    name: 'segmentationService',
    altName: 'SegmentationService',
    create: ({ servicesManager }: OHIFTypes.Extensions.ExtensionParams): SegmentationService => {
      return new SegmentationService({ servicesManager });
    },
  };

  readonly servicesManager: AppTypes.ServicesManager;
  highlightIntervalId = null;
  readonly EVENTS = EVENTS;

  constructor({ servicesManager }) {
    super(EVENTS);

    this.servicesManager = servicesManager;

    this._initSegmentationService();
  }

  /**
   * Retrieves information about specific segmentations and their representations based on the provided criteria.
   *
   * @param specifier - An object containing optional parameters to specify the segmentation representation.
   * @param specifier.segmentationId - Optional. The ID of the segmentation.
   * @param specifier.viewportId - Optional. The ID of the viewport containing the segmentation representation.
   * @param specifier.type - Optional. The type of segmentation representation.
   * @returns An array of `Segmentation` objects containing the segmentation data and its representation.
   *
   * @remarks
   * This method filters segmentations and their representations according to the provided `specifier`:
   * - **No parameters provided**: Returns all segmentations with their data and no specific representations.
   * - **Only `segmentationId` provided**: Returns the specified segmentation regardless of viewport or type.
   * - **Only `viewportId` provided**: Returns all segmentations represented in the specified viewport.
   * - **Only `type` provided**: Returns all segmentations of the specified type.
   * - **Combination of parameters**: Returns segmentations matching all specified criteria.
   */
  public getSegmentationsInfo(
    specifier: {
      segmentationId?: string;
      viewportId?: string;
      type?: SegmentationRepresentations;
    } = {}
  ): SegmentationInfo[] {
    const { segmentationId, viewportId, type } = specifier;
    const segmentationsInfo: SegmentationInfo[] = [];

    const segmentations = cstSegmentation.state.getSegmentations();
    // Case 1: No specifier provided - return all segmentations without representations
    if (!segmentationId && !viewportId && !type) {
      return segmentations.map(segmentation => ({
        segmentation,
        representation: null,
      }));
    }

    if (segmentationId && !viewportId && !type) {
      // filter segmentations by segmentationId
      const filteredSegmentations = segmentations.filter(
        segmentation => segmentation.segmentationId === segmentationId
      );

      return filteredSegmentations.map(segmentation => ({
        segmentation,
        representation: null,
      }));
    }

    const segmentationIds = new Set<string>();

    if (viewportId) {
      // Fetch representations based on viewportId and other specifiers
      const representations = this.getSegmentationRepresentations(viewportId, {
        segmentationId,
        type,
      });

      representations.forEach(rep => {
        const segmentation = cstSegmentation.state.getSegmentation(rep.segmentationId);
        if (segmentation && !segmentationIds.has(segmentation.segmentationId)) {
          segmentationsInfo.push({
            segmentation,
            representation: rep,
          });
          segmentationIds.add(segmentation.segmentationId);
        }
      });
    }

    // if (segmentationId && !viewportId) {
    //   const segmentation = cstSegmentation.state.getSegmentation(segmentationId);
    //   if (segmentation && !segmentationIds.has(segmentation.segmentationId)) {
    //     // If type is specified, ensure the segmentation matches the type
    //     if (!type || segmentation.type === type) {
    //       segmentationsInfo.push({
    //         segmentation,
    //         representation: null,
    //       });
    //       segmentationIds.add(segmentation.segmentationId);
    //     }
    //   }
    // }

    // if (type && !viewportId && !segmentationId) {
    //   // Fetch all segmentations of the specified type
    //   const filteredSegmentations = this.getSegmentationRepresentations()

    //   filteredSegmentations.forEach(segmentation => {
    //     if (!segmentationIds.has(segmentation.segmentationId)) {
    //       segmentationsInfo.push({
    //         segmentation,
    //         representation: null,
    //       });
    //       segmentationIds.add(segmentation.segmentationId);
    //     }
    //   });
    // }

    return segmentationsInfo;
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
      csToolsEnums.Events.SEGMENTATION_DATA_MODIFIED,
      this._onSegmentationDataModifiedFromSource
    );

    this.listeners = {};
  };

  /**
   * Creates an empty labelmap segmentation for a specified viewport.
   *
   * @param viewportId - The ID of the viewport to create the segmentation for.
   * @param options - Optional parameters for creating the segmentation.
   * @param options.displaySetInstanceUID - The UID of the display set to use. If not provided, it will use the first display set of the viewport.
   * @param options.label - The label for the segmentation. If not provided, a default label will be generated.
   * @param options.segmentationId - The ID for the segmentation. If not provided, a UUID will be generated.
   * @returns A promise that resolves to the generated segmentation ID.
   */
  public async createEmptyLabelmapForViewport(
    viewportId: string,
    options: {
      displaySetInstanceUID?: string;
      label?: string;
      segmentationId?: string;
      createInitialSegment?: boolean;
    } = {
      createInitialSegment: true,
    }
  ): Promise<string> {
    const { viewportGridService } = this.servicesManager.services;
    const { viewports, activeViewportId } = viewportGridService.getState();
    const targetViewportId = viewportId || activeViewportId;

    const viewport = viewports.get(targetViewportId);

    // Todo: add support for multiple display sets
    const displaySetInstanceUID =
      options.displaySetInstanceUID || viewport.displaySetInstanceUIDs[0];

    const currentRepresentations = this.getSegmentationRepresentations(targetViewportId);

    const label = options.label || `Segmentation ${currentRepresentations.length + 1}`;
    const segmentationId = options.segmentationId || `${csUtils.uuidv4()}`;

    const generatedSegmentationId = await this.createEmptyLabelmapForDisplaySetUID(
      displaySetInstanceUID,
      {
        label,
        segmentationId,
        segments: options.createInitialSegment
          ? {
              1: {
                label: 'Segment 1',
                active: true,
              },
            }
          : {},
      }
    );

    await this.addSegmentationRepresentationToViewport({
      viewportId,
      segmentationId,
      representationType: LABELMAP,
    });

    return generatedSegmentationId;
  }

  public addSegmentationRepresentationToViewport = async ({
    viewportId,
    segmentationId,
    representationType = csToolsEnums.SegmentationRepresentations.Labelmap,
    suppressEvents = false,
  }: {
    viewportId: string;
    segmentationId: string;
    representationType?: csToolsEnums.SegmentationRepresentations;
    suppressEvents?: boolean;
  }): Promise<void> => {
    const segmentation = this.getSegmentationsInfo({ segmentationId });

    if (!segmentation) {
      throw new Error(`Segmentation with segmentationId ${segmentationId} not found.`);
    }

    cstSegmentation.addSegmentationRepresentations(viewportId, [
      {
        type: representationType,
        segmentationId,
      },
    ]);

    if (!suppressEvents) {
      this._broadcastEvent(this.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED, {
        segmentationId,
      });
    }
  };

  /**
   * Creates an empty labelmap segmentation for a given display set.
   *
   * @param displaySetInstanceUID - The UID of the display set to create the segmentation for.
   * @param options - Optional parameters for creating the segmentation.
   * @param options.segmentationId - Custom segmentation ID. If not provided, a UUID will be generated.
   * @param options.FrameOfReferenceUID - Frame of reference UID for the segmentation.
   * @param options.label - Label for the segmentation.
   * @returns A promise that resolves to the created segmentation ID.
   */
  public async createEmptyLabelmapForDisplaySetUID(
    displaySetInstanceUID: string,
    options?: {
      segmentationId?: string;
      segments?: { [segmentIndex: number]: Partial<cstTypes.Segment> };
      FrameOfReferenceUID?: string;
      label: string;
    }
  ): Promise<string> {
    const { displaySetService } = this.servicesManager.services;

    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

    // Todo: random does not makes sense, make this better, like
    // labelmap 1, 2, 3 etc
    const segmentationId = options?.segmentationId ?? `${csUtils.uuidv4()}`;
    const referenceImageIds = displaySet.imageIds;
    const derivedImages = await imageLoader.createAndCacheDerivedLabelmapImages(referenceImageIds);

    const segImageIds = derivedImages.map(image => image.imageId);

    const segmentationPublicInput: cstTypes.SegmentationPublicInput = {
      segmentationId,
      representation: {
        type: LABELMAP,
        data: {
          imageIds: segImageIds,
          referencedVolumeId: this._getVolumeIdForDisplaySet(displaySet),
          referencedImageIds: referenceImageIds,
        },
      },
      config: {
        label: options.label,
        segments: options.segments ?? {},
      },
    };

    this.addOrUpdateSegmentation(segmentationId, segmentationPublicInput);
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
    const { labelmapBufferArray } = segDisplaySet;

    if (type !== LABELMAP) {
      throw new Error('Only labelmap type is supported for SEG display sets right now');
    }

    if (!labelmapBufferArray) {
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

    const derivedSegmentationImages =
      await imageLoader.createAndCacheDerivedLabelmapImages(imageIds);

    segDisplaySet.images = derivedSegmentationImages;

    const segmentsInfo = segDisplaySet.segMetadata.data;

    const segments: { [segmentIndex: string]: cstTypes.Segment } = {};

    segmentsInfo.forEach((segmentInfo, index) => {
      if (index === 0) {
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

      const { x, y, z } = segDisplaySet.centroids.get(index) || { x: 0, y: 0, z: 0 };
      const segmentIndex = Number(SegmentNumber);

      segments[segmentIndex] = {
        segmentIndex,
        label: SegmentLabel || `Segment ${SegmentNumber}`,
        locked: false,
        active: false,
        cachedStats: {
          center: {
            image: [x, y, z],
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
          color: rgba,
          opacity: 255,
          isVisible: true,
        },
      };
    });

    // now we need to chop the volume array into chunks and set the scalar data for each derived segmentation image
    const volumeScalarData = new Uint8Array(labelmapBufferArray[0]);

    // We should parse the segmentation as separate slices to support overlapping segments.
    // This parsing should occur in the CornerstoneJS library adapters.
    // For now, we use the volume returned from the library and chop it here.
    for (let i = 0; i < derivedSegmentationImages.length; i++) {
      const voxelManager = derivedSegmentationImages[i]
        .voxelManager as csTypes.IVoxelManager<number>;
      const scalarData = voxelManager.getScalarData();
      scalarData.set(volumeScalarData.slice(i * scalarData.length, (i + 1) * scalarData.length));
      voxelManager.setScalarData(scalarData);
    }

    this._broadcastEvent(EVENTS.SEGMENTATION_LOADING_COMPLETE, {
      segmentationId,
      segDisplaySet,
    });

    const seg: cstTypes.SegmentationPublicInput = {
      segmentationId,
      representation: {
        type: LABELMAP,
        data: {
          imageIds: derivedSegmentationImages.map(image => image.imageId),
          referencedVolumeId: this._getVolumeIdForDisplaySet(referencedDisplaySet),
          referencedImageIds: imageIds,
        },
      },
      config: {
        label: segDisplaySet.SeriesDescription,
        segments,
      },
    };

    segDisplaySet.isLoaded = true;

    this.addOrUpdateSegmentation(segmentationId, seg);

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
        segments: {},
      },
    };

    if (!structureSet.ROIContours?.length) {
      throw new Error(
        'The structureSet does not contain any ROIContours. Please ensure the structureSet is loaded first.'
      );
    }

    const segments: { [segmentIndex: string]: cstTypes.Segment } = {};
    const segmentsCachedStats: { [segmentIndex: number]: unknown } = {};

    // Process each segment similarly to the SEG function
    for (const rtStructData of allRTStructData) {
      const { data, id, color, segmentIndex, geometryId } = rtStructData;

      try {
        const geometry = await geometryLoader.createAndCacheGeometry(geometryId, {
          geometryData: {
            data,
            id,
            color,
            frameOfReferenceUID: structureSet.frameOfReferenceUID,
            segmentIndex,
          },
          type: csEnums.GeometryType.Contour,
        });

        const contourSet = geometry.data as csTypes.IContourSet;
        const centroid = contourSet.getCentroid();

        segmentsCachedStats[segmentIndex] = {
          center: { world: centroid },
          modifiedTime: rtDisplaySet.SeriesDate, // Using SeriesDate as modifiedTime
        };

        segments[segmentIndex] = {
          label: id,
          segmentIndex,
          cachedStats: segmentsCachedStats[segmentIndex],
          locked: false,
          active: false,
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
    this.addOrUpdateSegmentation(segmentationId, segmentation);

    return segmentationId;
  }

  public addOrUpdateSegmentation(
    segmentationId: string,
    data: cstTypes.SegmentationPublicInput | Partial<cstTypes.Segmentation>
  ) {
    const existingSegmentation = cstSegmentation.state.getSegmentation(segmentationId);

    if (existingSegmentation) {
      // Update the existing segmentation
      this.updateSegmentationInSource(segmentationId, data as Partial<cstTypes.Segmentation>);
    } else {
      // Add a new segmentation
      this.addSegmentationToSource(segmentationId, data as cstTypes.SegmentationPublicInput);
    }
  }

  private addSegmentationToSource(
    segmentationId: string,
    segmentationPublicInput: cstTypes.SegmentationPublicInput
  ) {
    cstSegmentation.addSegmentations([segmentationPublicInput]);
  }

  private updateSegmentationInSource(
    segmentationId: string,
    payload: Partial<cstTypes.Segmentation>
  ) {
    cstSegmentation.updateSegmentations([{ segmentationId, payload }]);
  }

  public setActiveSegmentation(viewportId: string, segmentationId: string): void {
    cstSegmentation.activeSegmentation.setActiveSegmentation(viewportId, segmentationId);
  }

  public getConfiguration = (viewportId?: string): SegmentationConfig => {
    return {};
    const brushSize = 1;

    const brushThresholdGate = 1;

    const segmentationRepresentations = this.getSegmentationRepresentationsForViewport(viewportId);

    const typeToUse = segmentationRepresentations?.[0]?.type || LABELMAP;
    return {};

    const config = cstSegmentation.config.getGlobalConfig();
    const { renderInactiveRepresentations } = config;

    const representation = config.representations[typeToUse];

    const {
      renderOutline,
      outlineWidthActive,
      renderFill,
      fillAlpha,
      fillAlphaInactive,
      outlineOpacity,
      outlineOpacityInactive,
    } = representation as LabelmapConfig;

    return {
      brushSize,
      brushThresholdGate,
      fillAlpha,
      fillAlphaInactive,
      outlineWidthActive,
      renderFill,
      renderInactiveRepresentations,
      renderOutline,
      outlineOpacity,
      outlineOpacityInactive,
    };
  };

  public setConfiguration = (configuration: SegmentationConfig): void => {
    const {
      fillAlpha,
      fillAlphaInactive,
      outlineWidthActive,
      outlineOpacity,
      renderFill,
      renderInactiveRepresentations,
      renderOutline,
    } = configuration;

    const setConfigValueIfDefined = (key, value, transformFn = null) => {
      if (value !== undefined) {
        const transformedValue = transformFn ? transformFn(value) : value;
        this._setSegmentationConfig(key, transformedValue);
      }
    };

    setConfigValueIfDefined('renderOutline', renderOutline);
    setConfigValueIfDefined('outlineWidthActive', outlineWidthActive);
    setConfigValueIfDefined('outlineOpacity', outlineOpacity, v => v / 100);
    setConfigValueIfDefined('fillAlpha', fillAlpha, v => v / 100);
    setConfigValueIfDefined('renderFill', renderFill);
    setConfigValueIfDefined('fillAlphaInactive', fillAlphaInactive, v => v / 100);
    setConfigValueIfDefined('outlineOpacityInactive', fillAlphaInactive, v =>
      Math.max(0.75, v / 100)
    );

    if (renderInactiveRepresentations !== undefined) {
      const config = cstSegmentation.config.getGlobalConfig();
      config.renderInactiveRepresentations = renderInactiveRepresentations;
      cstSegmentation.config.setGlobalConfig(config);
    }

    this._broadcastEvent(this.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED, this.getConfiguration());
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
   *     - opacity: (optional) The opacity of the new segment. If not provided, a default opacity will be used.
   *     - visibility: (optional) Whether the new segment should be visible. If not provided, the segment will be visible by default.
   *     - isLocked: (optional) Whether the new segment should be locked for editing. If not provided, the segment will not be locked by default.
   *     - active: (optional) Whether the new segment should be the active segment to be edited. If not provided, the segment will not be active by default.
   */
  public addSegment(
    segmentationId: string,
    config: {
      segmentIndex?: number;
      viewportId?: string;
      properties?: {
        label?: string;
        color?: OHIFTypes.RGB;
        opacity?: number;
        visibility?: boolean;
        isLocked?: boolean;
        active?: boolean;
      };
    } = {}
  ): void {
    if (config?.segmentIndex === 0) {
      throw new Error('Segment index 0 is reserved for "no label"');
    }

    const { segmentationRepresentationUID, segmentation } =
      this._getSegmentationInfo(segmentationId);

    let segmentIndex = config.segmentIndex;
    if (!segmentIndex) {
      // grab the next available segment index
      segmentIndex = segmentation.segments.length === 0 ? 1 : segmentation.segments.length;
    }

    if (this._getSegmentInfo(segmentation, segmentIndex)) {
      throw new Error(`Segment ${segmentIndex} already exists`);
    }

    const rgbaColor = cstSegmentation.config.color.getSegmentIndexColor(
      segmentationRepresentationUID,
      segmentIndex
    );

    segmentation.segments[segmentIndex] = {
      label: config.properties?.label ?? `Segment ${segmentIndex}`,
      segmentIndex: segmentIndex,
      color: [rgbaColor[0], rgbaColor[1], rgbaColor[2]],
      opacity: rgbaColor[3],
      isVisible: true,
      isLocked: false,
    };

    segmentation.segmentCount++;

    // make the newly added segment the active segment
    this._setActiveSegment(segmentationId, segmentIndex);

    const suppressEvents = true;
    if (config.properties !== undefined) {
      const { color: newColor, opacity, isLocked, visibility, active } = config.properties;

      if (newColor !== undefined) {
        this._setSegmentColor(
          segmentationId,
          segmentIndex,
          newColor,
          config.viewportId,
          suppressEvents
        );
      }

      if (visibility !== undefined) {
        this._setSegmentVisibility(
          segmentationId,
          segmentIndex,
          visibility,
          config.viewportId,
          config.type
        );
      }

      if (active === true) {
        this._setActiveSegment(segmentationId, segmentIndex);
      }

      if (isLocked !== undefined) {
        this._setSegmentLockedStatus(segmentationId, segmentIndex, isLocked);
      }
    }

    if (segmentation.activeSegmentIndex === null) {
      this._setActiveSegment(segmentationId, segmentIndex);
    }

    // Todo: this includes non-hydrated segmentations which might not be
    // persisted in the store
    this._broadcastEvent(this.EVENTS.SEGMENTATION_MODIFIED, {
      segmentation,
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
    cstSegmentation.helpers.clearSegmentValue(segmentationId, segmentIndex);

    const csActiveSegmentation = cstSegmentation.segmentIndex.getActiveSegmentIndex(segmentationId);
    const shouldUpdateActiveSegmentIndex = csActiveSegmentation === segmentIndex;

    // update the segment on each of the representations
    this.segmentationRepresentations.forEach(representation => {
      if (representation.segmentationId === segmentationId) {
        representation.segments[segmentIndex] = null;
      }
    });

    const aRepresentation = this.segmentationRepresentations.find(
      representation => representation.segmentationId === segmentationId
    );

    if (shouldUpdateActiveSegmentIndex) {
      const nextSegmentIndex = aRepresentation.segments.findIndex(segment => segment !== null);
      const newActiveSegmentIndex = nextSegmentIndex !== -1 ? nextSegmentIndex : null;

      this._setActiveSegment(segmentationId, newActiveSegmentIndex);
    }
  }

  public setSegmentVisibility(
    segmentationId: string,
    segmentIndex: number,
    isVisible: boolean,
    viewportId?: string,
    type?: SegmentationRepresentations
  ): void {
    this._setSegmentVisibility(segmentationId, segmentIndex, isVisible, viewportId, type);
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

  public getSegmentColor(viewportId: string, segmentationId: string, segmentIndex: number) {
    return cstSegmentation.config.color.getSegmentIndexColor(
      viewportId,
      segmentationId,
      segmentIndex
    );
  }

  public setSegmentLabel(segmentationId: string, segmentIndex: number, label: string) {
    this._setSegmentLabel(segmentationId, segmentIndex, label);
  }

  public setActiveSegment(segmentationId: string, segmentIndex: number): void {
    this._setActiveSegment(segmentationId, segmentIndex, false);
  }

  private _toOHIFSegmentationRepresentation(
    viewportId: string,
    csRepresentation: cstTypes.SegmentationRepresentation
  ): SegmentationRepresentation {
    const { segmentationId, type, active, visible } = csRepresentation;
    const { colorLUTIndex } = csRepresentation.config;

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

    const segmentsHidden = cstSegmentation.config.visibility.getHiddenSegmentIndices(viewportId, {
      segmentationId,
      type,
    });

    return {
      segmentationId,
      active,
      type,
      visible,
      segments: segmentsRepresentations,
      styles,
      viewportId,
      segmentsHidden: new Set(segmentsHidden),
      config: {
        colorLUTIndex,
      },
    };
  }

  /**
   * Toggles the visibility of a segmentation in the state, and broadcasts the event.
   * Note: this method does not update the segmentation state in the source. It only
   * updates the state, and there should be separate listeners for that.
   * @param ids segmentation ids
   */
  public toggleSegmentationVisibility = (segmentationId: string): void => {
    this._toggleSegmentationVisibility(segmentationId, false);
  };

  // private createNewRepresentation = async (
  //   viewportId: string,
  //   segmentationId: string,
  //   segmentation: Segmentation,
  //   representationType: csToolsEnums.SegmentationRepresentations
  // ): Promise<string> => {
  //   const colorLUT = this.createColorLUT(segmentation);
  //   const colorLUTIndex = cstSegmentation.config.color.addColorLUT(colorLUT);

  //   const [uid] = await cstSegmentation.addSegmentationRepresentations(viewportId, [
  //     {
  //       segmentationId,
  //       type: representationType,
  //       options: { colorLUTOrIndex: colorLUTIndex },
  //     },
  //   ]);

  //   return uid;
  // };

  // private createColorLUT = (segmentation: Segmentation): ColorLUT => {
  //   const colorLUT = Array.from({ length: segmentation.segments.length }, (_, index) => {
  //     if (index === 0) {
  //       return [0, 0, 0, 0];
  //     }
  //     const segment = segmentation.segments[index];
  //     return segment ? [...segment.color, 255] : [0, 0, 0, 0];
  //   }) as ColorLUT;

  //   return colorLUT;
  // };

  public getViewportIdsWithSegmentation = (segmentationId: string): string[] => {
    const viewportIds = cstSegmentation.state.getViewportIdsWithSegmentation(segmentationId);
    return viewportIds;
  };

  public removeSegmentationRepresentations(
    viewportId: string,
    specifier: {
      segmentationId?: string;
      type?: SegmentationRepresentations;
    } = {}
  ): void {
    cstSegmentation.removeSegmentationRepresentations(viewportId, specifier);
  }

  /**
   * Removes a segmentation and broadcasts the removed event.
   *
   * @param {string} segmentationId The segmentation id
   */
  public remove(segmentationId: string): void {
    const segmentation = this.segmentationRepresentations[segmentationId];
    const wasActive = segmentation.isActive;

    if (!segmentationId || !segmentation) {
      console.warn(`No segmentationId provided, or unable to find segmentation by id.`);
      return;
    }

    const { updatedViewportIds } = this._removeSegmentationFromCornerstone(segmentationId);

    delete this.segmentationRepresentations[segmentationId];

    // If this segmentation was active, and there is another segmentation, set another one active.

    if (wasActive) {
      const remainingSegmentations = this._getSegmentationRepresentations();

      const remainingHydratedSegmentations = remainingSegmentations.filter(
        segmentation => segmentation.hydrated
      );

      if (remainingHydratedSegmentations.length) {
        const { id } = remainingHydratedSegmentations[0];

        updatedViewportIds.forEach(viewportId => {
          this._setActiveSegmentationForViewport(id, viewportId, null);
        });
      }
    }

    this._setDisplaySetIsHydrated(segmentationId, false);

    this._broadcastEvent(this.EVENTS.SEGMENTATION_REMOVED, {
      segmentationId,
    });
  }

  public getLabelmapVolume = (segmentationId: string) => {
    if (!this.segmentationRepresentations?.[segmentationId]) {
      return;
    }

    const labelmapVolumeData = this.segmentationRepresentations[segmentationId].representationData
      .Labelmap as LabelmapSegmentationDataVolume;

    const volumeId = labelmapVolumeData.volumeId;

    return cache.getVolume(volumeId);
  };

  public getLabelmapReferencedVolume = (segmentationId: string) => {
    const labelmapVolumeData = this.segmentationRepresentations[segmentationId].representationData
      .Labelmap as LabelmapSegmentationDataVolume;

    const volumeId = labelmapVolumeData.referencedVolumeId;

    return cache.getVolume(volumeId);
  };

  // Todo: this should not run on the main thread
  public calculateCentroids = (
    segmentationId: string,
    segmentIndex?: number
  ): Map<number, { x: number; y: number; z: number; world: number[] }> => {
    const segmentation = this.getSegmentation(segmentationId);
    const volume = this.getLabelmapVolume(segmentationId);
    const { dimensions, imageData } = volume;
    const volumeVoxelManager = volume.voxelManager;
    const [dimX, dimY, numFrames] = dimensions;
    const frameLength = dimX * dimY;

    const segmentIndices = segmentIndex
      ? [segmentIndex]
      : segmentation.segments
          .filter(segment => segment?.segmentIndex)
          .map(segment => segment.segmentIndex);

    const segmentIndicesSet = new Set(segmentIndices);

    const centroids = new Map();
    for (const index of segmentIndicesSet) {
      centroids.set(index, { x: 0, y: 0, z: 0, count: 0 });
    }

    let voxelIndex = 0;
    for (let frame = 0; frame < numFrames; frame++) {
      for (let p = 0; p < frameLength; p++) {
        const segmentIndex = volumeVoxelManager.getAtIndex(voxelIndex++) as number;
        if (segmentIndicesSet.has(segmentIndex)) {
          const centroid = centroids.get(segmentIndex);
          centroid.x += p % dimX;
          centroid.y += (p / dimX) | 0;
          centroid.z += frame;
          centroid.count++;
        }
      }
    }

    const result = new Map();
    for (const [index, centroid] of centroids) {
      const count = centroid.count;
      const normalizedCentroid = {
        x: centroid.x / count,
        y: centroid.y / count,
        z: centroid.z / count,
        world: null,
      };
      normalizedCentroid.world = imageData.indexToWorld([
        normalizedCentroid.x,
        normalizedCentroid.y,
        normalizedCentroid.z,
      ]);
      result.set(index, normalizedCentroid);
    }

    this.setCentroids(segmentationId, result);
    return result;
  };

  private setCentroids = (
    segmentationId: string,
    centroids: Map<number, { image: number[]; world?: number[] }>
  ): void => {
    const segmentation = this.getSegmentation(segmentationId);
    const imageData = this.getLabelmapVolume(segmentationId).imageData; // Assuming this method returns imageData

    if (!segmentation.cachedStats) {
      segmentation.cachedStats = { segmentCenter: {} };
    } else if (!segmentation.cachedStats.segmentCenter) {
      segmentation.cachedStats.segmentCenter = {};
    }

    for (const [segmentIndex, centroid] of centroids) {
      let world = centroid.world;

      // If world coordinates are not provided, calculate them
      if (!world || world.length === 0) {
        world = imageData.indexToWorld(centroid.image) as number[];
      }

      segmentation.cachedStats.segmentCenter[segmentIndex] = {
        center: {
          image: centroid.image,
          world: world,
        },
      };
    }

    this.addOrUpdateSegmentation(segmentation, true, true);
  };

  public jumpToSegmentCenter(
    segmentationId: string,
    segmentIndex: number,
    highlightAlpha = 0.9,
    highlightSegment = true,
    animationLength = 750,
    highlightHideOthers = false,
    highlightFunctionType = 'ease-in-out' // todo: make animation functions configurable from outside
  ): void {
    const center = this._getSegmentCenter(segmentationId, segmentIndex);

    if (!center) {
      return;
    }

    const { world, image } = center;

    // need to find which viewports are displaying the segmentation
    const viewportIds = this.getViewportIdsWithSegmentation(segmentationId);

    viewportIds.forEach(viewportId => {
      const { viewport } = getEnabledElementByViewportId(viewportId);

      if (viewport instanceof VolumeViewport) {
        world && cstUtils.viewport.jumpToWorld(viewport, world);
      } else {
        image && viewport.setImageIdIndex(image[2]);
      }

      if (!world && viewport instanceof VolumeViewport) {
        return;
      }
      if (!image && !(viewport instanceof VolumeViewport)) {
        return;
      }

      highlightSegment &&
        this.highlightSegment(
          segmentationId,
          segmentIndex,
          viewportId,
          highlightAlpha,
          animationLength,
          highlightHideOthers,
          highlightFunctionType
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
    highlightFunctionType = 'ease-in-out'
  ): void {
    if (this.highlightIntervalId) {
      clearInterval(this.highlightIntervalId);
    }

    const segmentation = this.getSegmentation(segmentationId);

    const segmentationRepresentation = this._getSegmentationRepresentation(
      segmentationId,
      viewportId
    );

    const { type } = segmentationRepresentation;
    const { segments } = segmentation;

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
      segmentationRepresentation
    );
  }

  private _initSegmentationService() {
    eventTarget.addEventListener(
      csToolsEnums.Events.SEGMENTATION_MODIFIED,
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
  }

  private updateSegmentProperties = async (
    segmentation: SegmentationData,
    segmentationId: string,
    viewportId: string
  ): Promise<void> => {
    for (const segment of segmentation.segments) {
      if (segment == null) {
        continue;
      }

      const { segmentIndex, isLocked, isVisible, opacity } = segment;
      const suppressEvents = true;

      if (opacity !== undefined) {
        await this._setSegmentOpacity(
          segmentationId,
          segmentIndex,
          opacity,
          viewportId,
          suppressEvents
        );
      }

      if (isVisible !== undefined) {
        await this._setSegmentVisibility(
          segmentationId,
          segmentIndex,
          isVisible,
          viewportId,
          suppressEvents
        );
      }

      if (isLocked) {
        await this._setSegmentLockedStatus(segmentationId, segmentIndex, isLocked);
      }
    }
  };

  private getCornerstoneSegmentation(segmentationId: string) {
    return cstSegmentation.state.getSegmentation(segmentationId);
  }

  private _setDisplaySetIsHydrated(displaySetUID: string, isHydrated: boolean): void {
    const { displaySetService } = this.servicesManager.services;
    const displaySet = displaySetService.getDisplaySetByUID(displaySetUID);

    if (!displaySet) {
      return;
    }

    displaySet.isHydrated = isHydrated;
    displaySetService.setDisplaySetMetadataInvalidated(displaySetUID, false);

    this._broadcastEvent(this.EVENTS.SEGMENTATION_MODIFIED, {
      segmentation: this.getSegmentation(displaySetUID),
    });
  }

  private _highlightLabelmap(
    segmentIndex: number,
    alpha: number,
    hideOthers: boolean,
    segments: Segment[],
    viewportId: string,
    animationLength: number,
    segmentationRepresentation: cstTypes.SegmentationRepresentation
  ) {
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

    const { fillAlpha } = this.getConfiguration(viewportId) || {};

    let startTime: number = null;
    const animation = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationLength, 1);

      cstSegmentation.config.setSegmentIndexConfig(
        segmentationRepresentation.segmentationRepresentationUID,
        segmentIndex,
        {
          fillAlpha: easeInOutBell(progress, fillAlpha),
        }
      );

      if (progress < 1) {
        requestAnimationFrame(animation);
      } else {
        cstSegmentation.config.setSegmentIndexConfig(
          segmentationRepresentation.segmentationRepresentationUID,
          segmentIndex,
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
    segmentationRepresentation: cstTypes.SegmentationRepresentation
  ) {
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const progress = (currentTime - startTime) / animationLength;
      if (progress >= 1) {
        cstSegmentation.config.setSegmentIndexConfig(
          segmentationRepresentation.segmentationRepresentationUID,
          segmentIndex,
          {}
        );
        return;
      }

      const reversedProgress = reverseEaseInOutBell(progress, 0.1);
      cstSegmentation.config.setSegmentIndexConfig(
        segmentationRepresentation.segmentationRepresentationUID,
        segmentIndex,
        {
          [segmentIndex]: {
            [CONTOUR]: {
              outlineOpacity: reversedProgress,
              fillAlpha: reversedProgress,
            },
          },
        }
      );

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  private _toggleSegmentationVisibility = (segmentationId: string, suppressEvents = false) => {
    const segmentation = this.segmentationRepresentations[segmentationId];

    if (!segmentation) {
      throw new Error(`Segmentation with segmentationId ${segmentationId} not found.`);
    }

    segmentation.isVisible = !segmentation.isVisible;

    this._updateCornerstoneSegmentationVisibility(segmentationId);

    if (suppressEvents === false) {
      this._broadcastEvent(this.EVENTS.SEGMENTATION_MODIFIED, {
        segmentation,
      });
    }
  };

  private _setActiveSegment(segmentationId: string, segmentIndex: number) {
    cstSegmentation.segmentIndex.setActiveSegmentIndex(segmentationId, segmentIndex);
  }

  private _getSegmentInfo(segmentation: SegmentationData, segmentIndex: number) {
    const segments = segmentation.segments;

    if (!segments) {
      return;
    }

    if (segments && segments.length > 0) {
      return segments[segmentIndex];
    }
  }

  private _getVolumeIdForDisplaySet(displaySet) {
    const volumeLoaderSchema = displaySet.volumeLoaderSchema ?? VOLUME_LOADER_SCHEME;

    return `${volumeLoaderSchema}:${displaySet.displaySetInstanceUID}`;
  }

  private _getSegmentCenter(segmentationId, segmentIndex) {
    const segmentations = this.getSegmentationsInfo({ segmentationId });
    const { segmentation } = segmentations[0];

    if (!segmentation) {
      return;
    }

    const { segments } = segmentation;

    const { cachedStats } = segments[segmentIndex];

    if (!cachedStats) {
      return;
    }

    const { center } = cachedStats;

    return center;
  }

  private _setSegmentLockedStatus(segmentationId: string, segmentIndex: number, isLocked: boolean) {
    cstSegmentation.segmentLocking.setSegmentIndexLocked(segmentationId, segmentIndex, isLocked);
  }

  private _setSegmentVisibility(
    segmentationId: string,
    segmentIndex: number,
    isVisible: boolean,
    viewportId?: string,
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

  private _setSegmentOpacity = (
    segmentationId: string,
    segmentIndex: number,
    opacity: number,
    viewportId: string
  ) => {
    const segmentationRepresentation = this._getSegmentationRepresentation(
      segmentationId,
      viewportId
    );

    if (!segmentationRepresentation) {
      throw new Error('Must add representation to viewport before setting segments');
    }

    const rgbaColor = cstSegmentation.config.color.getSegmentIndexColor(
      viewportId,
      segmentationId,
      segmentIndex
    );

    cstSegmentation.config.color.setSegmentIndexColor(viewportId, segmentationId, segmentIndex, [
      rgbaColor[0],
      rgbaColor[1],
      rgbaColor[2],
      opacity,
    ]);
  };

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

  private _setSegmentationConfig = (property, value) => {
    // Todo: currently we only support global config, and we get the type
    // from the first segmentation
    const typeToUse = this.getSegmentationRepresentations()[0].type;

    const { cornerstoneViewportService } = this.servicesManager.services;

    const config = cstSegmentation.config.getGlobalConfig();

    config.representations[typeToUse][property] = value;

    // Todo: add non global (representation specific config as well)
    cstSegmentation.config.setGlobalConfig(config);

    const renderingEngine = cornerstoneViewportService.getRenderingEngine();
    const viewportIds = cornerstoneViewportService.getViewportIds();

    renderingEngine.renderViewports(viewportIds);
  };

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

  private _removeSegmentationFromCornerstone(segmentationId: string) {
    // TODO: This should be from the configuration
    const removeFromCache = true;
    const segmentationState = cstSegmentation.state;
    const sourceSegState = segmentationState.getSegmentation(segmentationId);
    const updatedViewportIds: Set<string> = new Set();

    if (!sourceSegState) {
      return;
    }

    const viewportIds = segmentationState.getViewportIdsWithSegmentation(segmentationId);

    viewportIds.forEach(viewportId => {
      const segmentationRepresentations =
        segmentationState.getSegmentationRepresentations(viewportId);

      const UIDsToRemove = [];
      segmentationRepresentations.forEach(representation => {
        if (representation.segmentationId === segmentationId) {
          UIDsToRemove.push(representation.segmentationRepresentationUID);
          updatedViewportIds.add(viewportId);
        }
      });

      // remove segmentation representations
      cstSegmentation.removeSegmentationRepresentations(
        viewportId,
        UIDsToRemove,
        true // immediate
      );
    });

    // cleanup the segmentation state too
    segmentationState.removeSegmentation(segmentationId);

    if (removeFromCache && cache.getVolumeLoadObject(segmentationId)) {
      cache.removeVolumeLoadObject(segmentationId);
    }

    return { updatedViewportIds: [...updatedViewportIds] };
  }

  private _updateCornerstoneSegmentationVisibility = segmentationId => {
    const segmentationState = cstSegmentation.state;
    const viewportIds = segmentationState.getViewportIdsWithSegmentation(segmentationId);

    viewportIds.forEach(viewportId => {
      const segmentationRepresentations =
        cstSegmentation.state.getSegmentationRepresentations(viewportId);

      if (segmentationRepresentations.length === 0) {
        return;
      }

      // Todo: this finds the first segmentation representation that matches the segmentationId
      // If there are two labelmap representations from the same segmentation, this will not work
      const representation = segmentationRepresentations.find(
        representation => representation.segmentationId === segmentationId
      );

      const segmentsHidden = cstSegmentation.config.visibility.getHiddenSegmentIndices(
        viewportId,
        representation.segmentationRepresentationUID
      );
      const currentVisibility = segmentsHidden.size === 0 ? true : false;
      const newVisibility = !currentVisibility;

      cstSegmentation.config.visibility.setSegmentationRepresentationVisibility(
        viewportId,
        representation.segmentationRepresentationUID,
        newVisibility
      );

      // update segments visibility
      const { segmentation } = this._getSegmentationInfo(segmentationId, viewportId);

      const segments = segmentation.segments.filter(Boolean);

      segments.forEach(segment => {
        segment.isVisible = newVisibility;
      });
    });
  };
}

export default SegmentationService;
export { EVENTS, VALUE_TYPES };
