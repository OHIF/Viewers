import * as cornerstoneTools from '@cornerstonejs/tools';
import XMLWriter from 'xml-writer';
import colorTools from '../../colorTools';
import viewerEquipmentAttributes from '../ViewerEquipmentAttributes';

const modules = cornerstoneTools.store.modules;

/**
 * @class AIMWriter - Extends the XMLWriter with some abstracted
 *                    AIM ImageAnnotationCollection writing functionality.
 */
export default class AIMWriter extends XMLWriter {
  constructor(name, label, dateTime) {
    super(true); // The argument 'true' just formats the XML with indentation such that it is human readable.
    this._name = name;
    this._label = label;
    this._shapeIdentifier = 0;
    this._imageAnnotationNumber = 0;
    this._imageAnnotationCollectionUUID = this._generateUUID();
    this._dateTime = dateTime;
    this._freehand3DStore = modules.freehand3D;
  }

  /**
   * writeImageAnnotationCollection - Write an ImageAnnotationCollection
   *                                  containing the given volumes.
   *
   * @param  {object[]} volumes   An array of the volumes.
   * @param  {object} seriesInfo Metadata regarding the series the annotations
   *                                    were drawn on.
   * @returns {null}
   */
  writeImageAnnotationCollection(volumes, seriesInfo) {
    this._seriesInfo = seriesInfo;
    this._referencedSopInstanceUids = [];
    this._startImageAnnotationCollection();
    this._addImageAnnotations(volumes);
    this._endImageAnnotationCollection();
  }

  /**
   * _startImageAnnotationCollection - Build the metadata header for the AIM
   *                                   ImageAnnotationCollection.
   *
   * @returns {null}
   */
  _startImageAnnotationCollection() {
    this.startDocument('1.0', 'UTF-8', false);
    this.startElement('ImageAnnotationCollection')
      .writeAttribute(
        'xmlns',
        'gme://caCORE.caCORE/4.4/edu.northwestern.radiology.AIM'
      )
      .writeAttribute(
        'xmlns:rdf',
        'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
      )
      .writeAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
      .writeAttribute('aimVersion', 'AIMv4_0')
      .writeAttribute(
        'xsi:schemaLocation',
        'gme://caCORE.caCORE/4.4/edu.northwestern.radiology.AIM AIM_v4_rv44_XML.xsd'
      );
    this._addProperty(
      'uniqueIdentifier',
      'root',
      this._imageAnnotationCollectionUUID
    );
    this._addDateTime();
    this._addProperty('description', 'value', this._name);
    this._addUser();
    this._addEquipment();
    this._addPerson();
    this.startElement('imageAnnotations');
  }

  /**
   * _endImageAnnotationCollection - Finishes the AIM ImageAnnotationCollection
   *                                 document.
   *
   * @returns {null}
   */
  _endImageAnnotationCollection() {
    this.endElement('imageAnnotations');
    this.endElement('ImageAnnotationCollection');
  }

  /**
   * _addUser - Adds user metadata to the header.
   *
   * @returns {null}
   */
  _addUser() {
    const userInfo = window.ohif.userInfo || {
      loginName: '',
      name: '',
    };

    this.startElement('user');
    this._addProperty('name', 'value', userInfo.name);
    this._addProperty('loginName', 'value', userInfo.loginName);
    this._addProperty('roleInTrial');
    this.endElement();
  }

  /**
   * _addEquipment - Adds equipment metadata to the header.
   *
   * @returns {null}
   */
  _addEquipment() {
    this.startElement('equipment');
    this._addProperty(
      'manufacturerName',
      'value',
      viewerEquipmentAttributes.Manufacturer
    );
    this._addProperty(
      'manufacturerModelName',
      'value',
      viewerEquipmentAttributes.ManufacturerModelName
    );
    this._addProperty(
      'softwareVersion',
      'value',
      viewerEquipmentAttributes.SoftwareVersions
    );
    this.endElement();
  }

