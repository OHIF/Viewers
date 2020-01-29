import MeasurementService from './MeasurementService.js';
import log from '../../log';

jest.mock('../../log.js');

describe('MeasurementService.js', () => {
  let measurementService;
  let measurement;
  let context;

  beforeAll(() => {
    measurementService = new MeasurementService();
  });

  beforeEach(() => {
    context = 'TestEnv';
    measurement = {
      sopInstanceUID: '123',
      frameOfReferenceUID: '1234',
      referenceSeriesUID: '12345',
      label: 'Label',
      description: 'Description',
      unit: 'mm',
      area: 123,
      type: measurementService.VALUE_TYPES.ELLIPSE,
      points: [],
      source: 'TestEnv',
      sourceToolType: 'EllipseRoi',
    };
    log.warn.mockClear();
    jest.clearAllMocks();
  });

  describe('getMeasurements()', () => {
    it('return all measurements', () => {
      const measurement2 = { ...measurement, label: 'Label2', unit: 'HU' };
      measurementService.addOrUpdate(measurement);
      measurementService.addOrUpdate(measurement2);
      const measurements = measurementService.getMeasurements();
      expect(measurements.length).toEqual(2);
      expect(measurements.length).toEqual(2);
    });
  });

  describe('getMeasurement()', () => {
    it('return measurement with given id', () => {
      const id = measurementService.addOrUpdate(measurement);
      const returnedMeasurement = measurementService.getMeasurement(id);

      /* Clear dynamic data */
      delete returnedMeasurement.modifiedTimestamp;

      expect({ id, ...measurement }).toEqual(returnedMeasurement);
    });
  });

  describe('addOrUpdate()', () => {
    it('adds new measurements with specific context', () => {
      measurementService.addOrUpdate(measurement);
      measurementService.addOrUpdate(measurement);
      const context = 'all';
      const measurements = measurementService.getMeasurements(context);
      expect(measurements.length).toBe(2);
    });
    it('adds new measurement with provided id', () => {
      const newMeasurement = { id: 1, ...measurement };

      /* Add new measurement */
      measurementService.addOrUpdate(newMeasurement);
      const savedMeasurement = measurementService.getMeasurement(newMeasurement.id);

      /* Clear dynamic data */
      delete newMeasurement.modifiedTimestamp;
      delete savedMeasurement.modifiedTimestamp;

      expect(newMeasurement).toEqual(savedMeasurement);
    });
    it('returns warning if adding invalid measurement', () => {
      measurement.invalidProperty = {};
      measurementService.addOrUpdate(measurement);
      expect(log.warn.mock.calls.length).toBe(3);
    });
    it('updates existent measurement', () => {
      const id = measurementService.addOrUpdate(measurement);
      measurement.unit = 'HU';
      measurementService.addOrUpdate({ id, ...measurement });
      const updatedMeasurement = measurementService.getMeasurement(id);
      expect(updatedMeasurement.unit).toBe('HU');
    });
    it('broadcasts changes', () => {
      measurementService._broadcastChange = jest.fn();
      measurementService.addOrUpdate(measurement, context);
      expect(measurementService._broadcastChange).toHaveBeenCalled();
    });
  });

  describe('subscribe()', () => {
    it('subscribers receive broadcasted add event with specified context', () => {
      const { MEASUREMENT_ADDED } = measurementService.EVENTS;
      let addCallbackWasCalled = false;

      /* Subscribe to add event */
      measurementService.subscribe(
        MEASUREMENT_ADDED,
        () => (addCallbackWasCalled = true),
        context
      );

      /* Add new measurement */
      measurementService.addOrUpdate(measurement, context);

      expect(addCallbackWasCalled).toBe(true);
    });
    it('subscribers receive broadcasted update event with specified context', () => {
      const { MEASUREMENT_UPDATED } = measurementService.EVENTS;
      let updateCallbackWasCalled = false;

      /* Subscribe to update event */
      measurementService.subscribe(
        MEASUREMENT_UPDATED,
        () => (updateCallbackWasCalled = true),
        context
      );

      /* Create measurement */
      const id = measurementService.addOrUpdate(measurement, context);

      /* Update measurement */
      measurementService.addOrUpdate({ id, ...measurement }, context);

      expect(updateCallbackWasCalled).toBe(true);
    });
    it('unsubscribes a listener with specified context', () => {
      let updateCallbackWasCalled = false;
      const { MEASUREMENT_ADDED } = measurementService.EVENTS;

      /* Subscribe to Add event */
      const { unsubscribe } = measurementService.subscribe(
        MEASUREMENT_ADDED,
        () => (updateCallbackWasCalled = true),
        context
      );

      /* Unsubscribe */
      unsubscribe();

      /* Create measurement */
      measurementService.addOrUpdate(measurement, context);

      expect(updateCallbackWasCalled).toBe(false);
    });
  });
});
