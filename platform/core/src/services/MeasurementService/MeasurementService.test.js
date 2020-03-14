import MeasurementService from './MeasurementService.js';
import log from '../../log';

jest.mock('../../log.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

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
    source = measurementService.createSource('Test', '1');
    definition = 'Length';
    annotation = {
      toolName: definition,
      measurementData: {},
    };
    measurement = {
      SOPInstanceUID: '123',
      FrameOfReferenceUID: '1234',
      referenceSeriesUID: '12345',
      label: 'Label',
      description: 'Description',
      unit: 'mm',
      area: 123,
      type: measurementService.VALUE_TYPES.POLYLINE,
      points: [{ x: 1, y: 2 }, { x: 1, y: 2 }],
      source: source,
    };
    toAnnotation = () => annotation;
    toMeasurement = () => measurement;
    matchingCriteria = {
      valueType: measurementService.VALUE_TYPES.POLYLINE,
      points: 2,
    };
    log.warn.mockClear();
    jest.clearAllMocks();
  });

  describe('createSource()', () => {
    it('creates new source with name and version', () => {
      measurementService.createSource('Testing', '1');
    });

    it('logs warning and return early if no name provided', () => {
      measurementService.createSource(null, '1');

      expect(log.warn.mock.calls.length).toBe(1);
    });

    it('logs warning and return early if no version provided', () => {
      measurementService.createSource('Testing', null);

      expect(log.warn.mock.calls.length).toBe(1);
    });
  });

  describe('addMapping()', () => {
    it('adds new mapping', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );
    });

    it('logs warning and return early if no matching criteria provided', () => {
      measurementService.addMapping(
        source,
        definition,
        null,
        toAnnotation,
        toMeasurement
      );

      expect(log.warn.mock.calls.length).toBe(1);
    });

    it('logs warning and return early if invalid source provided', () => {
      const invalidSoure = {};

      measurementService.addMapping(
        invalidSoure,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );

      expect(log.warn.mock.calls.length).toBe(1);
    });

    it('logs warning and return early if no source provided', () => {
      measurementService.addMapping(
        null /* source */,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );

      expect(log.warn.mock.calls.length).toBe(1);
    });

    it('logs warning and return early if no definition provided', () => {
      measurementService.addMapping(
        source,
        null /* definition */,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );

      expect(log.warn.mock.calls.length).toBe(1);
    });

    it('logs warning and return early if no measurement mapping function provided', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        null /* toAnnotation */,
        toMeasurement
      );

      expect(log.warn.mock.calls.length).toBe(1);
    });

    it('logs warning and return early if no annotation mapping function provided', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        null /* toMeasurement */
      );

      expect(log.warn.mock.calls.length).toBe(1);
    });
  });

  describe('getAnnotation()', () => {
    it('get annotation based on matched criteria', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );
      const measurementId = source.addOrUpdate(definition, annotation);
      const mappedAnnotation = source.getAnnotation(definition, measurementId);

      expect(annotation).toBe(mappedAnnotation);
    });

    it('get annotation based on source and definition', () => {
      measurementService.addMapping(
        source,
        definition,
        {},
        toAnnotation,
        toMeasurement
      );
      const measurementId = source.addOrUpdate(definition, annotation);
      const mappedAnnotation = source.getAnnotation(definition, measurementId);

      expect(annotation).toBe(mappedAnnotation);
    });
  });

  describe('getMeasurements()', () => {
    it('return all measurement service measurements', () => {
      const anotherMeasurement = {
        ...measurement,
        label: 'Label2',
        unit: 'HU',
      };

      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );

      source.addOrUpdate(definition, measurement);
      source.addOrUpdate(definition, anotherMeasurement);

      const measurements = measurementService.getMeasurements();

      expect(measurements.length).toEqual(2);
    });
  });

  describe('getMeasurement()', () => {
    it('return measurement service measurement with given id', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );

      const id = source.addOrUpdate(definition, measurement);
      const returnedMeasurement = measurementService.getMeasurement(id);

      /* Clear dynamic data */
      delete returnedMeasurement.modifiedTimestamp;

      expect({ id, ...measurement }).toEqual(returnedMeasurement);
    });
  });

  describe('addOrUpdate()', () => {
    it('adds new measurements', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );

      source.addOrUpdate(definition, measurement);
      source.addOrUpdate(definition, measurement);

      const measurements = measurementService.getMeasurements();

      expect(measurements.length).toBe(2);
    });

    it('fails to add new measurements when no mapping', () => {
      source.addOrUpdate(definition, measurement);

      expect(log.warn.mock.calls.length).toBe(1);
    });

    it('fails to add new measurements when invalid mapping function', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        1 /* Invalid */
      );

      source.addOrUpdate(definition, measurement);

      expect(log.warn.mock.calls.length).toBe(1);
    });

    it('adds new measurement with custom id', () => {
      const newMeasurement = { id: 1, ...measurement };

      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );

      /* Add new measurement */
      source.addOrUpdate(definition, newMeasurement);
      const savedMeasurement = measurementService.getMeasurement(
        newMeasurement.id
      );

      /* Clear dynamic data */
      delete newMeasurement.modifiedTimestamp;
      delete savedMeasurement.modifiedTimestamp;

      expect(newMeasurement).toEqual(savedMeasurement);
    });

    it('logs warning and return if adding invalid measurement', () => {
      measurement.invalidProperty = {};

      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );

      source.addOrUpdate(definition, measurement);

      expect(log.warn.mock.calls.length).toBe(2);
    });

    it('updates existent measurement', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );

      const id = source.addOrUpdate(definition, measurement);

      measurement.unit = 'HU';

      source.addOrUpdate(definition, { id, ...measurement });
      const updatedMeasurement = measurementService.getMeasurement(id);

      expect(updatedMeasurement.unit).toBe('HU');
    });
  });

  describe('subscribe()', () => {
    it('subscribers receive broadcasted add event', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );

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
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );

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
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toAnnotation,
        toMeasurement
      );

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
