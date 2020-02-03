import MeasurementService from './MeasurementService.js';
import log from '../../log';

jest.mock('../../log.js');

describe('MeasurementService.js', () => {
  let measurementService;
  let measurement;
  let source;
  let definition;
  let matchingCriteria;
  let toAnnotation;
  let toMeasurement;
  let annotation;

  beforeEach(() => {
    measurementService = new MeasurementService();
    source = measurementService.createSource('test', '1');
    annotation = {
      toolName: 'Length',
      measurementData: {},
    };
    definition = 'Length';
    measurement = {
      sopInstanceUID: '123',
      frameOfReferenceUID: '1234',
      referenceSeriesUID: '12345',
      label: 'Label',
      description: 'Description',
      unit: 'mm',
      area: 123,
      type: measurementService.VALUE_TYPES.POLYLINE,
      points: [],
      source: source,
    };
    toAnnotation = () => annotation;
    toMeasurement = () => measurement;
    matchingCriteria = {
      valueType: measurementService.VALUE_TYPES.POLYLINE,
      points: 2,
    };
    measurementService.addMapping(
      source,
      'Length',
      matchingCriteria,
      toAnnotation,
      toMeasurement
    );
    log.warn.mockClear();
    jest.clearAllMocks();
  });

  describe('getMeasurements()', () => {
    it('return all measurements', () => {
      const anotherMeasurement = {
        ...measurement,
        label: 'Label2',
        unit: 'HU',
      };

      source.addOrUpdate(definition, measurement);
      source.addOrUpdate(definition, anotherMeasurement);

      const measurements = measurementService.getMeasurements();

      expect(measurements.length).toEqual(2);
      expect(measurements.length).toEqual(2);
    });
  });

  describe('getMeasurement()', () => {
    it('return measurement with given id', () => {
      const id = source.addOrUpdate(definition, measurement);
      const returnedMeasurement = measurementService.getMeasurement(id);

      /* Clear dynamic data */
      delete returnedMeasurement.modifiedTimestamp;

      expect({ id, ...measurement }).toEqual(returnedMeasurement);
    });
  });

  describe('addOrUpdate()', () => {
    it('adds new measurements', () => {
      source.addOrUpdate(definition, measurement);
      source.addOrUpdate(definition, measurement);

      const measurements = measurementService.getMeasurements();

      expect(measurements.length).toBe(2);
    });

    it('adds new measurement with custom id', () => {
      const newMeasurement = { id: 1, ...measurement };

      /* Add new measurement */
      source.addOrUpdate(definition, newMeasurement);
      const savedMeasurement = measurementService.getMeasurement(newMeasurement.id);

      /* Clear dynamic data */
      delete newMeasurement.modifiedTimestamp;
      delete savedMeasurement.modifiedTimestamp;

      expect(newMeasurement).toEqual(savedMeasurement);
    });

    it('returns warning if adding invalid measurement', () => {
      measurement.invalidProperty = {};

      source.addOrUpdate(definition, measurement);

      expect(log.warn.mock.calls.length).toBe(3);
    });

    it('updates existent measurement', () => {
      const id = source.addOrUpdate(definition, measurement);

      measurement.unit = 'HU';

      source.addOrUpdate(definition, { id, ...measurement });
      const updatedMeasurement = measurementService.getMeasurement(id);

      expect(updatedMeasurement.unit).toBe('HU');
    });
  });

  describe('subscribe()', () => {
    it('subscribers receive broadcasted add event', () => {
      const { MEASUREMENT_ADDED } = measurementService.EVENTS;
      let addCallbackWasCalled = false;

      /* Subscribe to add event */
      measurementService.subscribe(
        MEASUREMENT_ADDED,
        () => (addCallbackWasCalled = true)
      );

      /* Add new measurement */
      source.addOrUpdate(definition, measurement);

      expect(addCallbackWasCalled).toBe(true);
    });

    it('subscribers receive broadcasted update event', () => {
      const { MEASUREMENT_UPDATED } = measurementService.EVENTS;
      let updateCallbackWasCalled = false;

      /* Subscribe to update event */
      measurementService.subscribe(
        MEASUREMENT_UPDATED,
        () => (updateCallbackWasCalled = true)
      );

      /* Create measurement */
      const id = source.addOrUpdate(definition, measurement);

      /* Update measurement */
      source.addOrUpdate(definition, { id, ...measurement });

      expect(updateCallbackWasCalled).toBe(true);
    });

    it('unsubscribes a listener', () => {
      let updateCallbackWasCalled = false;
      const { MEASUREMENT_ADDED } = measurementService.EVENTS;

      /* Subscribe to Add event */
      const { unsubscribe } = measurementService.subscribe(
        MEASUREMENT_ADDED,
        () => (updateCallbackWasCalled = true)
      );

      /* Unsubscribe */
      unsubscribe();

      /* Create measurement */
      source.addOrUpdate(definition, measurement);

      expect(updateCallbackWasCalled).toBe(false);
    });
  });
});