  /**
   * _addPerson - Adds person metadata to the header.
   *
   * @returns {null}
   */
  _addPerson() {
    this.startElement('person');
    this._addProperty('name', 'value', this._seriesInfo.person.name);
    this._addProperty('id', 'value', this._seriesInfo.person.id);
    this._addProperty('birthDate', 'value', this._seriesInfo.person.birthDate);
    this._addProperty('sex', 'value', this._seriesInfo.person.sex);
    this._addProperty(
      'ethnicGroup',
      'value',
      this._seriesInfo.person.ethnicGroup
    );
    this.endElement();
  }

  /**
   * _addImageAnnotations - Add a list of volumes as ImageAnnotations.
   *
   * @param  {object[]} volumes An array of the volumes.
   * @returns {null}
   */
  _addImageAnnotations(volumes) {
    for (let i = 0; i < volumes.length; i++) {
      if (volumes[i] && volumes[i].length > 0) {
        this._addImageAnnotation(volumes[i], i);
      }
    }
  }

  /**
   * _addImageAnnotation - Adds an array of polygons as a single ImageAnnotation.
   *
   * @param  {Polygon[]} polygons An array of polygons.
   * @param  {number} ROIContourIndex The index of the annoation.
   * @returns {null}
   */
  _addImageAnnotation(polygons, ROIContourIndex) {
    this._referencedSopInstanceUids = [];
    this._shapeIdentifier = 0;

    this._startImageAnnotation(polygons, ROIContourIndex);
    this._addMarkupEntityCollection(polygons, ROIContourIndex);
    this._addImageReferenceEntityCollection();
    this._endImageAnnotation();
  }

  /**
   * _startImageAnnotation - Begin an AIM ImageAnnotation.
   *
   * @param  {Polygon[]} polygons An array of polygons.
   * @param  {number} ROIContourIndex The index of the annoation.
   * @returns {null}
   */
  _startImageAnnotation(polygons, ROIContourIndex) {
    this.startElement('ImageAnnotation');
    this._addImageAnnotationUniqueIdentifier(ROIContourIndex);
    this._addMultiProperty('typeCode', [
      { name: 'code', value: 'AnyClosedShape' },
      { name: 'codeSystem', value: ' ' },
      { name: 'codeSystemName', value: ' ' },
      { name: 'codeSystemVersion', value: ' ' },
    ]);
    this._addDateTime();
    this._addImageAnnotationName(ROIContourIndex);
  }

  /**
   * _endImageAnnotation - Ends an AIM ImageAnnotation.
   *
   * @returns {null}
   */
  _endImageAnnotation() {
    this.endElement('ImageAnnotation');
  }

  /**
   * _addMarkupEntityCollection - Adds an AIM markupEntityCollection.
   *
   * @param  {Polygon[]} polygons An array of polygons.
   * @returns {null}
   */
  _addMarkupEntityCollection(polygons) {
    this.startElement('markupEntityCollection');
    for (let i = 0; i < polygons.length; i++) {
      this._addMarkupEntity(polygons[i]);
    }
    this.endElement();
  }

  /**
   * _addMarkupEntity - Adds a single polygon as an AIM MarkupEntity.
   *
   * @param  {Polygon} polygon The polygon being added.
   * @returns {null}
   */
  _addMarkupEntity(polygon) {
    let lineColor;
    const rgb = colorTools.hexToRgb(polygon.color);
    if (rgb) {
      lineColor = `${rgb.r},${rgb.g},${rgb.b}`;
    }

    this.startElement('MarkupEntity').writeAttribute(
      'xsi:type',
      'TwoDimensionPolyline'
    );
    this._addProperty('uniqueIdentifier', 'root', `${polygon.uid}`);
    this._addProperty('shapeIdentifier', 'value', `${this._shapeIdentifier}`);
    this._addProperty('includeFlag', 'value', 'true'); //Note: no support for lesions with holes (.e.g. donuts) for now.
    if (lineColor) this._addProperty('lineColour', 'value', lineColor);
    this._addProperty('imageReferenceUid', 'root', polygon.sopInstanceUid);
    this._addProperty('referencedFrameNumber', 'value', polygon.frameNumber);
    this._addTwoDimensionSpatialCoordinateCollection(
      polygon.polyPoints,
      polygon.sopInstanceUid
    );
    this.endElement();

    this._shapeIdentifier++;
    this._addReferencedImage(polygon.sopInstanceUid);
  }

