import measurementServiceMappingsFactory from './measurementServiceMappingsFactory';
import { MeasurementService as MeasurementServiceFactory } from '@ohif/core';

describe('measurementServiceMappings.js', () => {
  let measurementServiceMappings;
  let handles;
  let points;
  let eventData;
  let measurement;
  let annotation;
  let attributes;
  let measurementService;

  beforeEach(() => {
    attributes = {
      sopInstanceUid: '123',
      frameOfReferenceUid: '123',
      seriesInstanceUid: '123',
    };
    measurementService = new MeasurementServiceFactory.create();
    measurementServiceMappings = measurementServiceMappingsFactory(measurementService);
    measurementServiceMappings._getAttributes = jest.fn(() => attributes);
    handles = { start: { x: 1, y: 2 }, end: { x: 1, y: 2 } };
    points = [{ x: 1, y: 2 }, { x: 1, y: 2 }];
    eventData = {
      toolName: 'ArrowAnnotate',
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
      toolName: 'ArrowAnnotate',
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
      type: measurementService.VALUE_TYPES.POINT,
      points: points,
      source: 'cornerstone',
      sourceToolType: 'ArrowAnnotate',
    };
    jest.clearAllMocks();
  });

  describe('toAnnotation()', () => {
    it('map measurement service format to annotation', async () => {
      const mappedMeasurement = await measurementServiceMappings.toAnnotation({ id: 1, ...measurement });
      expect(mappedMeasurement).toEqual(annotation);
    });
  });

  describe('toMeasurement()', () => {
    it('map annotation to measurement service format', async () => {
      const mappedAnnotation = await measurementServiceMappings.toMeasurement(eventData);
      expect(mappedAnnotation).toEqual(measurement);
    });
  });

  describe('_getPointsFromHandles()', () => {
    it('converts handles to points', () => {
      const convertedHandles = measurementServiceMappings._getPointsFromHandles(handles);
      expect(convertedHandles).toEqual(points);
    });
  });

  describe('_getHandlesFromPoints()', () => {
    it('converts points to handles', () => {
      const convertedPoints = measurementServiceMappings._getHandlesFromPoints(points);
      expect(convertedPoints).toEqual(handles);
    });
  });
});
