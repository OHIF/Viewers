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
  VolumeViewport3D,
} from '@cornerstonejs/core';
import {
  Enums as csToolsEnums,
  segmentation as cstSegmentation,
  Types as cstTypes,
} from '@cornerstonejs/tools';
import { PubSubService, Types as OHIFTypes } from '@ohif/core';
import { easeInOutBell, reverseEaseInOutBell } from '../../utils/transitions';
import { mapROIContoursToRTStructData } from './RTSTRUCT/mapROIContoursToRTStructData';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import { addColorLUT } from '@cornerstonejs/tools/segmentation/addColorLUT';
import { getNextColorLUTIndex } from '@cornerstonejs/tools/segmentation/getNextColorLUTIndex';
import { Segment } from '@cornerstonejs/tools/types/SegmentationStateTypes';
import { ContourStyle, LabelmapStyle, SurfaceStyle } from '@cornerstonejs/tools/types';
import { getSegmentation } from '@cornerstonejs/tools/segmentation/getSegmentation';
import { MetadataModules } from '@cornerstonejs/core/enums';
import { ImagePlaneModuleMetadata } from '@cornerstonejs/core/types';
import { SegmentationPresentation } from '../../types/Presentation';

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

  private _segmentationIdToColorLUTIndexMap: Map<string, number>;
  private _removedDisplaySetAndRepresentationMaps: Map<
    string,
    {
      segmentationId: string;
      type: SegmentationRepresentations;
    }[]
  >;
  readonly servicesManager: AppTypes.ServicesManager;
  highlightIntervalId = null;
  readonly EVENTS = EVENTS;

  constructor({ servicesManager }) {
    super(EVENTS);

    this._segmentationIdToColorLUTIndexMap = new Map();
    this._removedDisplaySetAndRepresentationMaps = new Map();

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

  public getPresentation(viewportId, presentationId: string): SegmentationPresentation {
    const segmentationPresentations: SegmentationPresentation = [];
    const segmentations = this.getSegmentationsInfo({ viewportId });
    for (const segmentation of segmentations) {
      const { segmentationId } = segmentation.segmentation;
      const representation = segmentation.representation;

      if (!representation) {
        continue;
      }

      const { type } = representation;

      segmentationPresentations.push({
        segmentationId,
        type,
        hydrated: true,
        config: representation.config || {},
      });
    }

    // check inside the removedDisplaySetAndRepresentationMaps to see if any of the representations are not hydrated
    const removedRepresentations = this._removedDisplaySetAndRepresentationMaps.get(presentationId);

    if (removedRepresentations) {
      removedRepresentations.forEach(rep => {
        segmentationPresentations.push({
          segmentationId: rep.segmentationId,
          type: rep.type,
          hydrated: false,
          config: rep.config || {},
        });
      });
    }

    return segmentationPresentations;
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
  }): Promise<void> => {
    const segmentation = this.getSegmentationsInfo({ segmentationId });

    if (!segmentation) {
      throw new Error(`Segmentation with segmentationId ${segmentationId} not found.`);
    }

    this._updateRemovedDisplaySetAndRepresentationMaps(
      viewportId,
      [{ segmentationId, type: representationType }],
      true // isAdding
    );

    // does color lut exist in the
    const colorLUTIndex = this._segmentationIdToColorLUTIndexMap.get(segmentationId);

    // if the viewport is 3d viewport and is asked for a labelmap, add a surface instead
    // Todo: move this
    const csViewport =
      this.servicesManager.services.cornerstoneViewportService.getCornerstoneViewport(viewportId);
    const is3DVolumeViewport = csViewport instanceof VolumeViewport3D;
    const representationTypeToUse = is3DVolumeViewport
      ? SegmentationRepresentations.Surface
      : representationType;

    cstSegmentation.addSegmentationRepresentations(viewportId, [
      {
        type: representationTypeToUse,
        segmentationId,
        config: {
          colorLUTOrIndex: colorLUTIndex,
        },
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
        },
      };
    });

    // get next color lut index
    const colorLUTIndex = getNextColorLUTIndex();
    addColorLUT(colorLUT, colorLUTIndex);
    this._segmentationIdToColorLUTIndexMap.set(segmentationId, colorLUTIndex);

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
          referencedImageIds: imageIds as string[],
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
      },
    };

    if (!structureSet.ROIContours?.length) {
      throw new Error(
        'The structureSet does not contain any ROIContours. Please ensure the structureSet is loaded first.'
      );
    }

    const segments: { [segmentIndex: string]: cstTypes.Segment } = {};
    let segmentsCachedStats = {};

    // Process each segment similarly to the SEG function
    for (const rtStructData of allRTStructData) {
      const { data, id, color, segmentIndex, geometryId } = rtStructData;

      try {
        const geometry = await geometryLoader.createAndCacheLocalGeometry(geometryId, {
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

  public getActiveSegmentation(viewportId: string): string | null {
    return cstSegmentation.activeSegmentation.getActiveSegmentation(viewportId)?.segmentationId;
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
   *     - opacity: (optional) The opacity of the new segment. If not provided, a default opacity will be used.
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
    } = {}
  ): void {
    if (config?.segmentIndex === 0) {
      throw new Error('Segment index 0 is reserved for "no label"');
    }

    const csSegmentation = this.getCornerstoneSegmentation(segmentationId);

    let segmentIndex = config.segmentIndex;
    if (!segmentIndex) {
      // grab the next available segment index based on the object keys,
      // so basically get the highest segment index value + 1
      segmentIndex = Math.max(...Object.keys(csSegmentation.segments).map(Number)) + 1;
    }

    // update the segmentation
    if (!config.label) {
      config.label = `Segment ${segmentIndex}`;
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
              ...config,
            },
          },
        },
      },
    ]);

    this.setActiveSegment(segmentationId, segmentIndex);

    if (config.isLocked !== undefined) {
      this._setSegmentLockedStatus(segmentationId, segmentIndex, config.isLocked);
    }
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

  public toggleSegmentVisibility(viewportId, segmentationId: string, segmentIndex: number): void {
    const isVisible = cstSegmentation.config.visibility.getSegmentIndexVisibility(
      viewportId,
      {
        segmentationId,
        type: LABELMAP,
      },
      segmentIndex
    );
    this._setSegmentVisibility(viewportId, segmentationId, segmentIndex, !isVisible);
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
    this._setActiveSegment(segmentationId, segmentIndex);
  }

  public setRenderInactiveSegmentations(viewportId: string, renderInactive: boolean): void {
    cstSegmentation.config.style.setRenderInactiveSegmentations(viewportId, renderInactive);
  }

  public getRenderInactiveSegmentations(viewportId: string): boolean {
    return cstSegmentation.config.style.getRenderInactiveSegmentations(viewportId);
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

  /**
   * Toggles the visibility of a segmentation in the state, and broadcasts the event.
   * Note: this method does not update the segmentation state in the source. It only
   * updates the state, and there should be separate listeners for that.
   * @param ids segmentation ids
   */
  public toggleSegmentationVisibility = (viewportId: string, segmentationId: string): void => {
    this._toggleSegmentationVisibility(viewportId, segmentationId);
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
    this.removeSegmentationRepresentations(viewportId, { isCleanUp: true });
  }

  /**
   * It removes the segmentation representations from the viewport.
   * @param viewportId - The viewport id to remove the segmentation representations from.
   * @param specifier - The specifier to remove the segmentation representations.
   * @param isCleanUp - If true, it will not update the removed display set and representation maps.
   */
  public removeSegmentationRepresentations(
    viewportId: string,
    specifier: {
      segmentationId?: string;
      type?: SegmentationRepresentations;
      isCleanUp?: boolean;
    } = {}
  ): void {
    const removedSegRepresentations = cstSegmentation.removeSegmentationRepresentations(
      viewportId,
      specifier
    );

    if (!specifier.isCleanUp) {
      this._updateRemovedDisplaySetAndRepresentationMaps(
        viewportId,
        removedSegRepresentations.map(({ segmentationId, type }) => ({ segmentationId, type })),
        false // isAdding (i.e., removing)
      );
    }
  }

  public getSegmentation(segmentationId: string) {
    return cstSegmentation.state.getSegmentation(segmentationId);
  }

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

    const { world } = center;

    // need to find which viewports are displaying the segmentation
    const viewportIds = this.getViewportIdsWithSegmentation(segmentationId);

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
          highlightHideOthers
        );
    });
  }

  public highlightSegment(
    segmentationId: string,
    segmentIndex: number,
    viewportId?: string,
    alpha = 0.9,
    animationLength = 750,
    hideOthers = true
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
        representation
      );
    });
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

    eventTarget.addEventListener(
      csToolsEnums.Events.SEGMENTATION_REPRESENTATION_REMOVED,
      this._onSegmentationRepresentationModifiedFromSource
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
    representation: cstTypes.SegmentationRepresentation
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

      cstSegmentation.config.style.setStyle(
        {
          segmentationId,
          segmentIndex,
          type: LABELMAP,
        },
        {
          fillAlpha: easeInOutBell(progress, fillAlpha),
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
    representation: cstTypes.SegmentationRepresentation
  ) {
    const { segmentationId } = representation;
    const startTime = performance.now();

    const prevStyle = cstSegmentation.config.style.getStyle({
      viewportId,
      segmentationId,
      type: CONTOUR,
      segmentIndex,
    }) as ContourStyle;

    const prevOutlineWidth = prevStyle.outlineWidth;
    // make this configurable
    const baseline = Math.max(prevOutlineWidth * 3.5, 5);

    const animate = (currentTime: number) => {
      const progress = (currentTime - startTime) / animationLength;
      if (progress >= 1) {
        cstSegmentation.config.style.setStyle(
          {
            segmentationId,
            segmentIndex,
            type: CONTOUR,
          },
          {}
        );
        return;
      }

      const reversedProgress = reverseEaseInOutBell(progress, baseline);

      cstSegmentation.config.style.setStyle(
        {
          segmentationId,
          segmentIndex,
          type: CONTOUR,
        },
        {
          outlineWidth: reversedProgress,
        }
      );

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Sets the visibility of a segmentation representation.
   *
   * @param viewportId - The ID of the viewport.
   * @param segmentationId - The ID of the segmentation.
   * @param isVisible - The new visibility state.
   */
  public setSegmentationVisibility(
    viewportId: string,
    segmentationId: string,
    isVisible: boolean
  ): void {
    const representations = this.getSegmentationRepresentations(viewportId, { segmentationId });
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
      },
      isVisible
    );
  }

  /**
   * Gets the visibility of a segmentation representation.
   *
   * @param viewportId - The ID of the viewport.
   * @param segmentationId - The ID of the segmentation.
   * @returns The visibility state of the segmentation, or undefined if not found.
   */
  public getSegmentationVisibility(
    viewportId: string,
    segmentationId: string
  ): boolean | undefined {
    const representations = this.getSegmentationRepresentations(viewportId, { segmentationId });
    const representation = representations[0];

    if (!representation) {
      console.debug(
        'No segmentation representation found for the given viewportId and segmentationId'
      );
      return undefined;
    }

    const segmentsHidden = cstSegmentation.config.visibility.getHiddenSegmentIndices(viewportId, {
      segmentationId,
      type: representation.type,
    });

    return segmentsHidden.size === 0;
  }

  public getSegmentationFrameOfReferenceUID(segmentationId: string) {
    const csSegmentation = getSegmentation(segmentationId);

    const labelmapData = csSegmentation.representationData[SegmentationRepresentations.Labelmap];

    const { imageIds } = labelmapData;

    if (imageIds) {
      const imageId = imageIds[0];
      const csImage = cache.getImage(imageId);
      const referencedImageId = csImage.referencedImageId;
      const imagePlaneModule = metaData.get(
        MetadataModules.IMAGE_PLANE,
        referencedImageId
      ) as ImagePlaneModuleMetadata;

      return imagePlaneModule.frameOfReferenceUID;
    }
  }

  private _toggleSegmentationVisibility = (viewportId: string, segmentationId: string): void => {
    const representations = this.getSegmentationRepresentations(viewportId, { segmentationId });
    const representation = representations[0];

    const segmentsHidden = cstSegmentation.config.visibility.getHiddenSegmentIndices(viewportId, {
      segmentationId,
      type: representation.type,
    });

    const currentVisibility = segmentsHidden.size === 0;
    this.setSegmentationVisibility(viewportId, segmentationId, !currentVisibility);
  };

  private _setActiveSegment(segmentationId: string, segmentIndex: number) {
    cstSegmentation.segmentIndex.setActiveSegmentIndex(segmentationId, segmentIndex);
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

  // Add this new method to the SegmentationService class

  private _updateRemovedDisplaySetAndRepresentationMaps(
    viewportId: string,
    segmentations: Array<{ segmentationId: string; type: SegmentationRepresentations }>,
    isAdding: boolean
  ): void {
    if (!segmentations.length) {
      return;
    }

    const { viewportGridService } = this.servicesManager.services;
    const viewportState = viewportGridService.getViewportState(viewportId);
    const { presentationIds } = viewportState.viewportOptions;
    const presentationId = presentationIds.segmentationPresentationId;

    if (isAdding) {
      // Logic for adding
      if (this._removedDisplaySetAndRepresentationMaps.has(presentationId)) {
        const representations = this._removedDisplaySetAndRepresentationMaps.get(presentationId);
        segmentations.forEach(({ segmentationId, type }) => {
          const index = representations.findIndex(
            rep => rep.segmentationId === segmentationId && rep.type === type
          );
          if (index !== -1) {
            representations.splice(index, 1);
          }
        });
        if (representations.length === 0) {
          this._removedDisplaySetAndRepresentationMaps.delete(presentationId);
        }
      }
    } else {
      // Logic for removing
      if (!this._removedDisplaySetAndRepresentationMaps.has(presentationId)) {
        this._removedDisplaySetAndRepresentationMaps.set(presentationId, []);
      }
      const representations = this._removedDisplaySetAndRepresentationMaps.get(presentationId);
      representations.push(...segmentations);
    }
  }
}

export default SegmentationService;
export { EVENTS, VALUE_TYPES };
