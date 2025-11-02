import { annotation, SplineROITool } from '@cornerstonejs/tools';
import type {AnnotationRenderContext} from "@cornerstonejs/tools/types";
import type {SplineROIAnnotation} from "@cornerstonejs/tools/types/ToolSpecificAnnotationTypes";
import getActiveViewportEnabledElement from '../utils/getActiveViewportEnabledElement';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import { utilities } from '@cornerstonejs/core';
import CprWrapper from '../utils/CprWrapper';
import { servicesManager } from '@ohif/app/src/App';
import { Point3 } from '@cornerstonejs/core/types';
import { Enums } from '@cornerstonejs/tools';

const { Events } = Enums;

/**
 * Minimal extension of SplineROITool that simply forces splines to render as open curves
 * This is the cleanest approach - only override the rendering behavior
 */
class OpenSplineTool extends SplineROITool {
  static toolName = 'OpenSpline';

  _renderingViewport: any;
  _splineRoiToolRenderAnnotation = this.renderAnnotation;
  _origTriggerModified = this.triggerAnnotationModified;
  _currentCPR: CprWrapper | null = null;
  _currentRotation: number = 0;

  /**
   * Override to allow annotation to be rendered on any slice
   * By default, SplineROI only renders on the slice it was created on
   * This allows drawing across multiple slices while scrolling
   */
  filterInteractableAnnotationsForElement(
    element: HTMLDivElement,
    annotations: SplineROIAnnotation[]
  ): SplineROIAnnotation[] {
    // Return all annotations - allow them to be visible on all slices
    // This enables cross-slice visualization for 3D spline paths
    return annotations;
  }

  renderAnnotation = (enabledElement, svgDrawingHelper) => {
    const { viewport } = enabledElement;
    this._renderingViewport = viewport;
    return this._splineRoiToolRenderAnnotation(enabledElement, svgDrawingHelper);
  };

  addNewAnnotation = (evt) => {
    const result = super.addNewAnnotation(evt);

    console.log('✅ Started drawing - use arrow keys ↑↓ to scroll slices');
    cleanOldAnnotation();
    return result;
  }

  /**
   * Override cancel to cleanup
   */
  cancel(element: HTMLDivElement) {
    return super.cancel(element);
  }

  // wrap lai ham triggerAnnotationModified cua parent (bat su kien update)
  triggerAnnotationModified = (annotation, enabledElement, changeType) => {
    this._origTriggerModified(annotation, enabledElement, changeType);

    const evt = { detail: { annotation, enabledElement } };

    this.annotationCompleted(evt);
  }

  protected annotationCompleted(evt: any) {
    super.annotationCompleted(evt);

    const { cornerstoneViewportService, viewportGridService, toolGroupService } = servicesManager.services;

    const annotationAddedEventDetail = evt.detail;
    const {
      annotation: { data: annotationData },
    } = annotationAddedEventDetail;

    const enabledElement = getActiveViewportEnabledElement(viewportGridService);
    const { viewport } = enabledElement;

    const plane = cornerstoneViewportService.getOrientation(viewport.id);
    const points = annotationData.handles.points;
    const image = getImageDataFromViewport(viewport);
    const spacing = image.getSpacing();

    // Transform points to world coordinates
    let worldPoints = points
      .map((point: Point3) => utilities.transformWorldToIndex(image, point))
      .map((point: number[]) => [
        point[0] * spacing[0],
        point[1] * spacing[1],
        (image.getDimensions()[2] - 1 - point[2]) * spacing[2]
      ]);

    image.setOrigin([0, 0, 0]);

    const cprViewportId = "cpr";
    const cprViewport = cornerstoneViewportService.getCornerstoneViewport(cprViewportId);

    // console.log(points, worldPoints, cornerstoneViewportService.getViewportIds())

    // Create or reuse CPR instance
    if (this._currentCPR) {
      // Clean up old CPR if exists
      this._currentCPR = null;
    }

    this._currentCPR = new CprWrapper(cprViewport, image, plane);
    this._currentRotation = 0; // Reset rotation

    function flipPointsAlongZ(points, dimensions, spacing) {
      const sizeZ = dimensions[2] * spacing[2]; // chiều dài thật theo trục Z

      return points.map(([x, y, z]) => {
        const flippedZ = sizeZ - z;
        return [x, y, flippedZ];
      });
    }

    if (plane !== "axial")
      worldPoints = flipPointsAlongZ(worldPoints, image.getDimensions(), image.getSpacing());

    // Set centerline and render
    this._currentCPR.setCenterline(worldPoints);

    // Use safe render method
    this._currentCPR.safeRender();

    const { voiRange } = viewport.getProperties();
    this._currentCPR.setVOI(voiRange);

    removeBlackOverlay("cpr");

    // Setup scroll rotation on CPR viewport
    this.setupCPRScrollRotation(cprViewport);
  }

