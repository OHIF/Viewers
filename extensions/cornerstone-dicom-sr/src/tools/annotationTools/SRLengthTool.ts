import {
  getEnabledElement,
  Settings,
  triggerEvent,
  eventTarget,
  utilities as csUtils,
  Types,
} from '@cornerstonejs/core';

import {
  AnnotationTool,
  annotation as csToolsAnnotation,
  cursors,
  Enums,
  utilities as csToolsUtils,
  drawing,
  LengthTool,
  Types as csToolsTypes,
} from '@cornerstonejs/tools';

class SRLengthTool extends LengthTool {
  static toolName = 'SRLength';

  public touchDragCallback: any;
  public mouseDragCallback: any;
  _throttledCalculateCachedStats: any;
  editData: {
    annotation: any;
    viewportIdsToRender: string[];
    handleIndex?: number;
    movingTextBox?: boolean;
    newAnnotation?: boolean;
    hasMoved?: boolean;
  } | null;
  isDrawing: boolean;
  isHandleOutsideImage: boolean;

  constructor(
    toolProps: csToolsTypes.PublicToolProps = {},
    defaultToolProps: csToolsTypes.ToolProps = {
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {
        shadow: true,
        preventHandleOutsideImage: false,
      },
    }
  ) {
    super(toolProps, defaultToolProps);

    this._throttledCalculateCachedStats = csToolsUtils.throttle(
      this._calculateCachedStats,
      100,
      { trailing: true }
    );
  }

  /**
   * it is used to draw the length annotation in each
   * request animation frame. It calculates the updated cached statistics if
   * data is invalidated and cache it.
   *
   * @param enabledElement - The Cornerstone's enabledElement.
   * @param svgDrawingHelper - The svgDrawingHelper providing the context for drawing.
   */
  renderAnnotation = (
    enabledElement: Types.IEnabledElement,
    svgDrawingHelper: any
  ): void => {
    const { viewport } = enabledElement;
    const { element } = viewport;

    let annotations = csToolsAnnotation.state.getAnnotations(
      element,
      this.getToolName()
    );

    // Todo: We don't need this anymore, filtering happens in triggerAnnotationRender
    if (!annotations?.length) {
      return;
    }

    annotations = this.filterInteractableAnnotationsForElement(
      element,
      annotations
    );

    if (!annotations?.length) {
      return;
    }

    const targetId = this.getTargetId(viewport);
    const renderingEngine = viewport.getRenderingEngine();

    // Draw SVG
    for (let i = 0; i < annotations.length; i++) {
      const annotation = annotations[i];
      const settings = Settings.getObjectSettings(annotation, LengthTool);
      const annotationUID = annotation.annotationUID;
      const data = annotation.data;
      const { points, activeHandleIndex } = data.handles;
      const lineWidth = this.getStyle(settings, 'lineWidth', annotation);
      const lineDash = '5';
      const color = this.getStyle(settings, 'color', annotation);

      const canvasCoordinates = points.map(p => viewport.worldToCanvas(p));

      let activeHandleCanvasCoords;

      if (
        !csToolsAnnotation.locking.isAnnotationLocked(annotation) &&
        !this.editData &&
        activeHandleIndex !== null
      ) {
        // Not locked or creating and hovering over handle, so render handle.
        activeHandleCanvasCoords = [canvasCoordinates[activeHandleIndex]];
      }

      const handleGroupUID = '0';

      drawing.drawHandles(
        svgDrawingHelper,
        annotationUID,
        handleGroupUID,
        canvasCoordinates,
        {
          color,
          lineDash,
          lineWidth,
        }
      );

      const lineUID = '1';
      drawing.drawLine(
        svgDrawingHelper,
        annotationUID,
        lineUID,
        canvasCoordinates[0],
        canvasCoordinates[1],
        {
          color,
          width: lineWidth,
          lineDash,
        }
      );

      // WE HAVE TO CACHE STATS BEFORE FETCHING TEXT
      if (!data.cachedStats[targetId]) {
        data.cachedStats[targetId] = {
          length: null,
        };

        this._calculateCachedStats(annotation, renderingEngine, enabledElement);
      } else if (annotation.invalidated) {
        this._throttledCalculateCachedStats(
          annotation,
          renderingEngine,
          enabledElement
        );
      }

      // If rendering engine has been destroyed while rendering
      if (!viewport.getRenderingEngine()) {
        console.warn('Rendering Engine has been destroyed');
        return;
      }

      const textLines = this._getTextLines(data, targetId);

      // Need to update to sync w/ annotation while unlinked/not moved
      if (!data.handles.textBox.hasMoved) {
        const canvasTextBoxCoords = csToolsUtils.drawing.getTextBoxCoordsCanvas(
          canvasCoordinates
        );

        data.handles.textBox.worldPosition = viewport.canvasToWorld(
          canvasTextBoxCoords
        );
      }

      const textBoxPosition = viewport.worldToCanvas(
        data.handles.textBox.worldPosition
      );

      const textBoxUID = '1';
      const boundingBox = drawing.drawLinkedTextBox(
        svgDrawingHelper,
        annotationUID,
        textBoxUID,
        textLines,
        textBoxPosition,
        canvasCoordinates,
        {},
        this.getLinkedTextBoxStyle(settings, annotation)
      );

      const { x: left, y: top, width, height } = boundingBox;

      data.handles.textBox.worldBoundingBox = {
        topLeft: viewport.canvasToWorld([left, top]),
        topRight: viewport.canvasToWorld([left + width, top]),
        bottomLeft: viewport.canvasToWorld([left, top + height]),
        bottomRight: viewport.canvasToWorld([left + width, top + height]),
      };
    }
  };

