import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkResliceCursorWidget from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget';
import { ViewTypes } from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';
import vtkImageCPRMapper from '@kitware/vtk.js/Rendering/Core/ImageCPRMapper';
import vtkCPRManipulator from '@kitware/vtk.js/Widgets/Manipulators/CPRManipulator';
import vtkImageResliceMapper from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper';
import { mat3, mat4, vec3 } from 'gl-matrix';

export default class CprWrapper {
  private viewport: any
  private image: any
  private mapper: any
  private actor: any
  private centerline: any
  private widget: any
  private renderWindow: any
  private stretchRenderer: any
  private widgetState: any
  private cprManipulator: any
  private stretchViewType: any
  private useFallbackMapper: boolean = false
  private plane: string
  private rotationAngle: number = 0
  private centerlineDirection: vec3 | null = null
  private initialB: vec3 | null = null
  private initialN: vec3 | null = null
  private isInitialized: boolean = false
  private renderTimeout: any = null

  constructor(viewport: any, image: any, plane: string) {
    this.viewport = viewport
    this.image = image
    this.plane = plane
    this.centerline = vtkPolyData.newInstance()
    this.stretchRenderer = viewport.getRenderer();

    if (!this.stretchRenderer) {
      throw new Error('Viewport renderer not ready (enableElement not called yet).');
    }

    this.renderWindow = this.stretchRenderer.getRenderWindow();
    if (!this.renderWindow) {
      throw new Error('RenderWindow not available from renderer.');
    }
    this.widget = vtkResliceCursorWidget.newInstance();

    this.stretchViewType = ViewTypes.XZ_PLANE;
    this.widgetState = this.widget.getWidgetState();

    this.renderWindow.setNumberOfLayers(2);

    this.setupMapper();
    this.setupActor();
    this.setupInteractor();
    this.setupWidget();
  }

  private setupMapper() {
    try {
      this.mapper = vtkImageCPRMapper.newInstance();
      this.mapper.setBackgroundColor(0, 0, 0, 0);
      this.mapper.setImageData(this.image);
      this.mapper.useStraightenedMode();
      this.mapper.setCenterlineData(this.centerline);
      this.mapper.setWidth(0);

      console.log('Using ImageCPRMapper');
    } catch (error) {
      console.warn('ImageCPRMapper failed, falling back to ImageResliceMapper:', error);
      this.useFallbackMapper = true;

      this.mapper = vtkImageResliceMapper.newInstance();
      this.mapper.setInputData(this.image);
    }
  }  private setupActor() {
    this.actor = vtkImageSlice.newInstance();
    this.actor.setMapper(this.mapper);

    if (!this.useFallbackMapper) {
      this.cprManipulator = vtkCPRManipulator.newInstance({
        cprActor: this.actor,
      });
    }
  }

  private setupInteractor() {
    const interactor = this.renderWindow.getInteractor();
    interactor.setInteractorStyle(vtkInteractorStyleImage.newInstance());
    interactor.setDesiredUpdateRate(15.0);
  }

  private setupWidget() {
    this.widget.setImage(this.image);
    const imageDimensions = this.image.getDimensions();
    const imageSpacing = this.image.getSpacing();

    console.log("Image dimensions:", imageDimensions, "spacing:", imageSpacing);

    const diagonal = vec3.mul([] as any, imageDimensions, imageSpacing);

    if (!this.useFallbackMapper) {
      this.mapper.setWidth(2 * vec3.len(diagonal));
    }

    this.actor.setUserMatrix(
      this.widget.getResliceAxes(this.stretchViewType)
    );

    this.stretchRenderer.addActor(this.actor);

    this.widget.updateCameraPoints(
      this.stretchRenderer,
      this.stretchViewType,
      true,
      true
    );
  }

