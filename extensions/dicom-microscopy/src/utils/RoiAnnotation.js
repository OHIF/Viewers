import areaOfPolygon from './areaOfPolygon';

import { PubSubService } from '@ohif/core';

const EVENTS = {
  LABEL_UPDATED: 'labelUpdated',
  GRAPHIC_UPDATED: 'graphicUpdated',
  VIEW_UPDATED: 'viewUpdated',
  REMOVED: 'removed',
};

/**
 * Represents a single annotation for the Microscopy Viewer
 */
class RoiAnnotation extends PubSubService {
  constructor(roiGraphic, studyInstanceUID, seriesInstanceUID, label = '', viewState = null) {
    super(EVENTS);
    this.uid = roiGraphic.uid;
    this.roiGraphic = roiGraphic;
    this.studyInstanceUID = studyInstanceUID;
    this.seriesInstanceUID = seriesInstanceUID;
    this.label = label;
    this.viewState = viewState;
    this.setMeasurements(roiGraphic);
  }

  getScoord3d() {
    const roiGraphic = this.roiGraphic;

    const roiGraphicSymbols = Object.getOwnPropertySymbols(roiGraphic);
    const _scoord3d = roiGraphicSymbols.find(s => String(s) === 'Symbol(scoord3d)');

    return roiGraphic[_scoord3d];
  }

  getCoordinates() {
    const scoord3d = this.getScoord3d();
    const scoord3dSymbols = Object.getOwnPropertySymbols(scoord3d);

    const _coordinates = scoord3dSymbols.find(s => String(s) === 'Symbol(coordinates)');

    const coordinates = scoord3d[_coordinates];
    return coordinates;
  }

  /**
   * When called will trigger the REMOVED event
   */
  destroy() {
    this._broadcastEvent(EVENTS.REMOVED, this);
  }

  /**
   * Updates the ROI graphic for the annotation and triggers the GRAPHIC_UPDATED
   * event
   *
   * @param {Object} roiGraphic
   */
  setRoiGraphic(roiGraphic) {
    this.roiGraphic = roiGraphic;
    this.setMeasurements();
    this._broadcastEvent(EVENTS.GRAPHIC_UPDATED, this);
  }

  /**
   * Update ROI measurement values based on its scoord3d coordinates.
   *
   * @returns {void}
   */
  setMeasurements() {
    const type = this.roiGraphic.scoord3d.graphicType;
    const coordinates = this.roiGraphic.scoord3d.graphicData;

    switch (type) {
      case 'ELLIPSE':
        // This is a circle so only need one side
        const point1 = coordinates[0];
        const point2 = coordinates[1];

        let xLength2 = point2[0] - point1[0];
        let yLength2 = point2[1] - point1[1];

        xLength2 *= xLength2;
        yLength2 *= yLength2;

        const length = Math.sqrt(xLength2 + yLength2);
        const radius = length / 2;

        const areaEllipse = Math.PI * radius * radius;
        this._area = areaEllipse;
        this._length = undefined;
        break;

      case 'POLYGON':
        const areaPolygon = areaOfPolygon(coordinates);
        this._area = areaPolygon;
        this._length = undefined;
        break;

      case 'POINT':
        this._area = undefined;
        this._length = undefined;
        break;

      case 'POLYLINE':
        let len = 0;
        for (let i = 1; i < coordinates.length; i++) {
          const p1 = coordinates[i - 1];
          const p2 = coordinates[i];

          let xLen = p2[0] - p1[0];
          let yLen = p2[1] - p1[1];

          xLen *= xLen;
          yLen *= yLen;
          len += Math.sqrt(xLen + yLen);
        }

        this._area = undefined;
        this._length = len;
        break;
    }
  }

  /**
   * Update the OpenLayer Map's view state for the annotation and triggers the
   * VIEW_UPDATED event
   *
   * @param {Object} viewState The new view state for the annotation
   */
  setViewState(viewState) {
    this.viewState = viewState;
    this._broadcastEvent(EVENTS.VIEW_UPDATED, this);
  }

  /**
   * Update the label for the annotation and triggers the LABEL_UPDATED event
   *
   * @param {String} label New label for the annotation
   */
  setLabel(label, finding) {
    this.label = label || (finding && finding.CodeMeaning);
    this.finding = finding || {
      CodingSchemeDesignator: '@ohif/extension-dicom-microscopy',
      CodeValue: label,
      CodeMeaning: label,
    };
    this._broadcastEvent(EVENTS.LABEL_UPDATED, this);
  }

  /**
   * Returns the geometry type of the annotation concatenated with the label
   * defined for the annotation.
   * Difference with getDetailedLabel() is that this will return empty string for empty
   * label.
   *
   * @returns {String} Text with geometry type and label
   */
  getLabel() {
    const label = this.label ? `${this.label}` : '';
    return label;
  }

  /**
   * Returns the geometry type of the annotation concatenated with the label
   * defined for the annotation
   *
   * @returns {String} Text with geometry type and label
   */
  getDetailedLabel() {
    const label = this.label ? `${this.label}` : '(empty)';
    return label;
  }

  getLength() {
    return this._length;
  }

  getArea() {
    return this._area;
  }
}

export { EVENTS };

export default RoiAnnotation;
