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
  let toSourceSchema;
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
      points: [
        { x: 1, y: 2 },
        { x: 1, y: 2 },
      ],
      source: source,
    };
    toSourceSchema = () => annotation;
    toMeasurement = () => {
      if (Object.keys(measurement).includes('invalidProperty')) {
        throw new Error('Measurement does not match schema');
      }

      return measurement;
    }
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

    it('throws Error if no name provided', () => {
      expect(() => {
        measurementService.createSource(null, '1')
      }).toThrow(new Error('Source name not provided.'));
    });

    it('throws Error if no version provided', () => {
      expect(() => {
        measurementService.createSource('Testing', null)
      }).toThrow(new Error('Source version not provided.'));
    });
  });

  describe('addMapping()', () => {
    it('adds new mapping', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toSourceSchema,
        toMeasurement
      );
    });

    it('throws Error if invalid source provided', () => {
      expect(() => {
        const invalidSource = {};

        measurementService.addMapping(
          invalidSource,
          definition,
          matchingCriteria,
          toSourceSchema,
          toMeasurement
        );
      }).toThrow(new Error('Invalid source.'));
    });

    it('throws Error if no matching criteria provided', () => {
      expect(() => {
        measurementService.addMapping(
          source,
          definition,
          null,
          toSourceSchema,
          toMeasurement
        );
      }).toThrow(new Error('Matching criteria not provided.'));
    });


    it('throws Error if no source provided', () => {
      expect(() => {
        measurementService.addMapping(
          null /* source */,
          definition,
          matchingCriteria,
          toSourceSchema,
          toMeasurement
        );
      }).toThrow(new Error('Invalid source.'));
    });

    it('logs warning and return early if no definition provided', () => {
      expect(() => {
        measurementService.addMapping(
          source,
          null /* definition */,
          matchingCriteria,
          toSourceSchema,
          toMeasurement
        );
      }).toThrow(new Error('Definition not provided.'));
    });

    it('throws Error if no measurement mapping function provided', () => {
      expect(() => {
        measurementService.addMapping(
          source,
          definition,
          matchingCriteria,
          null /* toSourceSchema */,
          toMeasurement
        );
      }).toThrow(new Error('Mapping function to source schema not provided.'));
    });

    it('throws Error if no annotation mapping function provided', () => {
      expect(() => {
        measurementService.addMapping(
          source,
          definition,
          matchingCriteria,
          toSourceSchema,
          null /* toMeasurement */
        );
      }).toThrow(new Error('Measurement mapping function not provided.'));
    });
  });

  describe('getAnnotation()', () => {
    it('get annotation based on matched criteria', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toSourceSchema,
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
        toSourceSchema,
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
        toSourceSchema,
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
        toSourceSchema,
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
        toSourceSchema,
        toMeasurement
      );

      source.addOrUpdate(definition, measurement);
      source.addOrUpdate(definition, measurement);

      const measurements = measurementService.getMeasurements();

      expect(measurements.length).toBe(2);
    });

    it('fails to add new measurements when no mapping', () => {
      expect(() => {
        source.addOrUpdate(definition, measurement);
      }).toThrow()
    });

    it('fails to add new measurements when invalid mapping function', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toSourceSchema,
        1 /* Invalid */
      );

      expect(() => {
        source.addOrUpdate(definition, measurement);
      }).toThrow()
    });

    it('adds new measurement with custom id', () => {
      const newMeasurement = { id: 1, ...measurement };

      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toSourceSchema,
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

    it('throws Error if adding invalid measurement', () => {
      measurement.invalidProperty = {};

      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toSourceSchema,
        toMeasurement
      );

      expect(() => {
        source.addOrUpdate(definition, measurement);
      }).toThrow()
    });

    it('updates existing measurement', () => {
      measurementService.addMapping(
        source,
        definition,
        matchingCriteria,
        toSourceSchema,
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
        toSourceSchema,
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
        toSourceSchema,
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
        toSourceSchema,
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