  private updateFallbackMapper() {
    const resliceAxes = this.widget.getResliceAxes(this.stretchViewType);

    if (this.mapper.setResliceAxes) {
      this.mapper.setResliceAxes(resliceAxes);
    }

    this.actor.setUserMatrix(resliceAxes);
    this.stretchRenderer.resetCamera();
  }

  /**
   * Detect centerline direction
   * Returns 'normal' or 'reversed'
   */
  private detectCenterlineDirection(points: number[][]): string {
    if (points.length < 2) return 'normal';

    let totalDeltaZ = 0;
    for (let i = 1; i < points.length; i++) {
      const deltaZ = points[i][2] - points[i-1][2];
      totalDeltaZ += deltaZ;
    }

    return totalDeltaZ > 0 ? 'reversed' : 'normal';
  }

  /** Set centerline from points array */
  setCenterline(points: any) {
    try {
      console.log('Setting centerline with points:', points);

      if (!points || !Array.isArray(points) || points.length < 2) {
        throw new Error('Invalid centerline points: need at least 2 points');
      }

      // Detect and reverse if needed
      const direction = this.detectCenterlineDirection(points);
      if (direction === 'reversed') {
        console.log('Detected reversed direction, flipping points order');
        points = [...points].reverse();
      }

      if (!this.image) {
        throw new Error('Image data not available');
      }

      const imageExtent = this.image.getExtent ? this.image.getExtent() : [0, 0, 0, 0, 0, 0];
      console.log('Image extent:', imageExtent);

      // Set centerline points
      const centerlinePoints = Float32Array.from(points.flat());
      const nPoints = points.length;

      this.centerline.getPoints().setData(centerlinePoints, 3);

      // Set polylines
      const centerlineLines = new Uint16Array(1 + nPoints);
      centerlineLines[0] = nPoints;
      for (let i = 0; i < nPoints; ++i) {
        centerlineLines[i + 1] = i;
      }
      this.centerline.getLines().setData(centerlineLines);

      this.mapper.setUseUniformOrientation(true);

      // Calculate centerline direction
      this.calculateCenterlineDirection(points);

      // Update mapper
      if (!this.useFallbackMapper && this.mapper.setCenterlineData) {
        this.mapper.setCenterlineData(this.centerline);
        this.mapper.modified();
      }

      // Add widget and actor
      this.viewport.addWidget('cpr', this.widget);
      this.viewport.setActors([{ uid: 'cprActor', actor: this.actor }]);

      // Wait for next frame to ensure actor is added
      requestAnimationFrame(() => {
        try {
          this.updateDistanceAndDirectionSimple();
          this.isInitialized = true;
          this.scheduleRender();

          console.log('CPR setup completed successfully');
        } catch (error) {
          console.error('Error in deferred CPR setup:', error);
        }
      });
    } catch (error) {
      console.error('Error setting centerline:', error);
      throw new Error(`Failed to set centerline`);
    }
  }

  /**
   * Calculate average centerline direction
   */
  private calculateCenterlineDirection(points: number[][]) {
    if (!points || points.length < 2) {
      console.warn('Not enough points to calculate centerline direction');
      this.centerlineDirection = null;
      return;
    }

    const sumDirection = vec3.fromValues(0, 0, 0);
    let validSegments = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = vec3.fromValues(points[i][0], points[i][1], points[i][2]);
      const p2 = vec3.fromValues(points[i + 1][0], points[i + 1][1], points[i + 1][2]);

      const direction = vec3.subtract(vec3.create(), p2, p1);
      const length = vec3.length(direction);

      if (length > 1e-6) {
        vec3.normalize(direction, direction);
        vec3.add(sumDirection, sumDirection, direction);
        validSegments++;
      }
    }

    if (validSegments === 0) {
      console.warn('No valid segments to calculate centerline direction');
      this.centerlineDirection = null;
      return;
    }

    vec3.scale(sumDirection, sumDirection, 1.0 / validSegments);
    vec3.normalize(sumDirection, sumDirection);

    this.centerlineDirection = sumDirection;

