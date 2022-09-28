import cloneDeep from 'lodash.clonedeep';

import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import { pubSubServiceInterface } from '@ohif/core';
import {
  utilities as cstUtils,
  segmentation as cstSegmentation,
  CONSTANTS as cstConstants,
  Enums as cstEnums,
  Types as cstTypes,
} from '@cornerstonejs/tools';
import {
  eventTarget,
  cache,
  utilities as csUtils,
  volumeLoader,
  Types,
} from '@cornerstonejs/core';
import { Enums as csToolsEnums } from '@cornerstonejs/tools';

const { COLOR_LUT } = cstConstants;

type SegmentationConfig = cstTypes.LabelmapTypes.LabelmapConfig;

type Segment = {
  // the label for the segment
  label: string;
  // the index of the segment in the segmentation
  segmentIndex: number;
  // the color of the segment
  color: Types.Point3;
  // the opacity of the segment
  opacity: number;
  // whether the segment is visible
  isVisible: boolean;
  // whether the segment is locked
  isLocked: boolean;
};

type Segmentation = {
  // active segment index is the index of the segment that is currently being edited.
  activeSegmentIndex: number;
  // colorLUTIndex is the index of the color LUT that is currently being used.
  colorLUTIndex: number;
  // if segmentation contains any data (often calculated from labelmap)
  cachedStats: Record<string, any>;
  // displayText is the text that is displayed on the segmentation panel (often derived from the data)
  displayText: string;
  // the id of the segmentation
  id: string;
  // if the segmentation is the active segmentation being used in the viewer
  isActive: boolean;
  // if the segmentation is visible in the viewer
  isVisible: boolean;
  // the label of the segmentation
  label: string;
  // the number of segments in the segmentation
  segmentCount: number;
  // the array of segments with their details
  segments: Segment[];
  // the set of segments that are locked
  segmentsLocked: Set<number>;
  // the segmentation representation type
  type: cstEnums.SegmentationRepresentations;
  // if labelmap, the id of the volume that the labelmap is associated with
  volumeId?: string;
};

const EVENTS = {
  // fired when the segmentation is updated (e.g. when a segment is added, removed, or modified, locked, visibility changed etc.)
  SEGMENTATION_UPDATED: 'event::segmentation_updated',
  // fired when the segmentation data (e.g., labelmap pixels) is modified
  SEGMENTATION_DATA_MODIFIED: 'event::segmentation_data_modified',
  // fired when the segmentation is added to the cornerstone
  SEGMENTATION_ADDED: 'event::segmentation_added',
  // fired when the segmentation is removed
  SEGMENTATION_REMOVED: 'event::segmentation_removed',
  // fired when the configuration for the segmentation is changed (e.g., brush size, render fill, outline thickness, etc.)
  SEGMENTATION_CONFIGURATION_CHANGED:
    'event::segmentation_configuration_changed',
};

const VALUE_TYPES = {};

class SegmentationService {
  listeners = {};
  segmentations: Record<string, Segmentation>;
  servicesManager = null;
  _broadcastEvent: (eventName: string, callbackProps: any) => void;
  readonly EVENTS = EVENTS;

  private _suppressSegmentationModified = false;

  constructor({ servicesManager }) {
    this.segmentations = {};
    this.listeners = {};

    Object.assign(this, pubSubServiceInterface);

    this.servicesManager = servicesManager;

    this.initSegmentationService();
  }

  public destroy = () => {
    eventTarget.removeEventListener(
      csToolsEnums.Events.SEGMENTATION_MODIFIED,
      this._onSegmentationModified
    );

    eventTarget.removeEventListener(
      csToolsEnums.Events.SEGMENTATION_DATA_MODIFIED,
      this._onSegmentationDataModified
    );
  };