  /**
   * Setup wheel scroll to rotate CPR
   */
  setupCPRScrollRotation(cprViewport: any) {
    const element = cprViewport.element;

    console.log('🎯 Setting up CPR scroll rotation on element:', element);

    // Remove old listener if exists
    if ((element as any)._cprWheelListener) {
      element.removeEventListener('wheel', (element as any)._cprWheelListener);
    }

    const wheelHandler = (evt: WheelEvent) => {
      console.log('🔄 Wheel event triggered on CPR viewport!', evt.deltaY);

      evt.preventDefault();
      evt.stopPropagation();

      if (!this._currentCPR) {
        console.warn('⚠️ No current CPR instance');
        return;
      }

      // Rotate ±5 degrees per wheel tick
      const delta = evt.deltaY > 0 ? 5 : -5;
      this._currentRotation += delta;

      // Keep rotation in 0-360 range
      this._currentRotation = ((this._currentRotation % 360) + 360) % 360;

      console.log(`🔄 CPR rotation: ${this._currentRotation}°`);

      // Apply rotation
      this._currentCPR.rotateCPR(this._currentRotation);
    };

    // Store listener reference for cleanup
    (element as any)._cprWheelListener = wheelHandler;
    element.addEventListener('wheel', wheelHandler, { passive: false });

    console.log('✅ CPR wheel listener attached');
  }

  /**
   * Override renderAnnotationInstance to force spline rendering to be open
   * This is the minimal change needed - just force splines to render as open
   */
  protected renderAnnotationInstance(
    renderContext: AnnotationRenderContext
  ): boolean {
    const annotation = renderContext.annotation as SplineROIAnnotation;
    const { element } = renderContext.enabledElement.viewport;

    // Store original closed state
    const originalClosed = annotation.data.contour.closed;
    const originalSplineClosed = annotation.data.spline.instance.closed;

    try {
      // Temporarily force everything to be open for rendering
      annotation.data.contour.closed = false;
      annotation.data.spline.instance.closed = false;

      // Get child annotations if any
      const getChildAnnotations = (this as any).getChildAnnotations ||
        ((window as any).cornerstoneTools?.getChildAnnotations);

      const childAnnotations = getChildAnnotations ? getChildAnnotations(annotation) : [];

      // Force all related splines to be open
      const allAnnotations = [annotation, ...childAnnotations].filter(
        (ann) => ann && (this as any)._isSplineROIAnnotation(ann)
      ) as SplineROIAnnotation[];

      // Store original states and force open
      const originalStates = allAnnotations.map(ann => ({
        annotation: ann,
        contourClosed: ann.data.contour.closed,
        splineClosed: ann.data.spline.instance.closed
      }));

      allAnnotations.forEach(ann => {
        ann.data.contour.closed = false;
        ann.data.spline.instance.closed = false;
      });

      // Let parent render with forced open state
      const result = super.renderAnnotationInstance(renderContext);

      // Restore original states after rendering
      originalStates.forEach(state => {
        state.annotation.data.contour.closed = state.contourClosed;
        state.annotation.data.spline.instance.closed = state.splineClosed;
      });

      return result;

    } catch (error) {
      // Restore original states in case of error
      annotation.data.contour.closed = originalClosed;
      annotation.data.spline.instance.closed = originalSplineClosed;
      throw error;
    }
  }
}

function getImageDataFromViewport(viewport) {
  try {
    const csImageData = viewport.getImageData();

    const dimensions = csImageData.dimensions;
    const spacing = csImageData.spacing;
    const origin = csImageData.origin;

    console.log('Original image data:', { dimensions, spacing, origin });

    let scalarData = csImageData.voxelManager.getCompleteScalarDataArray();
    const scalarDataCopy = new scalarData.constructor(scalarData);
    // Apply pixel data transformation
    // scalarData = this.fixDicomPixelData(scalarData, dimensions[0], dimensions[1], false, true);

    // Create new vtkImageData
    const vtkImage = vtkImageData.newInstance();
    vtkImage.setDimensions(dimensions as [number, number, number]);
    vtkImage.setSpacing(spacing as [number, number, number]);
    vtkImage.setOrigin(origin as [number, number, number]);

    const dataArray = vtkDataArray.newInstance({
      name: 'Scalars',
      numberOfComponents: 1,
      values: scalarDataCopy,
    });
    vtkImage.getPointData().setScalars(dataArray);

    console.log("VTK Image created successfully:", vtkImage);
    return vtkImage;
  } catch (error) {
    console.error('Error creating VTK image data:', error);
    throw new Error(`Failed to create VTK image: ${error.message}`);
  }
}

function removeBlackOverlay(viewportId) {
  const viewportElement = document.querySelector(`[data-viewportid="${viewportId}"]`);
  if (!viewportElement) return;
  const overlayWrapper = viewportElement.querySelector('.cpr-black-overlay-wrapper');
  if (overlayWrapper) overlayWrapper.remove();
}

function cleanOldAnnotation() {
  const toolName = "OpenSpline";
  const splineAnnotationIDs = annotation.state.getAllAnnotations()
    .filter(annotation => annotation.metadata.toolName === toolName)
    .map(annotation => annotation.annotationUID);

  if (splineAnnotationIDs.length > 1)
    for (let i = 0; i < splineAnnotationIDs.length-1; i++) {
      annotation.state.removeAnnotation(splineAnnotationIDs[i]);
    }
  // console.log("ANNOTATION", annotation.state.getAllAnnotations(), evt.detail.annotation, splineAnnotationIDs);
}

export default OpenSplineTool;
