import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkResliceCursorWidget from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget';
import { ViewTypes } from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';
import vtkImageCPRMapper from '@kitware/vtk.js/Rendering/Core/ImageCPRMapper';
import vtkCPRManipulator from '@kitware/vtk.js/Widgets/Manipulators/CPRManipulator';
import vtkImageResliceMapper from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper';
import { mat3, mat4, vec3 } from 'gl-matrix';
import { planar } from '@cornerstonejs/tools/utilities';

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
      // Try to use ImageCPRMapper first
      this.mapper = vtkImageCPRMapper.newInstance();
      this.mapper.setBackgroundColor(0, 0, 0, 0);
      this.mapper.setImageData(this.image);
      this.mapper.useStraightenedMode(); // Use straightened mode for better visualization
      this.mapper.setCenterlineData(this.centerline);
      this.mapper.setWidth(0);

      console.log('Using ImageCPRMapper');
    } catch (error) {
      console.warn('ImageCPRMapper failed, falling back to ImageResliceMapper:', error);
      this.useFallbackMapper = true;

      // Fallback to regular reslice mapper
      this.mapper = vtkImageResliceMapper.newInstance();
      this.mapper.setInputData(this.image);
    }
  }

  private setupActor() {
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
    // Simplified update for fallback mapper
    const widgetPlanes = this.widgetState.getPlanes();
    const resliceAxes = this.widget.getResliceAxes(this.stretchViewType);

    if (this.mapper.setResliceAxes) {
      this.mapper.setResliceAxes(resliceAxes);
    }

    this.actor.setUserMatrix(resliceAxes);
    this.stretchRenderer.resetCamera();
  }

  /** Gán centerline từ array { points: [[x,y,z],...]] } */
  setCenterline(points: any) {
    try {
      console.log('Setting centerline with points:', points);

      // Validate input
      if (!points || !Array.isArray(points) || points.length < 2) {
        throw new Error('Invalid centerline points: need at least 2 points');
      }

      // Ensure image is properly set up
      if (!this.image) {
        throw new Error('Image data not available');
      }

      // Check if image has proper extents method
      const imageExtent = this.image.getExtent ? this.image.getExtent() : [0, 0, 0, 0, 0, 0];
      console.log('Image extent:', imageExtent);

      // Set positions of the centerline (model coordinates)
      const centerlinePoints = Float32Array.from(points.flat());
      const nPoints = points.length;

      this.centerline.getPoints().setData(centerlinePoints, 3);

      // Set polylines of the centerline
      const centerlineLines = new Uint16Array(1 + nPoints);
      centerlineLines[0] = nPoints;
      for (let i = 0; i < nPoints; ++i) {
        centerlineLines[i + 1] = i;
      }
      this.centerline.getLines().setData(centerlineLines);

      this.mapper.setUseUniformOrientation(true);

      // Update mapper with centerline data
      if (!this.useFallbackMapper && this.mapper.setCenterlineData) {
        this.mapper.setCenterlineData(this.centerline);
      }

      //this.updateDistanceAndDirection();
      this.updateDistanceAndDirectionSimple(this.plane); // Update for axial view
      // Add widget and actor to viewport
      this.viewport.addWidget('cpr', this.widget);
      this.viewport.setActors([{ uid: 'cprActor', actor: this.actor }]);

      console.log('CPR setup completed successfully');
    } catch (error) {
      console.error('Error setting centerline:', error);
      throw new Error(`Failed to set centerline`);
    }
  }

  updateDistanceAndDirectionSimple(view: string) {
    if (this.useFallbackMapper) {
      this.updateFallbackMapper();
      return;
    }

    // 1) Chọn cơ sở (B,N,T) theo mặt
    // B = bitangent = pháp tuyến mặt (hướng nhìn CPR)
    // N = up trong mặt, T = B × N
    let B: vec3, N: vec3;
    console.log("PLANE", view)
    switch (view) {
      case 'axial':
        B = vec3.fromValues(0, 0, -1);   // top-down
        N = vec3.fromValues(-1, 0, 0);   // up = -X
        break;
      case 'coronal':
        B = vec3.fromValues(0, -1, 0);   // nhìn từ trước ra sau
        N = vec3.fromValues(0, 0, 1);    // up = +Z
        break;
      case 'sagittal':
        B = vec3.fromValues(-1, 0, 0);   // nhìn từ trái sang phải
        N = vec3.fromValues(0, 0, 1);    // up = +Z
        break;
    }
    const T = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), B, N));

    // 2) Gán hướng mẫu cho CPR mapper: cột = [B, N, T]
    const dir = mat3.fromValues(
      B[0], B[1], B[2],
      N[0], N[1], N[2],
      T[0], T[1], T[2]
    );
    this.mapper.setDirectionMatrix(dir);

    // 3) Tâm hiển thị C: lấy center của image
    //    Dựa vào bounds để an toàn
    const bounds = this.image.getBounds?.() as number[]; // [xmin,xmax,ymin,ymax,zmin,zmax]
    const C = bounds && bounds.length === 6
      ? vec3.fromValues(
        0.5 * (bounds[0] + bounds[1]),
        0.5 * (bounds[2] + bounds[3]),
        0.5 * (bounds[4] + bounds[5])
      )
      : vec3.fromValues(0, 0, 0);

    // 4) Khoảng cách dọc centerline (nếu có manipulator)
    const rawDistance = this.cprManipulator?.getCurrentDistance
      ? (this.cprManipulator.getCurrentDistance() || 0)
      : 0;

    // 5) Kích thước CPR (fallback an toàn)
    const width  = Number.isFinite(this.mapper.getWidth())  ? this.mapper.getWidth()  : 50;
    const height = Number.isFinite(this.mapper.getHeight()) ? this.mapper.getHeight() : 200;

    // Clamp distance
    let distance = Math.max(0, Math.min(height, rawDistance));

    // 6) Đặt actor trong world: cột 0=T, cột 1=N, cột 2=-B (camera lùi theo -B)
    const translate = vec3.scaleAndAdd(vec3.create(), C, T, -0.5 * width);
    vec3.scaleAndAdd(translate, translate, N, distance - height);

    const M = mat4.fromValues(
      T[0], T[1], T[2], 0,
      N[0], N[1], N[2], 0,
      -B[0], -B[1], -B[2], 0,
      translate[0], translate[1], translate[2], 1
    );
    this.actor.setUserMatrix(M);

    // 7) Đặt camera trực tiếp (song song với B, up = N)
    const cam = this.stretchRenderer.getActiveCamera();
    cam.setParallelProjection(true);
    cam.setParallelScale(0.5 * height);

    const focal = vec3.scaleAndAdd(vec3.create(), C, N, distance - 0.5 * height);
    const camBack = 1000; // tuỳ dataset
    const camPos = vec3.scaleAndAdd(vec3.create(), focal, B, -camBack);

    cam.setFocalPoint(focal[0], focal[1], focal[2]);
    cam.setPosition(camPos[0], camPos[1], camPos[2]);
    cam.setViewUp(N[0], N[1], N[2]);

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

    this.renderWindow.render();
  }

  fitToViewport() {
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
    this.renderWindow.render();
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
      this.viewport.render?.();
    } catch (e) {
      console.error('Render error:', e);
      throw e;
    }
  }

}