  public addSegmentToSegmentation(
    segmentationId: string,
    segmentIndex: number,
    label: string,
    properties?: {
      color?: Types.Point3;
      opacity?: number;
      visibility?: boolean;
      isLocked?: boolean;
      active?: boolean;
    }
  ): void {
    if (segmentIndex === 0) {
      throw new Error('Segment index 0 is reserved for "no label"');
    }

    const {
      segmentationRepresentationUID,
      segmentation,
      toolGroupId,
    } = this._getSegmentationInfo(segmentationId);

    const rgbaColor = cstSegmentation.config.color.getColorForSegmentIndex(
      toolGroupId,
      segmentationRepresentationUID,
      segmentIndex
    );

    segmentation.segments[segmentIndex] = {
      label,
      segmentIndex: segmentIndex,
      color: [rgbaColor[0], rgbaColor[1], rgbaColor[2]],
      opacity: rgbaColor[3],
      isVisible: true,
      isLocked: false,
    };

    segmentation.segmentCount++;

    const suppressEvents = true;
    if (properties !== undefined) {
      const {
        color: newColor,
        opacity,
        isLocked,
        visibility,
        active,
      } = properties;

      if (newColor !== undefined) {
        this._setSegmentColorForSegmentation(
          segmentationId,
          segmentIndex,
          newColor,
          suppressEvents
        );
      }

      if (opacity !== undefined) {
        this._setSegmentOpacityForSegmentation(
          segmentationId,
          segmentIndex,
          opacity,
          suppressEvents
        );
      }

      if (visibility !== undefined) {
        this._setSegmentVisibilityForSegmentation(
          segmentationId,
          segmentIndex,
          visibility,
          suppressEvents
        );
      }

      if (active !== undefined) {
        this._setActiveSegmentForSegmentation(
          segmentationId,
          segmentIndex,
          suppressEvents
        );
      }

      if (isLocked !== undefined) {
        this._setSegmentLockedForSegmentation(
          segmentationId,
          segmentIndex,
          isLocked,
          suppressEvents
        );
      }
    }

    if (segmentation.activeSegmentIndex === null) {
      this._setActiveSegmentForSegmentation(
        segmentationId,
        segmentIndex,
        suppressEvents
      );
    }

    this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
      segmentation,
    });
  }

  public removeSegmentFromSegmentation(
    segmentationId: string,
    segmentIndex: number
  ): void {
    const segmentation = this.getSegmentation(segmentationId);

    if (segmentation === undefined) {
      throw new Error(`no segmentation for segmentationId: ${segmentationId}`);
    }

    if (segmentIndex === 0) {
      throw new Error('Segment index 0 is reserved for "no label"');
    }

    if (segmentation.segments[segmentIndex] === undefined) {
      return;
    }

    segmentation.segmentCount--;

    delete segmentation.segments[segmentIndex];

    // Get volume and delete the labels
    const labelmapVolume = this.getLabelmapVolume(segmentationId);

    const { scalarData, dimensions } = labelmapVolume;

    // Set all values of this segment to zero and get which frames have been edited.
    const frameLength = dimensions[0] * dimensions[1];
    const numFrames = dimensions[2];

    let voxelIndex = 0;

    const modifiedFrames = new Set() as Set<number>;

    for (let frame = 0; frame < numFrames; frame++) {
      for (let p = 0; p < frameLength; p++) {
        if (scalarData[voxelIndex] === segmentIndex) {
          scalarData[voxelIndex] = 0;
          modifiedFrames.add(frame);
        }

        voxelIndex++;
      }
    }

    const modifiedFramesArray: number[] = Array.from(modifiedFrames);

    // Trigger texture update of modified segmentation frames.
    cstSegmentation.triggerSegmentationEvents.triggerSegmentationDataModified(
      segmentationId,
      modifiedFramesArray
    );

    if (segmentation.activeSegmentIndex === segmentIndex) {
      const segmentIndices = Object.keys(segmentation.segments);

      const newActiveSegmentIndex = segmentIndices.length
        ? Number(segmentIndices[0])
        : 1;

      this._setActiveSegmentForSegmentation(
        segmentationId,
        newActiveSegmentIndex,
        true
      );
    }

    this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
      segmentation,
    });
  }

  public setSegmentVisibilityForSegmentation(
    segmentationId: string,
    segmentIndex: number,
    isVisible: boolean
  ): void {
    this._setSegmentVisibilityForSegmentation(
      segmentationId,
      segmentIndex,
      isVisible,
      false
    );
  }

  public setSegmentLockedForSegmentation(
    segmentationId: string,
    segmentIndex: number,
    isLocked: boolean
  ): void {
    this._setSegmentLockedForSegmentation(
      segmentationId,
      segmentIndex,
      isLocked,
      false
    );
  }

  public setSegmentLabelForSegmentation(
    segmentationId: string,
    segmentIndex: number,
    label: string
  ): void {
    this._setSegmentLabelForSegmentation(segmentationId, segmentIndex, label);
  }

  public setSegmentColorForSegmentation(
    segmentationId: string,
    segmentIndex: number,
    color: Types.Point3
  ): void {
    this._setSegmentColorForSegmentation(segmentationId, segmentIndex, color);
  }

  public setSegmentRGBAForSegmentation = (
    segmentationId: string,
    segmentIndex: number,
    rgbaColor: cstTypes.Color
  ): void => {
    const segmentation = this.getSegmentation(segmentationId);

    if (segmentation === undefined) {
      throw new Error(`no segmentation for segmentationId: ${segmentationId}`);
    }

    const suppressEvents = true;
    this._setSegmentOpacityForSegmentation(
      segmentationId,
      segmentIndex,
      rgbaColor[3],
      suppressEvents
    );

    this._setSegmentColorForSegmentation(
      segmentationId,
      segmentIndex,
      [rgbaColor[0], rgbaColor[1], rgbaColor[2]],
      suppressEvents
    );

    this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
      segmentation,
    });
  };

  public setSegmentOpacityForSegmentation(
    segmentationId: string,
    segmentIndex: number,
    opacity: number
  ): void {
    this._setSegmentOpacityForSegmentation(
      segmentationId,
      segmentIndex,
      opacity
    );
  }

  public setActiveSegmentationForToolGroup(
    segmentationId: string,
    toolGroupId?: string
  ): void {
    if (toolGroupId === undefined) {
      toolGroupId = this.getToolGroupId();
    }

    this._setActiveSegmentationForToolGroup(segmentationId, toolGroupId, false);
  }

  private getSegmentationRepresentation(segmentationId, toolGroupId) {
    const segmentationRepresentations = cstSegmentation.state.getSegmentationRepresentations(
      toolGroupId
    );

    if (segmentationRepresentations.length === 0) {
      return;
    }
    // Todo: this finds the first segmentation representation that matches the segmentationId
    // If there are two labelmap representations from the same segmentation, this will not work
    const representation = segmentationRepresentations.find(
      representation => representation.segmentationId === segmentationId
    );

    return representation;
  }

  public setActiveSegmentForSegmentation(
    segmentationId: string,
    segmentIndex: number
  ): void {
    this._setActiveSegmentForSegmentation(segmentationId, segmentIndex, false);
  }

  /**
   * Get all segmentations.
   *
   * @return Array of segmentations
   */
  public getSegmentations(): Segmentation[] {
    const segmentations = this.arrayOfObjects(this.segmentations);
    return (
      segmentations &&
      segmentations.map(m => this.segmentations[Object.keys(m)[0]])
    );
  }

  /**
   * Get specific segmentation by its id.
   *
   * @param segmentationId If of the segmentation
   * @return segmentation instance
   */
  public getSegmentation(segmentationId: string): Segmentation {
    return this.segmentations[segmentationId];
  }

  public addOrUpdateSegmentation(
    segmentationSchema,
    notYetUpdatedAtSource = false
  ) {
    const { id: segmentationId } = segmentationSchema;
    let segmentation = this.segmentations[segmentationId];

    if (segmentation) {
      // Update the segmentation (mostly for assigning metadata/labels)
      Object.assign(segmentation, segmentationSchema);

      this.updateCornerstoneSegmentations({
        segmentationId,
        notYetUpdatedAtSource,
      });

      this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
        segmentation,
      });
    } else {
      // Add the segmentation
      cstSegmentation.addSegmentations([
        {
          segmentationId,
          representation: {
            // The type of segmentation
            type: csToolsEnums.SegmentationRepresentations.Labelmap,
            // The actual segmentation data, in the case of labelmap this is a
            // reference to the source volume of the segmentation.
            // TODO: will need to generalise this when we have segmentations
            // other than labelmaps.
            data: {
              volumeId: segmentationId,
            },
          },
        },
      ]);

      // Define a new color LUT and associate it with this segmentation.
      const newColorLUT = this.generateNewColorLUT();
      const newColorLUTIndex = this.getNextColorLUTIndex();

      cstSegmentation.config.color.addColorLUT(newColorLUT, newColorLUTIndex);

      if (
        segmentationSchema.label === undefined ||
        segmentationSchema.label === ''
      ) {
        segmentationSchema.label = 'Segmentation';
      }

      this.segmentations[segmentationId] = {
        ...segmentationSchema,
        segments: [],
        activeSegmentIndex: null,
        segmentCount: 0,
        // Default to false, consumer should set it active using the API, may be adding lots of segmentations at once.
        isActive: false,
        colorLUTIndex: newColorLUTIndex,
        isVisible: true,
        modified: false,
      };

      segmentation = this.segmentations[segmentationId];

      this.updateCornerstoneSegmentations({
        segmentationId,
        notYetUpdatedAtSource: true,
      });

      this._broadcastEvent(this.EVENTS.SEGMENTATION_ADDED, {
        segmentation,
      });
    }
  }

  public createSegmentationForDisplaySet = async (
    displaySetInstanceUID: string,
    options?: { segmentationId: string; label: string }
  ): Promise<string> => {
    const volumeId = displaySetInstanceUID;

    const segmentationId = options?.segmentationId ?? `${csUtils.uuidv4()}`;

    // Force use of a Uint8Array SharedArrayBuffer for the segmentation to save space and so
    // it is easily compressible in worker thread.
    const derivedVolume = await volumeLoader.createAndCacheDerivedVolume(
      volumeId,
      {
        volumeId: segmentationId,
        targetBuffer: {
          type: 'Uint8Array',
        },
      }
    );

    // Force use of a shared array buffer
    const sab = csUtils.createUint8SharedArray(derivedVolume.scalarData.length);

    const scalarArray = vtkDataArray.newInstance({
      name: 'Pixels',
      numberOfComponents: 1,
      values: sab,
    });

    derivedVolume.scalarData = sab;
    derivedVolume.imageData.getPointData().setScalars(scalarArray);

    const segmentationSchema = {
      id: segmentationId,
      volumeId: segmentationId,
    };

    if (options?.label !== undefined) {
      // @ts-ignore
      segmentationSchema.label = options.label;
    }

    this.addOrUpdateSegmentation(segmentationSchema);

    return segmentationId;
  };

  /**
   * Toggles the visibility of a segmentation in the state, and broadcasts the event.
   * Note: this method does not update the segmentation state in the source. It only
   * updates the state, and there should be separate listeners for that.
   * @param ids segmentation ids
   */
  public toggleSegmentationVisibility = (segmentationId: string): void => {
    this._toggleSegmentationVisibility(segmentationId, false);
  };

  public addSegmentationRepresentationToToolGroup = async (
    toolGroupId: string,
    segmentationId: string,
    representationType = cstEnums.SegmentationRepresentations.Labelmap
  ): Promise<void> => {
    const segmentation = this.getSegmentation(segmentationId);

    if (!segmentation) {
      throw new Error(
        `Segmentation with segmentationId ${segmentationId} not found.`
      );
    }

    const { colorLUTIndex } = segmentation;

    // Based on the segmentationId, set the colorLUTIndex.
    const segmentationRepresentationUIDs = await cstSegmentation.addSegmentationRepresentations(
      toolGroupId,
      [
        {
          segmentationId,
          type: representationType,
        },
      ]
    );

    cstSegmentation.config.color.setColorLUT(
      toolGroupId,
      segmentationRepresentationUIDs[0],
      colorLUTIndex
    );
  };

  /**
   * Removes a segmentation and broadcasts the removed event.
   *
   * @param {string} segmentationId The segmentation id
   */
  public remove(segmentationId: string) {
    const segmentation = this.segmentations[segmentationId];
    const wasActive = segmentation.isActive;

    if (!segmentationId || !segmentation) {
      console.warn(
        `No segmentationId provided, or unable to find segmentation by id.`
      );
      return;
    }

    const { colorLUTIndex } = segmentation;

    this.removeSegmentationFromCornerstone(segmentationId);

    // Delete associated colormap
    // Todo: bring this back
    // cstSegmentation.state.removeColorLUT(colorLUTIndex);

    delete this.segmentations[segmentationId];

    // If this segmentation was active, and there is another segmentation, set another one active.

    if (wasActive) {
      const remainingSegmentations = this.getSegmentations();

      if (remainingSegmentations.length) {
        const { id } = remainingSegmentations[0];

        this._setActiveSegmentationForToolGroup(
          id,
          this.getToolGroupId(),
          false
        );
      }
    }

    this._broadcastEvent(this.EVENTS.SEGMENTATION_REMOVED, {
      segmentationId,
    });
  }

  public getConfiguration = (): SegmentationConfig => {
    // TODO: Need to think hot to generalize this. Takes first toolgroup
    // to get brush info. Brush info _should_ be per tool group, so need to think
    // about how we do this for multiple tool groups.
    const firstToolGroupId = this.getToolGroupId();

    let brushSize;
    let brushThresholdGate;

    if (firstToolGroupId) {
      brushSize = cstUtils.segmentation.getBrushSizeForToolGroup(
        firstToolGroupId
      );

      brushThresholdGate = cstUtils.segmentation.getBrushThresholdForToolGroup(
        firstToolGroupId
      );
    }

    const config = cstSegmentation.config.getGlobalConfig();
    const { renderInactiveSegmentations } = config;

    const labelmapRepresentationConfig = config.representations.LABELMAP;

    const {
      renderOutline,
      outlineWidthActive: outlineThickness,
      renderFill,
      fillAlpha: fillOpacity,
      fillAlphaInactive: inactiveSegmentationOpacity,
    } = labelmapRepresentationConfig;

    return {
      renderOutline,
      outlineThickness,
      fillOpacity,
      renderFill,
      renderInactiveSegmentations,
      inactiveSegmentationOpacity,
      brushSize,
      brushThresholdGate,
    };
  };

  public setConfiguration = (configuration: SegmentationConfig) => {
    const {
      renderOutline,
      outlineThickness,
      fillOpacity,
      renderFill,
      renderInactiveSegmentations,
      inactiveSegmentationOpacity,
      brushSize,
      brushThresholdGate,
    } = configuration;

    if (renderOutline !== undefined) {
      this.setLabelmapConfigValue('renderOutline', renderOutline);
    }

    if (outlineThickness !== undefined) {
      // Set for both active and inactive segmentations
      this.setLabelmapConfigValue('outlineWidthActive', outlineThickness);
      this.setLabelmapConfigValue('outlineWidthInactive', outlineThickness);
    }

    if (fillOpacity !== undefined) {
      this.setLabelmapConfigValue('fillAlpha', fillOpacity);
    }

    if (renderFill !== undefined) {
      this.setLabelmapConfigValue('renderFill', renderFill);
    }

    if (renderInactiveSegmentations !== undefined) {
      const config = cstSegmentation.config.getGlobalConfig();

      config.renderInactiveSegmentations = renderInactiveSegmentations;
      cstSegmentation.config.setGlobalConfig(config);
    }

    if (inactiveSegmentationOpacity !== undefined) {
      this.setLabelmapConfigValue(
        'fillAlphaInactive',
        inactiveSegmentationOpacity
      );
    }

    if (brushSize !== undefined) {
      const { ToolGroupService } = this.servicesManager.services;

      const toolGroupIds = ToolGroupService.getToolGroupIds();

      toolGroupIds.forEach(toolGroupId => {
        cstUtils.segmentation.setBrushSizeForToolGroup(toolGroupId, brushSize);
      });
    }

    if (brushThresholdGate !== undefined) {
      const { ToolGroupService } = this.servicesManager.services;

      const toolGroupIds = ToolGroupService.getToolGroupIds();

      toolGroupIds.forEach(toolGroupId => {
        cstUtils.segmentation.setBrushThresholdForToolGroup(
          toolGroupId,
          brushThresholdGate
        );
      });
    }

    this._broadcastEvent(
      this.EVENTS.SEGMENTATION_CONFIGURATION_CHANGED,
      this.getConfiguration()
    );
  };

  public getLabelmapVolume = (segmentationId: string) => {
    return cache.getVolume(segmentationId);
  };

  public getSegmentationRepresentationsForToolGroup = toolGroupId => {
    return cstSegmentation.state.getSegmentationRepresentations(toolGroupId);
  };

  private _setActiveSegmentationForToolGroup(
    segmentationId: string,
    toolGroupId: string,
    suppressEvents = false
  ) {
    const segmentations = this.getSegmentations();
    const targetSegmentation = this.getSegmentation(segmentationId);

    if (targetSegmentation === undefined) {
      throw new Error(`no segmentation for segmentationId: ${segmentationId}`);
    }

    segmentations.forEach(segmentation => {
      segmentation.isActive = segmentation.id === segmentationId;
    });

    const representation = this.getSegmentationRepresentation(
      segmentationId,
      toolGroupId
    );

    cstSegmentation.activeSegmentation.setActiveSegmentationRepresentation(
      toolGroupId,
      representation.segmentationRepresentationUID
    );

    if (suppressEvents === false) {
      this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
        segmentation: targetSegmentation,
      });
    }
  }

  private _toggleSegmentationVisibility = (
    segmentationId: string,
    suppressEvents = false
  ) => {
    const segmentation = this.segmentations[segmentationId];

    if (!segmentation) {
      throw new Error(
        `Segmentation with segmentationId ${segmentationId} not found.`
      );
    }

    segmentation.isVisible = !segmentation.isVisible;

    this.updateCornerstoneSegmentationVisibility(segmentationId);

    if (suppressEvents === false) {
      this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
        segmentation,
      });
    }
  };

  private _setActiveSegmentForSegmentation(
    segmentationId: string,
    segmentIndex: number,
    suppressEvents = false
  ) {
    const segmentation = this.getSegmentation(segmentationId);

    if (segmentation === undefined) {
      throw new Error(`no segmentation for segmentationId: ${segmentationId}`);
    }

    cstSegmentation.segmentIndex.setActiveSegmentIndex(
      segmentationId,
      segmentIndex
    );

    segmentation.activeSegmentIndex = segmentIndex;

    if (suppressEvents === false) {
      this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
        segmentation,
      });
    }
  }

  private _setSegmentLabelForSegmentation(
    segmentationId: string,
    segmentIndex: number,
    label: string,
    suppressEvents = false
  ) {
    const segmentation = this.getSegmentation(segmentationId);

    if (segmentation === undefined) {
      throw new Error(`no segmentation for segmentationId: ${segmentationId}`);
    }

    const segmentInfo = segmentation.segments[segmentIndex];

    if (segmentInfo === undefined) {
      throw new Error(
        `Segment ${segmentIndex} not yet added to segmentation: ${segmentationId}`
      );
    }

    segmentInfo.label = label;

    if (suppressEvents === false) {
      this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
        segmentation,
      });
    }
  }

  private setLabelmapConfigValue = (property, value) => {
    const config = cstSegmentation.config.getGlobalConfig();

    config.representations.LABELMAP[property] = value;
    cstSegmentation.config.setGlobalConfig(config);

    const { CornerstoneViewportService } = this.servicesManager.services;

    const renderingEngine = CornerstoneViewportService.getRenderingEngine();
    const viewportIds = CornerstoneViewportService.getViewportIds();

    renderingEngine.renderViewports(viewportIds);
  };

  private initSegmentationService() {
    // Connect Segmentation Service to Cornerstone3D.
    eventTarget.addEventListener(
      csToolsEnums.Events.SEGMENTATION_MODIFIED,
      this._onSegmentationModified
    );

    eventTarget.addEventListener(
      csToolsEnums.Events.SEGMENTATION_DATA_MODIFIED,
      this._onSegmentationDataModified
    );
  }

  private _onSegmentationDataModified = evt => {
    const { segmentationId } = evt.detail;

    const segmentation = this.getSegmentation(segmentationId);

    this._broadcastEvent(this.EVENTS.SEGMENTATION_DATA_MODIFIED, {
      segmentation,
    });
  };

  private _onSegmentationModified = evt => {
    const { segmentationId } = evt.detail;

    const segmentation = this.segmentations[segmentationId];

    if (segmentation === undefined) {
      // Part of add operation, not update operation, exit early.
      return;
    }

    const segmentationState = cstSegmentation.state.getSegmentation(
      segmentationId
    );

    if (!segmentationState) {
      return;
    }

    if (
      !Object.keys(segmentationState.representationData).includes(
        csToolsEnums.SegmentationRepresentations.Labelmap
      )
    ) {
      throw new Error('Non-labelmap representations are not supported yet');
    }

    const {
      activeSegmentIndex,
      cachedStats,
      segmentsLocked,
      representationData,
      label,
      type,
    } = segmentationState;

    const labelmapRepresentationData =
      representationData[csToolsEnums.SegmentationRepresentations.Labelmap];

    // TODO: handle other representations when available in cornerstone3D
    const segmentationSchema = {
      activeSegmentIndex,
      cachedStats,
      displayText: [],
      id: segmentationId,
      label,
      segmentsLocked,
      type,
      volumeId: labelmapRepresentationData.volumeId,
    };

    try {
      this.addOrUpdateSegmentation(segmentationSchema);
    } catch (error) {
      console.warn(
        `Failed to add/update segmentation ${segmentationId}`,
        error
      );
    }
  };

  private _getSegmentationInfo(segmentationId: string) {
    const segmentation = this.getSegmentation(segmentationId);

    if (segmentation === undefined) {
      throw new Error(`no segmentation for segmentationId: ${segmentationId}`);
    }
    const toolGroupId = this.getToolGroupId();

    const segmentationRepresentation = this.getSegmentationRepresentation(
      segmentationId,
      toolGroupId
    );

    if (!segmentationRepresentation) {
      throw new Error(
        'Must add representation to toolgroup before setting segments, currently'
      );
    }

    const { segmentationRepresentationUID } = segmentationRepresentation;

    return { segmentationRepresentationUID, segmentation, toolGroupId };
  }

  private _setSegmentColorForSegmentation = (
    segmentationId: string,
    segmentIndex: number,
    color: Types.Point3,
    suppressEvents = false
  ) => {
    const segmentation = this.getSegmentation(segmentationId);

    if (segmentation === undefined) {
      throw new Error(`no segmentation for segmentationId: ${segmentationId}`);
    }

    const segmentInfo = segmentation.segments[segmentIndex];

    if (segmentInfo === undefined) {
      throw new Error(
        `Segment ${segmentIndex} not yet added to segmentation: ${segmentationId}`
      );
    }

    const toolGroupId = this.getToolGroupId();
    const segmentationRepresentation = this.getSegmentationRepresentation(
      segmentationId,
      toolGroupId
    );

    if (!segmentationRepresentation) {
      throw new Error(
        'Must add representation to toolgroup before setting segments, currently'
      );
    }
    const { segmentationRepresentationUID } = segmentationRepresentation;

    const rgbaColor = cstSegmentation.config.color.getColorForSegmentIndex(
      toolGroupId,
      segmentationRepresentationUID,
      segmentIndex
    );

    cstSegmentation.config.color.setColorForSegmentIndex(
      toolGroupId,
      segmentationRepresentationUID,
      segmentIndex,
      [...color, rgbaColor[3]]
    );

    segmentInfo.color = color;

    if (suppressEvents === false) {
      this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
        segmentation,
      });
    }
  };

  private _setSegmentLockedForSegmentation(
    segmentationId: string,
    segmentIndex: number,
    isLocked: boolean,
    suppressEvents = false
  ) {
    const segmentation = this.getSegmentation(segmentationId);

    if (segmentation === undefined) {
      throw new Error(`no segmentation for segmentationId: ${segmentationId}`);
    }

    const segmentInfo = segmentation.segments[segmentIndex];

    if (segmentInfo === undefined) {
      throw new Error(
        `Segment ${segmentIndex} not yet added to segmentation: ${segmentationId}`
      );
    }

    segmentInfo.isLocked = isLocked;

    cstSegmentation.segmentLocking.setSegmentIndexLocked(
      segmentationId,
      segmentIndex,
      isLocked
    );

    if (suppressEvents === false) {
      this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
        segmentation,
      });
    }
  }

  private _setSegmentVisibilityForSegmentation(
    segmentationId: string,
    segmentIndex: number,
    isVisible: boolean,
    suppressEvents = false
  ) {
    const {
      toolGroupId,
      segmentationRepresentationUID,
      segmentation,
    } = this._getSegmentationInfo(segmentationId);

    if (segmentation === undefined) {
      throw new Error(`no segmentation for segmentationId: ${segmentationId}`);
    }

    const segmentInfo = segmentation.segments[segmentIndex];

    if (segmentInfo === undefined) {
      throw new Error(
        `Segment ${segmentIndex} not yet added to segmentation: ${segmentationId}`
      );
    }

    segmentInfo.isVisible = isVisible;

    cstSegmentation.config.visibility.setVisibilityForSegmentIndex(
      toolGroupId,
      segmentationRepresentationUID,
      segmentIndex,
      isVisible
    );

    if (suppressEvents === false) {
      this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
        segmentation,
      });
    }
  }

  private _setSegmentOpacityForSegmentation = (
    segmentationId: string,
    segmentIndex: number,
    opacity: number,
    suppressEvents = false
  ) => {
    const segmentation = this.getSegmentation(segmentationId);

    if (segmentation === undefined) {
      throw new Error(`no segmentation for segmentationId: ${segmentationId}`);
    }

    const segmentInfo = segmentation.segments[segmentIndex];

    if (segmentInfo === undefined) {
      throw new Error(
        `Segment ${segmentIndex} not yet added to segmentation: ${segmentationId}`
      );
    }

    const toolGroupId = this.getToolGroupId();
    const segmentationRepresentation = this.getSegmentationRepresentation(
      segmentationId,
      toolGroupId
    );

    if (!segmentationRepresentation) {
      throw new Error(
        'Must add representation to toolgroup before setting segments, currently'
      );
    }
    const { segmentationRepresentationUID } = segmentationRepresentation;

    const rgbaColor = cstSegmentation.config.color.getColorForSegmentIndex(
      toolGroupId,
      segmentationRepresentationUID,
      segmentIndex
    );

    cstSegmentation.config.color.setColorForSegmentIndex(
      toolGroupId,
      segmentationRepresentationUID,
      segmentIndex,
      [rgbaColor[0], rgbaColor[1], rgbaColor[2], opacity]
    );

    segmentInfo.opacity = opacity;

    if (suppressEvents === false) {
      this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
        segmentation,
      });
    }
  };

  private removeSegmentationFromCornerstone(segmentationId: string) {
    // TODO: This should be from the configuration
    const removeFromCache = true;
    const segmentationState = cstSegmentation.state;
    const sourceSegState = segmentationState.getSegmentation(segmentationId);

    if (!sourceSegState) {
      return;
    }

    const toolGroupIds = segmentationState.getToolGroupsWithSegmentation(
      segmentationId
    );

    toolGroupIds.forEach(toolGroupId => {
      const segmentationRepresentations = segmentationState.getSegmentationRepresentations(
        toolGroupId
      );

      const UIDsToRemove = [];
      segmentationRepresentations.forEach(representation => {
        if (representation.segmentationId === segmentationId) {
          UIDsToRemove.push(representation.segmentationRepresentationUID);
        }
      });

      // remove segmentation representations
      cstSegmentation.removeSegmentationsFromToolGroup(
        toolGroupId,
        UIDsToRemove
      );
    });

    // cleanup the segmentation state too
    segmentationState.removeSegmentation(segmentationId);

    if (removeFromCache) {
      cache.removeVolumeLoadObject(segmentationId);
    }
  }

  private updateCornerstoneSegmentations({
    segmentationId,
    notYetUpdatedAtSource,
  }) {
    if (notYetUpdatedAtSource === false) {
      return;
    }
    const segmentationState = cstSegmentation.state;
    const sourceSegmentation = segmentationState.getSegmentation(
      segmentationId
    );
    const segmentation = this.segmentations[segmentationId];
    const { label } = segmentation;

    // Update the label in the source if necessary
    if (sourceSegmentation.label !== label) {
      sourceSegmentation.label = label;
    }
  }

  private updateCornerstoneSegmentationVisibility = segmentationId => {
    const segmentationState = cstSegmentation.state;
    const toolGroupIds = segmentationState.getToolGroupsWithSegmentation(
      segmentationId
    );

    toolGroupIds.forEach(toolGroupId => {
      const segmentationRepresentations = cstSegmentation.state.getSegmentationRepresentations(
        toolGroupId
      );

      if (segmentationRepresentations.length === 0) {
        return;
      }

      // Todo: this finds the first segmentation representation that matches the segmentationId
      // If there are two labelmap representations from the same segmentation, this will not work
      const representation = segmentationRepresentations.find(
        representation => representation.segmentationId === segmentationId
      );

      const visibility = cstSegmentation.config.visibility.getSegmentationVisibility(
        toolGroupId,
        representation.segmentationRepresentationUID
      );

      cstSegmentation.config.visibility.setSegmentationVisibility(
        toolGroupId,
        representation.segmentationRepresentationUID,
        !visibility
      );
    });
  };

  private getToolGroupId = () => {
    const { ToolGroupService } = this.servicesManager.services;
    const toolGroupIds = ToolGroupService.getToolGroupIds();

    if (toolGroupIds.length > 1) {
      console.warn(
        'The Segmentation Service currently supports one tool group. There is a mapping from one segmentation to multiple different segmentationRepresentations that needs to be generalised'
      );
    }

    return toolGroupIds[0];
  };

  private getNextColorLUTIndex = (): number => {
    let i = 0;
    while (true) {
      if (cstSegmentation.state.getColorLUT(i) === undefined) {
        return i;
      }

      i++;
    }
  };

  private generateNewColorLUT() {
    const newColorLUT = cloneDeep(COLOR_LUT);

    return newColorLUT;
  }

  /**
   * Converts object of objects to array.
   *
   * @return {Array} Array of objects
   */
  private arrayOfObjects = obj => {
    return Object.entries(obj).map(e => ({ [e[0]]: e[1] }));
  };
}

export default SegmentationService;
export { EVENTS, VALUE_TYPES };