    console.log('Calculated centerline direction:', [
      sumDirection[0].toFixed(3),
      sumDirection[1].toFixed(3),
      sumDirection[2].toFixed(3)
    ]);
  }

  /**
   * Rotate CPR view by angle (in degrees)
   */
  rotateCPR(angle: number) {
    if (this.useFallbackMapper) {
      console.warn('Rotation not supported with fallback mapper');
      return;
    }

    if (!this.isInitialized) {
      console.warn('CPR not fully initialized yet, skipping rotation');
      return;
    }

    this.rotationAngle = ((angle % 360) + 360) % 360;

    console.log(`Rotating CPR to ${this.rotationAngle}°`);

    this.updateDistanceAndDirectionSimple();
    this.scheduleRender(true);
  }

  /**
   * Debounced render to prevent WebGL context loss
   */
  private scheduleRender(immediate: boolean = false) {
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }

    const renderFn = () => {
      try {
        if (!this.isInitialized) {
          console.warn('Skipping render - CPR not initialized');
          return;
        }

        const canvas = this.viewport.getCanvas();
        if (canvas) {
          const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
          if (gl && gl.isContextLost()) {
            console.error('❌ WebGL context is lost, skipping render');
            this.isInitialized = false;
            return;
          }
        }

        if (!this.mapper) {
          console.warn('Mapper not available, skipping render');
          return;
        }

        if (!this.actor || this.actor.getMapper() !== this.mapper) {
          console.warn('Actor-mapper connection invalid, skipping render');
          return;
        }

        this.stretchRenderer.resetCameraClippingRange();
        this.renderWindow.render();

        if (this.viewport?.render) {
          this.viewport.render();
        }
      } catch (error) {
        console.error('Render error:', error);

        if (error.message && error.message.includes('shader')) {
          console.error('Shader error detected, disabling further renders');
          this.isInitialized = false;
        }
      }

      this.renderTimeout = null;
    };

    if (immediate) {
      renderFn();
    } else {
      this.renderTimeout = setTimeout(renderFn, 16);
    }
  }

  updateDistanceAndDirectionSimple() {
    if (this.useFallbackMapper) {
      this.updateFallbackMapper();
      return;
    }

    if (!this.isInitialized && !this.centerlineDirection) {
      console.warn('Skipping update - not yet initialized');
      return;
    }

    // XÁC ĐỊNH HỆ TRỤC (B, N, T) DựA VÀO CENTERLINE GEOMETRY
    let B: vec3, N: vec3, T: vec3;

    if (!this.centerlineDirection) {
      console.error('No centerline direction available! Cannot determine coordinate system.');
      return;
    }

    // Tính initial B, N một lần duy nhất (nếu chưa có)
    if (!this.initialB || !this.initialN) {
      console.log('Computing initial coordinate system from centerline geometry');

      // T = hướng centerline (tangent)
      T = vec3.normalize(vec3.create(), this.centerlineDirection);

      // Tìm trục có component nhỏ nhất trong T để làm B ban đầu
      const absT = [Math.abs(T[0]), Math.abs(T[1]), Math.abs(T[2])];
      let minAxis = 0;
      if (absT[1] < absT[minAxis]) minAxis = 1;
      if (absT[2] < absT[minAxis]) minAxis = 2;

      // Tạo B ban đầu vuông góc với T
      const tempB = vec3.fromValues(0, 0, 0);
      tempB[minAxis] = 1.0;

      // B = (tempB - (tempB·T)*T), normalized
      const dotTempB = vec3.dot(tempB, T);
      vec3.scaleAndAdd(tempB, tempB, T, -dotTempB);
      B = vec3.normalize(vec3.create(), tempB);

      // N = T × B (right-handed system)
      N = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), T, B));

      // CRITICAL: Re-orthogonalize với centerlineDirection thực tế
      const centerlineAxis = vec3.normalize(vec3.create(), this.centerlineDirection);

      // Project B lên mặt phẳng vuông góc với centerlineAxis
      const dotB = vec3.dot(B, centerlineAxis);
      vec3.scaleAndAdd(B, B, centerlineAxis, -dotB);
      vec3.normalize(B, B);

      // Tính N = centerlineAxis × B để đảm bảo hệ trục vuông góc phải
      vec3.cross(N, centerlineAxis, B);
      vec3.normalize(N, N);

      // Update T to match centerlineAxis
      vec3.copy(T, centerlineAxis);

      // Lưu initial values
      this.initialB = vec3.clone(B);
      this.initialN = vec3.clone(N);

      console.log('Initial coordinate system:', {
        T: [T[0].toFixed(3), T[1].toFixed(3), T[2].toFixed(3)],
        B: [B[0].toFixed(3), B[1].toFixed(3), B[2].toFixed(3)],
        N: [N[0].toFixed(3), N[1].toFixed(3), N[2].toFixed(3)]
      });
    } else {
      // Dùng lại initial B, N đã tính
      console.log('Reusing initial coordinate system');
      T = vec3.normalize(vec3.create(), this.centerlineDirection);
      B = vec3.clone(this.initialB);
      N = vec3.clone(this.initialN);
    }

    // LOGIC XOAY OUTPUT CPR QUANH TRỤC CENTERLINE
    if (this.rotationAngle !== 0) {
      const angleRad = (this.rotationAngle * Math.PI) / 180;
      const centerlineAxis = vec3.normalize(vec3.create(), this.centerlineDirection);

      // Xoay B và N quanh centerlineAxis bằng Rodrigues formula
      const cosAngle = Math.cos(angleRad);
      const sinAngle = Math.sin(angleRad);

      // Xoay B
      const B_rotated = vec3.create();
      const crossAxisB = vec3.cross(vec3.create(), centerlineAxis, B);
      vec3.scale(B_rotated, B, cosAngle);
      vec3.scaleAndAdd(B_rotated, B_rotated, crossAxisB, sinAngle);
      vec3.normalize(B_rotated, B_rotated);

      // Xoay N
      const N_rotated = vec3.create();
      const crossAxisN = vec3.cross(vec3.create(), centerlineAxis, N);
      vec3.scale(N_rotated, N, cosAngle);
      vec3.scaleAndAdd(N_rotated, N_rotated, crossAxisN, sinAngle);
      vec3.normalize(N_rotated, N_rotated);

      // Cập nhật
      vec3.copy(B, B_rotated);
      vec3.copy(N, N_rotated);

      console.log(`CPR rotated ${this.rotationAngle}° around centerline`);
    }

    // 2) Gán hướng mẫu cho CPR mapper
    const dir = mat3.fromValues(
      B[0], B[1], B[2],
      N[0], N[1], N[2],
      T[0], T[1], T[2]
    );

    console.log('📐 Setting direction matrix:', {
      B: [B[0].toFixed(3), B[1].toFixed(3), B[2].toFixed(3)],
      N: [N[0].toFixed(3), N[1].toFixed(3), N[2].toFixed(3)],
      T: [T[0].toFixed(3), T[1].toFixed(3), T[2].toFixed(3)]
    });

    this.mapper.setDirectionMatrix(dir);
    this.mapper.modified();

    // 3) Tâm hiển thị C
    const bounds = this.image.getBounds?.() as number[];
    const C = bounds && bounds.length === 6
      ? vec3.fromValues(
          0.5 * (bounds[0] + bounds[1]),
          0.5 * (bounds[2] + bounds[3]),
          0.5 * (bounds[4] + bounds[5])
        )
      : vec3.fromValues(0, 0, 0);

    // 4) Khoảng cách dọc centerline
    const rawDistance = this.cprManipulator?.getCurrentDistance
      ? (this.cprManipulator.getCurrentDistance() || 0)
      : 0;

    // 5) Kích thước CPR
    const width  = Number.isFinite(this.mapper.getWidth())  ? this.mapper.getWidth()  : 50;
    const height = Number.isFinite(this.mapper.getHeight()) ? this.mapper.getHeight() : 200;

    let distance = Math.max(0, Math.min(height, rawDistance));

    // 6) Đặt actor trong world
    const translate = vec3.scaleAndAdd(vec3.create(), C, T, -0.5 * width);
    vec3.scaleAndAdd(translate, translate, N, distance - height);

    const M = mat4.fromValues(
      T[0], T[1], T[2], 0,
      N[0], N[1], N[2], 0,
      -B[0], -B[1], -B[2], 0,
      translate[0], translate[1], translate[2], 1
    );

    console.log('🎭 Setting actor matrix');
    this.actor.setUserMatrix(M);
    this.actor.modified();

    // 7) Đặt camera với auto-fit aspect ratio
    const cam = this.stretchRenderer.getActiveCamera();
    cam.setParallelProjection(true);

    // Tính toán parallel scale để auto-fit viewport
    const viewportSize = this.viewport.getCanvas()?.getBoundingClientRect();
    if (viewportSize && viewportSize.width > 0 && viewportSize.height > 0) {
      const aspectRatio = viewportSize.width / viewportSize.height;
      const cprAspectRatio = width / height;

      let optimalScale;
      if (cprAspectRatio > aspectRatio) {
        // CPR rộng hơn viewport -> fit theo width
        optimalScale = width / (2 * aspectRatio);
      } else {
        // CPR cao hơn viewport -> fit theo height
        optimalScale = height / 2;
      }

      // Zoom to: giảm scale để zoom 2.5x
      optimalScale *= 0.4; // Zoom to gấp 2.5 lần (1/0.4 = 2.5)
      cam.setParallelScale(optimalScale);

      console.log(`Auto-fit CPR with 2.5x zoom: viewport ${viewportSize.width}x${viewportSize.height}, scale ${optimalScale.toFixed(2)}`);
    } else {
      // Fallback với zoom 2.5x
      cam.setParallelScale(0.2 * height); // Zoom to gấp 2.5 lần so với 0.5
    }

    const focal = vec3.scaleAndAdd(vec3.create(), C, N, distance - 0.5 * height);
    const camBack = 1000;
    const camPos = vec3.scaleAndAdd(vec3.create(), focal, B, -camBack);

    cam.setFocalPoint(focal[0], focal[1], focal[2]);
    cam.setPosition(camPos[0], camPos[1], camPos[2]);
    cam.setViewUp(N[0], N[1], N[2]);
    cam.modified();

    console.log('📷 Camera setup:', {
      parallelScale: cam.getParallelScale().toFixed(2),
      viewUp: [N[0].toFixed(3), N[1].toFixed(3), N[2].toFixed(3)],
      rotationAngle: this.rotationAngle
    });

    // Don't render here - let scheduleRender handle it
    this.stretchRenderer.resetCameraClippingRange();
  }

  // Utility method to validate image data
  private validateImageData(image: any): boolean {
    try {
      // Check basic VTK image data methods
      if (!image.getDimensions || !image.getSpacing || !image.getOrigin) {
        console.warn('Image missing required VTK methods');
        return false;
      }

      const dims = image.getDimensions();
      const spacing = image.getSpacing();
      const origin = image.getOrigin();

      console.log('Image validation:', { dims, spacing, origin });

      // Check if dimensions are valid
      if (!dims || dims.some((d: number) => d <= 0)) {
        console.warn('Invalid image dimensions:', dims);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Image validation error:', error);
      return false;
    }
  }

  setVOI(voi) {
    const window = voi.upper - voi.lower;
    const level = (voi.upper + voi.lower) / 2;

    this.actor.getProperty().setColorWindow(window);
    this.actor.getProperty().setColorLevel(level);

    this.scheduleRender();
  }

  fitToViewport() {
    if (!this.isInitialized) {
      console.warn('CPR not initialized, skipping fit');
      return;
    }

    const bounds = this.actor.getBounds(); // [xmin,xmax, ymin,ymax, zmin,zmax]
    const center = [
      0.5 * (bounds[0] + bounds[1]),
      0.5 * (bounds[2] + bounds[3]),
      0.5 * (bounds[4] + bounds[5]),
    ];

    const camera = this.stretchRenderer.getActiveCamera();
    camera.setParallelProjection(true);
    camera.setFocalPoint(...center);

    // Xác định trục hiển thị chính theo plane
    let axis1 = 0, axis2 = 1; // mặc định axial: X,Y
    if (this.plane === 'sagittal') axis1 = 1, axis2 = 2; // Y,Z
    if (this.plane === 'coronal') axis1 = 0, axis2 = 2;  // X,Z

    const width = bounds[axis1*2+1] - bounds[axis1*2];
    const height = bounds[axis2*2+1] - bounds[axis2*2];

    // Lấy kích thước viewport
    const container = this.renderWindow.getContainer?.();
    const rw = container?.clientWidth || 800;
    const rh = container?.clientHeight || 600;
    const aspect = rw / rh;

    // Fit theo viewport: chọn max(scaleX, scaleY)
    const scaleX = (width / 2) / aspect;
    const scaleY = height / 2;
    let parallelScale = Math.max(scaleX, scaleY);

    const zoomFactor = 0.5
    parallelScale *= zoomFactor;

    camera.setParallelScale(parallelScale);

    // Đặt camera position theo plane
    if (this.plane === 'axial') {
      camera.setPosition(center[0], center[1], center[2] + 1000);
      camera.setViewUp(0, -1, 0);
    } else if (this.plane === 'coronal') {
      camera.setPosition(center[0], center[1] - 1000, center[2]);
      camera.setViewUp(0, 0, 1);
    } else if (this.plane === 'sagittal') {
      camera.setPosition(center[0] - 1000, center[1], center[2]);
      camera.setViewUp(0, 0, 1);
    }

    this.stretchRenderer.resetCameraClippingRange();
    this.scheduleRender();
  }

  // Method to safely render
  safeRender() {
    try {
      if (!this.validateImageData(this.image)) throw new Error('Invalid image');
      if (!this.viewport?.getRenderer?.()) throw new Error('Viewport/renderer not ready');
      if (!this.actor?.isA?.('vtkImageSlice')) throw new Error('Actor not a vtkImageSlice');
      if (!this.mapper?.isA?.('vtkImageCPRMapper') && !this.useFallbackMapper) {
        throw new Error('Mapper is not vtkImageCPRMapper');
      }
      this.fitToViewport();

      // Use scheduleRender instead of direct render
      this.scheduleRender();
    } catch (e) {
      console.error('Render error:', e);
      throw e;
    }
  }

  /**
   * Cleanup method to properly dispose of resources
   */
  dispose() {
    console.log('Disposing CPR wrapper');

    // Clear any pending render
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
      this.renderTimeout = null;
    }

    // Mark as not initialized
    this.isInitialized = false;

    // Remove actors and widgets
    try {
      if (this.stretchRenderer && this.actor) {
        this.stretchRenderer.removeActor(this.actor);
      }
    } catch (error) {
      console.warn('Error removing actor:', error);
    }

    // Clean up VTK objects
    if (this.mapper?.delete) this.mapper.delete();
    if (this.actor?.delete) this.actor.delete();
    if (this.centerline?.delete) this.centerline.delete();
    if (this.widget?.delete) this.widget.delete();

    // Clear references
    this.mapper = null;
    this.actor = null;
    this.centerline = null;
    this.widget = null;
    this.cprManipulator = null;
    this.centerlineDirection = null;
    this.initialB = null;
    this.initialN = null;

    console.log('CPR wrapper disposed');
  }

}