  // text line for the current active length annotation
  _getTextLines(data, targetId) {
    const cachedVolumeStats = data.cachedStats[targetId];
    const { length } = cachedVolumeStats;

    if (length === undefined) {
      return;
    }

    // spaceBetweenSlices & pixelSpacing &
    // magnitude in each direction? Otherwise, this is "px"?
    const textLines = [`${length.toFixed(2)} mm`];

    return textLines;
  }

  _calculateLength(pos1, pos2) {
    const dx = pos1[0] - pos2[0];
    const dy = pos1[1] - pos2[1];
    const dz = pos1[2] - pos2[2];

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  _calculateCachedStats(annotation, renderingEngine, enabledElement) {
    const data = annotation.data;
    const { viewportId, renderingEngineId } = enabledElement;

    const worldPos1 = data.handles.points[0];
    const worldPos2 = data.handles.points[1];
    const { cachedStats } = data;
    const targetIds = Object.keys(cachedStats);

    // TODO clean up, this doesn't need a length per volume, it has no stats derived from volumes.

    for (let i = 0; i < targetIds.length; i++) {
      const targetId = targetIds[i];

      const image = this.getTargetIdImage(targetId, renderingEngine);

      const { imageData, dimensions } = image;

      const length = this._calculateLength(worldPos1, worldPos2);

      const index1 = csUtils.transformWorldToIndex(imageData, worldPos1);
      const index2 = csUtils.transformWorldToIndex(imageData, worldPos2);

      this._isInsideVolume(index1, index2, dimensions)
        ? (this.isHandleOutsideImage = false)
        : (this.isHandleOutsideImage = true);

      // TODO -> Do we instead want to clip to the bounds of the volume and only include that portion?
      // Seems like a lot of work for an unrealistic case. At the moment bail out of stat calculation if either
      // corner is off the canvas.

      // todo: add insideVolume calculation, for removing tool if outside
      cachedStats[targetId] = {
        length,
      };
    }

    annotation.invalidated = false;

    // Dispatching annotation modified
    const eventType = Enums.Events.ANNOTATION_MODIFIED;

    const eventDetail: csToolsTypes.EventTypes.AnnotationModifiedEventDetail = {
      annotation,
      viewportId,
      renderingEngineId,
    };
    triggerEvent(eventTarget, eventType, eventDetail);

    return cachedStats;
  }

  _isInsideVolume(index1, index2, dimensions) {
    return (
      csUtils.indexWithinDimensions(index1, dimensions) &&
      csUtils.indexWithinDimensions(index2, dimensions)
    );
  }
}

export default SRLengthTool;
