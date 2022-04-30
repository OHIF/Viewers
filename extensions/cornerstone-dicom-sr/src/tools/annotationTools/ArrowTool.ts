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
  Types as csToolsTypes,
} from '@cornerstonejs/tools';

import { state } from '../../store';

class SRArrowTool extends AnnotationTool {
  static toolName = 'Arrow';

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
        getTextCallback: () => prompt('Enter your annotation:'),
        changeTextCallback: () => prompt('Enter your annotation:'),
        preventHandleOutsideImage: false,
        arrowFirst: true,
      },
    }
  ) {
    super(toolProps, defaultToolProps);
  }

  /**
   * Based on the current position of the mouse and the current imageId to create
   * a Length Annotation and stores it in the annotationManager
   *
   * @param evt -  csToolsTypes.EventTypes.NormalizedMouseEventType
   * @returns The annotation object.
   *
   */
  addNewAnnotation = (
    evt: csToolsTypes.EventTypes.MouseDownActivateEventType
  ): csToolsTypes.ToolSpecificAnnotationTypes.ArrowAnnotation => {
    const eventDetail = evt.detail;
    const { currentPoints, element } = eventDetail;
    const worldPos = currentPoints.world;
    const enabledElement = getEnabledElement(element);
    const { viewport, renderingEngine } = enabledElement;

    cursors.elementCursor.hideElementCursor(element);
    this.isDrawing = true;

    const camera = viewport.getCamera();
    const { viewPlaneNormal, viewUp } = camera;

    const referencedImageId = this.getReferencedImageId(
      viewport,
      worldPos,
      viewPlaneNormal,
      viewUp
    );

    const annotation = {
      highlighted: true,
      invalidated: true,
      metadata: {
        toolName: this.getToolName(),
        viewPlaneNormal: <Types.Point3>[...viewPlaneNormal],
        viewUp: <Types.Point3>[...viewUp],
        FrameOfReferenceUID: viewport.getFrameOfReferenceUID(),
        referencedImageId,
      },
      data: {
        text: '',
        handles: {
          points: [<Types.Point3>[...worldPos], <Types.Point3>[...worldPos]],
          activeHandleIndex: null,
          textBox: {
            hasMoved: false,
            worldPosition: <Types.Point3>[0, 0, 0],
            worldBoundingBox: {
              topLeft: <Types.Point3>[0, 0, 0],
              topRight: <Types.Point3>[0, 0, 0],
              bottomLeft: <Types.Point3>[0, 0, 0],
              bottomRight: <Types.Point3>[0, 0, 0],
            },
          },
        },
        label: '',
      },
    };

    // Ensure settings are initialized after annotation instantiation
    Settings.getObjectSettings(annotation, SRArrowTool);

    csToolsAnnotation.state.addAnnotation(element, annotation);

    const viewportIdsToRender = csToolsUtils.viewportFilters.getViewportIdsWithToolToRender(
      element,
      this.getToolName()
    );

    this.editData = {
      annotation,
      viewportIdsToRender,
      handleIndex: 1,
      movingTextBox: false,
      newAnnotation: true,
      hasMoved: false,
    };
    this._activateDraw(element);

    evt.preventDefault();

    csToolsUtils.triggerAnnotationRenderForViewportIds(
      renderingEngine,
      viewportIdsToRender
    );

    return annotation;
  };

  /**
   * It returns if the canvas point is near the provided length annotation in the provided
   * element or not. A proximity is passed to the function to determine the
   * proximity of the point to the annotation in number of pixels.
   *
   * @param element - HTML Element
   * @param annotation - Annotation
   * @param canvasCoords - Canvas coordinates
   * @param proximity - Proximity to tool to consider
   * @returns Boolean, whether the canvas point is near tool
   */
  isPointNearTool = (
    element: HTMLDivElement,
    annotation: csToolsTypes.ToolSpecificAnnotationTypes.ArrowAnnotation,
    canvasCoords: Types.Point2,
    proximity: number
  ): boolean => {
    const enabledElement = getEnabledElement(element);
    const { viewport } = enabledElement;
    const { data } = annotation;
    const [point1, point2] = data.handles.points;
    const canvasPoint1 = viewport.worldToCanvas(point1);
    const canvasPoint2 = viewport.worldToCanvas(point2);

    const line = {
      start: {
        x: canvasPoint1[0],
        y: canvasPoint1[1],
      },
      end: {
        x: canvasPoint2[0],
        y: canvasPoint2[1],
      },
    };

    const distanceToPoint = csToolsUtils.math.lineSegment.distanceToPoint(
      [line.start.x, line.start.y],
      [line.end.x, line.end.y],
      [canvasCoords[0], canvasCoords[1]]
    );

    if (distanceToPoint <= proximity) {
      return true;
    }

    return false;
  };

  toolSelectedCallback = (
    evt: csToolsTypes.EventTypes.MouseDownEventType,
    annotation: csToolsTypes.ToolSpecificAnnotationTypes.ArrowAnnotation,
    interactionType: csToolsTypes.InteractionTypes
  ): void => {
    const eventDetail = evt.detail;
    const { element } = eventDetail;

    annotation.highlighted = true;

    const viewportIdsToRender = csToolsUtils.viewportFilters.getViewportIdsWithToolToRender(
      element,
      this.getToolName()
    );

    this.editData = {
      annotation,
      viewportIdsToRender,
      movingTextBox: false,
    };

    this._activateModify(element);

    cursors.elementCursor.hideElementCursor(element);

    const enabledElement = getEnabledElement(element);
    const { renderingEngine } = enabledElement;

    csToolsUtils.triggerAnnotationRenderForViewportIds(
      renderingEngine,
      viewportIdsToRender
    );

    evt.preventDefault();
  };

  handleSelectedCallback(
    evt: csToolsTypes.EventTypes.MouseDownEventType,
    annotation: csToolsTypes.ToolSpecificAnnotationTypes.ArrowAnnotation,
    handle: csToolsTypes.ToolHandle,
    interactionType = 'mouse'
  ): void {
    const eventDetail = evt.detail;
    const { element } = eventDetail;
    const { data } = annotation;

    annotation.highlighted = true;

    let movingTextBox = false;
    let handleIndex;

    if ((handle as csToolsTypes.TextBoxHandle).worldPosition) {
      movingTextBox = true;
    } else {
      handleIndex = data.handles.points.findIndex(p => p === handle);
    }

    // Find viewports to render on drag.
    const viewportIdsToRender = csToolsUtils.viewportFilters.getViewportIdsWithToolToRender(
      element,
      this.getToolName()
    );

    this.editData = {
      annotation,
      viewportIdsToRender,
      handleIndex,
      movingTextBox,
    };
    this._activateModify(element);

    cursors.elementCursor.hideElementCursor(element);

    const enabledElement = getEnabledElement(element);
    const { renderingEngine } = enabledElement;

    csToolsUtils.triggerAnnotationRenderForViewportIds(
      renderingEngine,
      viewportIdsToRender
    );

    evt.preventDefault();
  }

  _mouseUpCallback = (
    evt:
      | csToolsTypes.EventTypes.MouseUpEventType
      | csToolsTypes.EventTypes.MouseClickEventType
  ) => {
    const eventDetail = evt.detail;
    const { element } = eventDetail;

    const {
      annotation,
      viewportIdsToRender,
      newAnnotation,
      hasMoved,
    } = this.editData;
    const { data } = annotation;

    if (newAnnotation && !hasMoved) {
      // when user starts the drawing by click, and moving the mouse, instead
      // of click and drag
      return;
    }

    annotation.highlighted = false;
    data.handles.activeHandleIndex = null;

    this._deactivateModify(element);
    this._deactivateDraw(element);
    cursors.elementCursor.resetElementCursor(element);

    const enabledElement = getEnabledElement(element);
    const { renderingEngine } = enabledElement;

    if (
      this.isHandleOutsideImage &&
      this.configuration.preventHandleOutsideImage
    ) {
      csToolsAnnotation.state.removeAnnotation(
        annotation.annotationUID,
        element
      );
    }

    if (newAnnotation) {
      const text = this.configuration.getTextCallback();
      if (!text) {
        csToolsAnnotation.state.removeAnnotation(
          annotation.annotationUID,
          element
        );
        csToolsUtils.triggerAnnotationRenderForViewportIds(
          renderingEngine,
          viewportIdsToRender
        );
        this.editData = null;
        this.isDrawing = false;
        return;
      }
      annotation.data.text = text;
    }

    csToolsUtils.triggerAnnotationRenderForViewportIds(
      renderingEngine,
      viewportIdsToRender
    );

    if (newAnnotation) {
      const eventType = Enums.Events.ANNOTATION_COMPLETED;

      const eventDetail: csToolsTypes.EventTypes.AnnotationCompletedEventDetail = {
        annotation,
      };

      triggerEvent(eventTarget, eventType, eventDetail);
    }

    this.editData = null;
    this.isDrawing = false;
  };

  _mouseDragCallback = (
    evt:
      | csToolsTypes.EventTypes.MouseDragEventType
      | csToolsTypes.EventTypes.MouseMoveEventType
  ) => {
    this.isDrawing = true;
    const eventDetail = evt.detail;
    const { element } = eventDetail;

    const {
      annotation,
      viewportIdsToRender,
      handleIndex,
      movingTextBox,
    } = this.editData;
    const { data } = annotation;

    if (movingTextBox) {
      // Drag mode - moving text box
      const {
        deltaPoints,
      } = eventDetail as csToolsTypes.EventTypes.MouseDragEventDetail;
      const worldPosDelta = deltaPoints.world;

      const { textBox } = data.handles;
      const { worldPosition } = textBox;

      worldPosition[0] += worldPosDelta[0];
      worldPosition[1] += worldPosDelta[1];
      worldPosition[2] += worldPosDelta[2];

      textBox.hasMoved = true;
    } else if (handleIndex === undefined) {
      // Drag mode - moving handle
      const {
        deltaPoints,
      } = eventDetail as csToolsTypes.EventTypes.MouseDragEventDetail;
      const worldPosDelta = deltaPoints.world;

      const points = data.handles.points;

      points.forEach(point => {
        point[0] += worldPosDelta[0];
        point[1] += worldPosDelta[1];
        point[2] += worldPosDelta[2];
      });
      annotation.invalidated = true;
    } else {
      // Move mode - after double click, and mouse move to draw
      const { currentPoints } = eventDetail;
      const worldPos = currentPoints.world;

      data.handles.points[handleIndex] = [...worldPos];
      annotation.invalidated = true;
    }

    this.editData.hasMoved = true;

    const enabledElement = getEnabledElement(element);
    const { renderingEngine } = enabledElement;

    csToolsUtils.triggerAnnotationRenderForViewportIds(
      renderingEngine,
      viewportIdsToRender
    );
  };

  doubleClickCallback = (evt: csToolsTypes.EventTypes.MouseUpEventType) => {
    const eventDetail = evt.detail;
    const { element } = eventDetail;

    const {
      viewportId,
      renderingEngineId,
      renderingEngine,
    } = getEnabledElement(element);

    let annotations = csToolsAnnotation.state.getAnnotations(
      element,
      this.getToolName()
    );

    annotations = this.filterInteractableAnnotationsForElement(
      element,
      annotations
    );

    const clickedAnnotation = annotations.find(annotation =>
      this.isPointNearTool(
        element,
        annotation as csToolsTypes.ToolSpecificAnnotationTypes.ArrowAnnotation,
        eventDetail.currentPoints.canvas,
        6 // Todo: get from configuration
      )
    );

    if (!clickedAnnotation) {
      return;
    }

    const annotation = clickedAnnotation as csToolsTypes.ToolSpecificAnnotationTypes.ArrowAnnotation;

    const text = this.configuration.changeTextCallback();
    annotation.data.text = text;

    const viewportIdsToRender = csToolsUtils.viewportFilters.getViewportIdsWithToolToRender(
      element,
      this.getToolName()
    );
    csToolsUtils.triggerAnnotationRenderForViewportIds(
      renderingEngine,
      viewportIdsToRender
    );

    // Dispatching annotation modified
    const eventType = Enums.Events.ANNOTATION_MODIFIED;

    triggerEvent(eventTarget, eventType, {
      annotation,
      viewportId,
      renderingEngineId,
    });

    this.editData = null;
    this.isDrawing = false;
  };

  cancel = (element: HTMLDivElement) => {
    // If it is mid-draw or mid-modify
    if (this.isDrawing) {
      this.isDrawing = false;
      this._deactivateDraw(element);
      this._deactivateModify(element);
      cursors.elementCursor.resetElementCursor(element);

      const { annotation, viewportIdsToRender, newAnnotation } = this.editData;
      const { data } = annotation;

      annotation.highlighted = false;
      data.handles.activeHandleIndex = null;

      const enabledElement = getEnabledElement(element);
      const { renderingEngine } = enabledElement;

      csToolsUtils.triggerAnnotationRenderForViewportIds(
        renderingEngine,
        viewportIdsToRender
      );

      if (newAnnotation) {
        const eventType = Enums.Events.ANNOTATION_COMPLETED;

        const eventDetail: csToolsTypes.EventTypes.AnnotationCompletedEventDetail = {
          annotation,
        };

        triggerEvent(eventTarget, eventType, eventDetail);
      }

      this.editData = null;
      return annotation.annotationUID;
    }
  };

  _activateModify = (element: HTMLDivElement) => {
    state.isInteractingWithTool = true;

    element.addEventListener(Enums.Events.MOUSE_UP, this._mouseUpCallback);
    element.addEventListener(Enums.Events.MOUSE_DRAG, this._mouseDragCallback);
    element.addEventListener(Enums.Events.MOUSE_CLICK, this._mouseUpCallback);

    // element.addEventListener(Enums.Events.TOUCH_END, this._mouseUpCallback)
    // element.addEventListener(Enums.Events.TOUCH_DRAG, this._mouseDragCallback)
  };

  _deactivateModify = (element: HTMLDivElement) => {
    state.isInteractingWithTool = false;

    element.removeEventListener(Enums.Events.MOUSE_UP, this._mouseUpCallback);
    element.removeEventListener(
      Enums.Events.MOUSE_DRAG,
      this._mouseDragCallback
    );
    element.removeEventListener(
      Enums.Events.MOUSE_CLICK,
      this._mouseUpCallback
    );

    // element.removeEventListener(Enums.Events.TOUCH_END, this._mouseUpCallback)
    // element.removeEventListener(Enums.Events.TOUCH_DRAG, this._mouseDragCallback)
  };

  _activateDraw = (element: HTMLDivElement) => {
    state.isInteractingWithTool = true;

    element.addEventListener(Enums.Events.MOUSE_UP, this._mouseUpCallback);
    element.addEventListener(Enums.Events.MOUSE_DRAG, this._mouseDragCallback);
    element.addEventListener(Enums.Events.MOUSE_MOVE, this._mouseDragCallback);
    element.addEventListener(Enums.Events.MOUSE_CLICK, this._mouseUpCallback);

    // element.addEventListener(Enums.Events.TOUCH_END, this._mouseUpCallback)
    // element.addEventListener(Enums.Events.TOUCH_DRAG, this._mouseDragCallback)
  };

  _deactivateDraw = (element: HTMLDivElement) => {
    state.isInteractingWithTool = false;

    element.removeEventListener(Enums.Events.MOUSE_UP, this._mouseUpCallback);
    element.removeEventListener(
      Enums.Events.MOUSE_DRAG,
      this._mouseDragCallback
    );
    element.removeEventListener(
      Enums.Events.MOUSE_MOVE,
      this._mouseDragCallback
    );
    element.removeEventListener(
      Enums.Events.MOUSE_CLICK,
      this._mouseUpCallback
    );

    // element.removeEventListener(Enums.Events.TOUCH_END, this._mouseUpCallback)
    // element.removeEventListener(Enums.Events.TOUCH_DRAG, this._mouseDragCallback)
  };

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

    // Draw SVG
    for (let i = 0; i < annotations.length; i++) {
      const annotation = annotations[
        i
      ] as csToolsTypes.ToolSpecificAnnotationTypes.ArrowAnnotation;
      const settings = Settings.getObjectSettings(annotation, SRArrowTool);
      const { annotationUID, data } = annotation;
      const { handles, text } = data;
      const { points, activeHandleIndex } = handles;
      const lineWidth = this.getStyle(settings, 'lineWidth', annotation);
      const lineDash = this.getStyle(settings, 'lineDash', annotation);
      const color = this.getStyle(settings, 'color', annotation);

      const canvasCoordinates = points.map(p => viewport.worldToCanvas(p));

      let activeHandleCanvasCoords;

      if (
        !csToolsAnnotation.annotation.locking.isAnnotationLocked(annotation) &&
        !this.editData &&
        activeHandleIndex !== null
      ) {
        // Not locked or creating and hovering over handle, so render handle.
        activeHandleCanvasCoords = [canvasCoordinates[activeHandleIndex]];
      }

      if (activeHandleCanvasCoords) {
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
      }

      const arrowUID = '1';
      if (this.configuration.arrowFirst) {
        drawing.drawArrow(
          svgDrawingHelper,
          annotationUID,
          arrowUID,
          canvasCoordinates[1],
          canvasCoordinates[0],
          {
            color,
            width: lineWidth,
          }
        );
      } else {
        drawing.drawArrowSvg(
          svgDrawingHelper,
          annotationUID,
          arrowUID,
          canvasCoordinates[0],
          canvasCoordinates[1],
          {
            color,
            width: lineWidth,
          }
        );
      }

      // If rendering engine has been destroyed while rendering
      if (!viewport.getRenderingEngine()) {
        console.warn('Rendering Engine has been destroyed');
        return;
      }

      if (!text) {
        continue;
      }

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
      const boundingBox = drawing.drawLinkedTextBoxSvg(
        svgDrawingHelper,
        annotationUID,
        textBoxUID,
        [text],
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

  _isInsideVolume(index1, index2, dimensions) {
    return (
      csUtils.indexWithinDimensions(index1, dimensions) &&
      csUtils.indexWithinDimensions(index2, dimensions)
    );
  }
}

export default SRArrowTool;
