import measurementServiceMappingsFactory from './measurementServiceMappingsFactory';

describe('measurementServiceMappings.js', () => {
  let mappings;
  let handles;
  let points;
  let eventData;
  let measurement;
  let annotation;
  let attributes;
  let measurementServiceMock;
  let definition = 'Length';

  beforeEach(() => {
    attributes = {
      sopInstanceUid: '123',
      frameOfReferenceUid: '123',
      seriesInstanceUid: '123',
    };
    measurementServiceMock = {
      VALUE_TYPES: {
        POLYLINE: 'value_type::polyline',
        POINT: 'value_type::point',
        ELLIPSE: 'value_type::ellipse',
        MULTIPOINT: 'value_type::multipoint',
        CIRCLE: 'value_type::circle',
      },
    };
    mappings = {
      ...measurementServiceMappingsFactory(measurementServiceMock),
      _getAttributes: jest.fn(() => attributes),
    };
    handles = { start: { x: 1, y: 2 }, end: { x: 1, y: 2 } };
    points = [{ x: 1, y: 2 }, { x: 1, y: 2 }];
    eventData = {
      toolName: definition,
      element: null,
      measurementData: {
        sopInstanceUid: '123',
        frameOfReferenceUid: '123',
        seriesInstanceUid: '123',
        handles,
        text: 'Test',
        description: 'Test',
        unit: 'mm',
        cachedStats: {
          area: 123,
        },
      },
    };
    annotation = {
      toolName: definition,
      measurementData: {
        sopInstanceUid: '123',
        frameOfReferenceUid: '123',
        seriesInstanceUid: '123',
        unit: 'mm',
        text: 'Test',
        description: 'Test',
        handles,
        _measurementServiceId: 1,
      },
    };
    measurement = {
      sopInstanceUID: '123',
      frameOfReferenceUID: '123',
      referenceSeriesUID: '123',
      label: 'Test',
      description: 'Test',
      unit: 'mm',
      area: 123,
      type: measurementServiceMock.VALUE_TYPES.POINT,
      points: points,
      source: {},
    };
    jest.clearAllMocks();
  });

  describe('toAnnotation()', () => {
    it('map measurement service format to annotation', async () => {
      const mappedMeasurement = await mappings.toAnnotation(
        { id: 1, ...measurement },
        definition
      );
      expect(mappedMeasurement).toEqual(annotation);
    });
  });

  describe('toMeasurement()', () => {
    it('map annotation to measurement service format', async () => {
      const mappedAnnotation = await mappings.toMeasurement(eventData);
      expect(mappedAnnotation).toEqual(measurement);
    });
  });
});
