import measurementServiceMappingsFactory from './measurementServiceMappingsFactory';

jest.mock('cornerstone-core', () => ({
  ...jest.requireActual('cornerstone-core'),
  getEnabledElement: () => ({
    image: { imageId: 123 },
  }),
  metaData: {
    ...jest.requireActual('cornerstone-core').metaData,
    get: () => ({
      SOPInstanceUID: '123',
      FrameOfReferenceUID: '123',
      SeriesInstanceUID: '123',
    }),
  },
}));

describe('measurementServiceMappings.js', () => {
  let mappings;
  let handles;
  let points;
  let csToolsAnnotation;
  let measurement;
  let measurementServiceMock;
  let definition = 'Length';

  beforeEach(() => {
    measurementServiceMock = {
      VALUE_TYPES: {
        POLYLINE: 'value_type::polyline',
        POINT: 'value_type::point',
        ELLIPSE: 'value_type::ellipse',
        MULTIPOINT: 'value_type::multipoint',
        CIRCLE: 'value_type::circle',
      },
    };
    mappings = measurementServiceMappingsFactory(measurementServiceMock);
    handles = { start: { x: 1, y: 2 }, end: { x: 1, y: 2 } };
    points = [{ x: 1, y: 2 }, { x: 1, y: 2 }];
    csToolsAnnotation = {
      toolName: definition,
      measurementData: {
        _measurementServiceId: 1,
        sopInstanceUid: '123',
        frameOfReferenceUID: '123',
        SeriesInstanceUID: '123',
        handles,
        text: 'Test',
        description: 'Test',
        unit: 'mm',
      },
    };
    measurement = {
      id: 1,
      SOPInstanceUID: '123',
      FrameOfReferenceUID: '123',
      referenceSeriesUID: '123',
      label: 'Test',
      description: 'Test',
      unit: 'mm',
      type: measurementServiceMock.VALUE_TYPES.POLYLINE,
      points: points,
    };
    jest.clearAllMocks();
  });

  describe('toAnnotation()', () => {
    it('map measurement service format to annotation', async () => {
      const mappedMeasurement = await mappings.toAnnotation(
        measurement,
        definition
      );
      expect(mappedMeasurement).toEqual(csToolsAnnotation);
    });
  });

  describe('toMeasurement()', () => {
    it('map annotation to measurement service format', async () => {
      const mappedAnnotation = await mappings.toMeasurement(csToolsAnnotation);
      expect(mappedAnnotation).toEqual(measurement);
    });
  });
});
