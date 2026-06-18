import { act, renderHook } from '@testing-library/react';

import { DEFAULT_DENTAL_PREFERENCES } from '../preferences/dentalPreferences';
import { DentalMeasurementsService } from './DentalMeasurementsService';
import { useDentalMeasurements } from './useDentalMeasurements';

function createHarness() {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue({ measurements: [] }),
  });
  const subscribers = new Map<string, (event: any) => void>();
  const measurementService = {
    EVENTS: {
      MEASUREMENT_ADDED: 'measurementAdded',
      MEASUREMENT_UPDATED: 'measurementUpdated',
      MEASUREMENT_REMOVED: 'measurementRemoved',
    },
    subscribe: jest.fn((event, callback) => {
      subscribers.set(event, callback);
      return { unsubscribe: jest.fn() };
    }),
    getMeasurement: jest.fn(),
    update: jest.fn(),
  };
  const commandsManager = {
    runCommand: jest.fn(),
  };
  const dentalMeasurementsService = new DentalMeasurementsService();
  const servicesManager = {
    services: {
      dentalMeasurementsService,
      displaySetService: {
        EVENTS: {
          DISPLAY_SETS_ADDED: 'displaySetsAdded',
          DISPLAY_SETS_CHANGED: 'displaySetsChanged',
        },
        getActiveDisplaySets: jest.fn(() => [
          {
            StudyInstanceUID: 'study-1',
          },
        ]),
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      },
      measurementService,
      viewportGridService: {
        getState: jest.fn(() => ({ activeViewportId: 'dental-current' })),
      },
    },
  };
  const hook = renderHook(() =>
    useDentalMeasurements({
      appConfig: {
        dental: {
          measurementsApiUrl: 'http://localhost:4007/api/dental',
          measurementsAuthToken: 'token',
        },
      } as AppTypes.Config,
      commandsManager: commandsManager as never,
      servicesManager: servicesManager as never,
      preferences: DEFAULT_DENTAL_PREFERENCES,
    })
  );

  return {
    ...hook,
    commandsManager,
    dentalMeasurementsService,
    measurementService,
    emit: (event: string, payload: any) => act(() => subscribers.get(event)?.(payload)),
    restoreFetch: () => {
      global.fetch = originalFetch;
    },
  };
}

describe('useDentalMeasurements', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message, ...args) => {
      const text = [message, ...args].join(' ');

      if (text.includes('ReactDOMTestUtils.act') && text.includes('deprecated')) {
        return;
      }

      throw new Error(text);
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('arms the mapped OHIF tool and labels only the next completed annotation', () => {
    const harness = createHarness();

    act(() => harness.result.current.armPreset('pa-length', 'Distal root'));

    expect(harness.commandsManager.runCommand).toHaveBeenCalledWith('setToolActive', {
      toolName: 'Length',
    });
    harness.emit('measurementAdded', {
      measurement: {
        uid: 'annotation-1',
        toolName: 'Length',
        data: { image: { length: 18.25 } },
      },
    });

    expect(harness.measurementService.update).toHaveBeenCalledWith(
      'annotation-1',
      expect.objectContaining({
        label: 'PA length',
        unit: 'mm',
      }),
      true
    );
    expect(harness.dentalMeasurementsService.getMeasurements()[0]).toEqual(
      expect.objectContaining({
        annotationUID: 'annotation-1',
        label: 'PA length',
        value: 18.25,
        note: 'Distal root',
      })
    );

    harness.emit('measurementAdded', {
      measurement: {
        uid: 'annotation-2',
        toolName: 'Length',
        data: { image: { length: 20 } },
      },
    });

    expect(harness.dentalMeasurementsService.getMeasurements()).toHaveLength(1);
    harness.unmount();
    harness.restoreFetch();
  });

  it('updates an existing record when the annotation value changes', () => {
    const harness = createHarness();

    act(() => harness.result.current.armPreset('canal-angle'));
    harness.emit('measurementAdded', {
      measurement: {
        uid: 'annotation-1',
        toolName: 'Angle',
        data: { image: { angle: 22 } },
      },
    });
    harness.emit('measurementUpdated', {
      measurement: {
        uid: 'annotation-1',
        toolName: 'Angle',
        data: { image: { angle: 27.5 } },
      },
    });

    expect(harness.dentalMeasurementsService.getMeasurements()[0].value).toBe(27.5);
    harness.unmount();
    harness.restoreFetch();
  });

  it('keeps panel state synchronized when a measurement is deleted', () => {
    const harness = createHarness();

    act(() => harness.result.current.armPreset('root-length'));
    harness.emit('measurementAdded', {
      measurement: {
        uid: 'annotation-1',
        toolName: 'Length',
        data: { image: { length: 19 } },
      },
    });
    harness.measurementService.getMeasurement.mockReturnValue({ uid: 'annotation-1' });

    act(() => harness.dentalMeasurementsService.requestDelete('annotation-1'));

    expect(harness.commandsManager.runCommand).toHaveBeenCalledWith('removeMeasurement', {
      uid: 'annotation-1',
    });
    expect(harness.dentalMeasurementsService.getMeasurements()).toHaveLength(1);

    harness.emit('measurementRemoved', {
      measurement: { uid: 'annotation-1' },
    });

    expect(harness.dentalMeasurementsService.getMeasurements()).toEqual([]);
    harness.unmount();
    harness.restoreFetch();
  });
});