  /**
   * _addReferencedImage - Adds a referenced image to the list of referenced sop
   *                       instance UIDs.
   *
   * @param  {string} sopInstanceUid The sop instance UID.
   * @returns {null}
   */
  _addReferencedImage(sopInstanceUid) {
    if (this._referencedSopInstanceUids.includes(sopInstanceUid)) {
      return;
    }
    this._referencedSopInstanceUids.push(sopInstanceUid);
  }

  /**
   * _addImageReferenceEntityCollection - Adds an AIM Image imageReferenceEntityCollection.
   *
   * @returns {null}
   */
  _addImageReferenceEntityCollection() {
    this.startElement('imageReferenceEntityCollection');
    this.startElement('ImageReferenceEntity').writeAttribute(
      'xsi:type',
      'DicomImageReferenceEntity'
    );
    this._addProperty('uniqueIdentifier', 'root', `${this._generateUUID()}`);
    this._addImageStudy();
    this.endElement('ImageReferenceEntity');
    this.endElement('imageReferenceEntityCollection');
  }

  /**
   * _addImageStudy - Adds an AIM imageStudy.
   *
   * @returns {null}
   */
  _addImageStudy() {
    this.startElement('imageStudy');
    this._addProperty('instanceUid', 'root', this._seriesInfo.studyInstanceUid);
    this._addProperty('startDate', 'value', this._seriesInfo.startDate);
    this._addProperty('startTime', 'value', this._seriesInfo.startTime);
    this._addImageSeries();
    this.endElement();
  }

  /**
   * _addImageSeries - Adds an AIM imageSeries.
   *
   * @returns {null}
   */
  _addImageSeries() {
    this.startElement('imageSeries');
    this._addProperty(
      'instanceUid',
      'root',
      this._seriesInfo.seriesInstanceUid
    );
    this._addMultiProperty('modality', [
      { name: 'code', value: this._seriesInfo.modality },
      { name: 'codeSystem', value: '1.2.840.10008.2.16.4' },
      { name: 'codeSystemName', value: 'DCM' },
      { name: 'codeSystemVersion', value: '01' },
    ]);
    this._addImageCollection();
    this.endElement('imageSeries');
  }

  /**
   * _addImageCollection - adds and AIM imageCollection.
   *
   * @returns {null}
   */
  _addImageCollection() {
    this.startElement('imageCollection');
    for (let i = 0; i < this._referencedSopInstanceUids.length; i++) {
      this._addImage(
        this._seriesInfo.sopClassUid,
        this._referencedSopInstanceUids[i]
      );
    }
    this.endElement('');
  }

  /**
   * _addImage - Adds an AIM Image to the AIM imageCollection.
   *
   * @param  {string} sopClassUid    The sop class UID of the image.
   * @param  {string} sopInstanceUid The sop instance UID of the image.
   * @returns {null}
   */
  _addImage(sopClassUid, sopInstanceUid) {
    this.startElement('Image');
    this._addProperty('sopClassUid', 'root', sopClassUid);
    this._addProperty('sopInstanceUid', 'root', sopInstanceUid);
    this.endElement();
  }

  /**
   * _addDateTime - Adds a date/time field to the AIM file.
   *
   * @returns {null}
   */
  _addDateTime() {
    this._addProperty('dateTime', 'value', this._dateTime);
  }

  /**
   * _addImageAnnotationUniqueIdentifier - Adds the ROIContourUid as the AIM
   *                                    uniqueIdentifier of an AIM ImageAnnotation.
   *
   * @param  {number} ROIContourIndex The index of the ROIContour within the series.
   * @returns {null}
   */
  _addImageAnnotationUniqueIdentifier(ROIContourIndex) {
    const seriesInstanceUid = this._seriesInfo.seriesInstanceUid;
    const structureSet = this._freehand3DStore.getters.structureSet(
      seriesInstanceUid
    );
    const ROIContourUid =
      structureSet.ROIContourCollection[ROIContourIndex].uid;

    this._addProperty('uniqueIdentifier', 'root', ROIContourUid);
  }

