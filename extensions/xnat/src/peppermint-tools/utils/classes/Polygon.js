import { store } from 'cornerstone-tools';

const modules = store.modules;

export default class Polygon {
  constructor(
    points,
    sopInstanceUid,
    seriesInstanceUid,
    structureSetUid,
    ROIContourUid,
    polygonUid,
    frameNumber,
    interpolated
  ) {
    this._polyPoints = this._deepCopyPoints(points);
    this._sopInstanceUid = sopInstanceUid;
    this._seriesInstanceUid = seriesInstanceUid;
    this._structureSetUid = structureSetUid;
    this._ROIContourUid = ROIContourUid;
    this._polygonUid = polygonUid;
    this._frameNumber = frameNumber;
    this._interpolated = interpolated;
  }

  _deepCopyPoints(points) {
    // Creates a deep copy of the points array
    const polyPoints = [];
    const isZ = points[0].z !== undefined;

    for (let i = 0; i < points.length; i++) {
      polyPoints.push({
        x: points[i].x,
        y: points[i].y,
      });

      if (isZ) {
        polyPoints[i].z = points[i].z;
      }
    }

    return polyPoints;
  }

  getFreehandToolData(importType) {
    const seriesInstanceUid = this._seriesInstanceUid;
    const structureSetUid = this._structureSetUid;
    const ROIContourUid = this._ROIContourUid;

    const freehand3DStore = modules.freehand3D;

    const referencedROIContour = freehand3DStore.getters.ROIContour(
      seriesInstanceUid,
      structureSetUid,
      ROIContourUid
    );
    const referencedStructureSet = freehand3DStore.getters.structureSet(
      seriesInstanceUid,
      structureSetUid
    );

    const data = {
      uid: this._polygonUid,
      seriesInstanceUid,
      structureSetUid,
      ROIContourUid,
      referencedROIContour,
      referencedStructureSet,
      visible: true,
      active: false,
      invalidated: true,
      handles: {
        points: [],
      },
    };

    if (this._sopInstanceUid) {
      data.sopInstanceUID = this._sopInstanceUid;
    }

    if (this._interpolated) {
      data.interpolated = true;
    }

    this._generatePoints(data.handles.points);

    data.handles.textBox = {
      active: false,
      hasMoved: false,
      movesIndependently: false,
      drawnIndependently: true,
      allowedOutsideImage: true,
      hasBoundingBox: true,
    };

    data.polyBoundingBox = {};

    data.toBeScaled = importType;

    return data;
  }

  _generatePoints(points) {
    // Construct data.handles.points array
    for (let i = 0; i < this._polyPoints.length; i++) {
      points.push(this._deepCopyOnePoint(i));
    }

    // Generate lines to be drawn
    for (let i = 0; i < points.length; i++) {
      if (i === points.length - 1) {
        points[i].lines.push(points[0]);
      } else {
        points[i].lines.push(points[i + 1]);
      }
    }
  }

  _deepCopyOnePoint(i) {
    let point = {
      x: this._polyPoints[i].x,
      y: this._polyPoints[i].y,
      lines: [],
    };

    if (this._polyPoints[i].z !== undefined) {
      point.z = this._polyPoints[i].z;
    }

    return point;
  }

  get polyPoints() {
    return this._polyPoints;
  }
  get sopInstanceUid() {
    return this._sopInstanceUid;
  }

  get uid() {
    return this._polygonUid;
  }

  get frameNumber() {
    return this._frameNumber;
  }
}
