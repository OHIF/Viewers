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
      StudyInstanceUID: '1234',
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
  let displaySetServiceMock;
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
    displaySetServiceMock = {
      getDisplaySetForSOPInstanceUID: (SOPInstanceUID, SeriesInstanceUID) => {
        console.warn('SOPInstanceUID');

        return {
          displaySetInstanceUID: '1.2.3.4'
        }
      }
    };
    mappings = measurementServiceMappingsFactory(measurementServiceMock, displaySetServiceMock);
    handles = { start: { x: 1, y: 2 }, end: { x: 1, y: 2 } };
    points = [
      { x: 1, y: 2 },
      { x: 1, y: 2 },
    ];
    csToolsAnnotation = {
      toolName: definition,
      measurementData: {
        id: 1,
        label: 'Test',
        SOPInstanceUID: '123',
        FrameOfReferenceUID: '123',
        SeriesInstanceUID: '123',
        handles,
        text: 'Test',
        description: 'Test',
        unit: 'mm',
        length: undefined
      },
    };
    measurement = {
      id: 1,
      SOPInstanceUID: '123',
      FrameOfReferenceUID: '123',
      referenceSeriesUID: '123',
      referenceStudyUID: '1234',
      displaySetInstanceUID: '1.2.3.4',
      label: 'Test',
      description: 'Test',
      unit: 'mm',
      type: measurementServiceMock.VALUE_TYPES.POLYLINE,
      points,
    };
    jest.clearAllMocks();
  });

  /*describe('toAnnotation()', () => {
    it('map measurement service format to annotation', async () => {
      const mappedMeasurement = await mappings[csToolsAnnotation.toolName].toAnnotation(
        measurement,
        definition
      );
      expect(mappedMeasurement).toEqual(csToolsAnnotation);
    });
  });*/

  describe('toMeasurement()', () => {
    it('map annotation to measurement service format', async () => {
      const getValueTypeFromToolType = (toolType) => 'valueType';
      const mappedAnnotation = await mappings[csToolsAnnotation.toolName].toMeasurement(csToolsAnnotation, displaySetServiceMock, getValueTypeFromToolType);
      expect(mappedAnnotation).toEqual(measurement);
    });
  });
});