  /**
   * _addImageAnnotationName - Adds the name of the ROIContour to the AIM name
   *                           of an AIM ImageAnnotation.
   *
   * @param  {number} ROIContourIndex The index of the ROIContour within the series.
   * @returns {null}
   */
  _addImageAnnotationName(ROIContourIndex) {
    const seriesInstanceUid = this._seriesInfo.seriesInstanceUid;
    const structureSet = this._freehand3DStore.getters.structureSet(
      seriesInstanceUid
    );
    const name = structureSet.ROIContourCollection[ROIContourIndex].name;

    this._addProperty('name', 'value', name);
  }

  /**
   * _addTwoDimensionSpatialCoordinateCollection - Adds an AIM
   *            twoDimensionSpatialCoordinateCollection to an AIM MarkupEntity.
   *
   * @param  {object[]} polyPoints  The verticies of the polygon.
   * @param  {string} sopInstanceUid The sop instance uid the polygon references.
   * @returns {null}
   */
  _addTwoDimensionSpatialCoordinateCollection(polyPoints, sopInstanceUid) {
    this.startElement('twoDimensionSpatialCoordinateCollection');
    for (let i = 0; i < polyPoints.length; i++) {
      this._addTwoDimensionSpatialCoordinate(polyPoints[i], i);
    }
    // For a closed polygon the AIM 4.0 specification requires that the first
    // Coordinate appear again at the end:
    this._addTwoDimensionSpatialCoordinate(polyPoints[0], 0);
    this.endElement();
  }

  /**
   * _addTwoDimensionSpatialCoordinate - Adds an AIM TwoDimensionSpatialCoordinate
   *            to an AIM twoDimensionSpatialCoordinateCollection
   *
   * @param  {object} point The point.
   * @param  {number} coordinateIndex The coordinateIndex.
   * @returns {null}
   */
  _addTwoDimensionSpatialCoordinate(point, coordinateIndex) {
    this.startElement('TwoDimensionSpatialCoordinate');
    this._addProperty('coordinateIndex', 'value', `${coordinateIndex}`);
    this._addProperty('x', 'value', `${point.x}`);
    this._addProperty('y', 'value', `${point.y}`);
    this.endElement();
  }

  /**
   * _addProperty - Adds a property to the AIM document.
   *
   * @param  {string} elementName    THe number of the element.
   * @param  {string} attributeName  THe name of the attribute.
   * @param  {string} attributeValue The value of the attribute.
   * @returns {null}
   */
  _addProperty(elementName, attributeName, attributeValue) {
    this.startElement(elementName)
      .writeAttribute(attributeName, attributeValue)
      .endElement();
  }

  /**
   * _addMultiProperty -  Adds a property with multiple attributes to the
   *                      AIM document.
   *
   * @param  {string} elementName The name of the element
   * @param  {object[]} attributes  the list of attributes.
   */
  _addMultiProperty(elementName, attributes) {
    this.startElement(elementName);
    for (let i = 0; i < attributes.length; i++) {
      this.writeAttribute(attributes[i].name, attributes[i].value);
    }
    this.endElement();
  }

  /**
   * _generateUUID - generates a UUID.
   *
   * @returns {string} The generated UUID.
   */
  _generateUUID() {
    // https://stackoverflow.com/a/8809472/9208320 Public Domain/MIT
    let d = new Date().getTime();

    if (
      typeof performance !== 'undefined' &&
      typeof performance.now === 'function'
    ) {
      d += performance.now(); // Use high-precision timer if available
    }

    return 'x.x.x.x.x.x.xxxx.xxx.x.x.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(
      /[xy]/g,
      function(c) {
        const r = (d + Math.random() * 16) % 16 | 0;

        d = Math.floor(d / 16);

        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
  }

  get seriesInfo() {
    return this._seriesInfo;
  }

  get imageAnnotationCollectionUUID() {
    return this._imageAnnotationCollectionUUID;
  }

  get date() {
    const dateTime = this._dateTime;
    const formatedDate = `${dateTime.slice(0, 4)}-${dateTime.slice(
      4,
      6
    )}-${dateTime.slice(6, 8)}`;

    return formatedDate;
  }

  get time() {
    const dateTime = this._dateTime;
    const formatedTime = `${dateTime.slice(8, 10)}:${dateTime.slice(
      10,
      12
    )}:${dateTime.slice(12, 14)}`;

    return formatedTime;
  }

  get label() {
    return this._label;
  }

  get name() {
    return this._name;
  }
}
