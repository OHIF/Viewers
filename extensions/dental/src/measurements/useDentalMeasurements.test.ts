import { act, renderHook } from '@testing-library/react';

import { DEFAULT_DENTAL_PREFERENCES } from '../preferences/dentalPreferences';
import { useDentalMeasurements } from './useDentalMeasurements';

function createHarness() {
  const subscribers = new Map<string, (event: any) => void>();
  const measurementService = {
    EVENTS: {
      MEASUREMENT_ADDED: 'measurementAdded',
      MEASUREMENT_UPDATED: 'measurementUpdated',
    },
    subscribe: jest.fn((event, callback) => {
      subscribers.set(event, callback);
      return { unsubscribe: jest.fn() };
    }),
    update: jest.fn(),
  };
  const commandsManager = {
    runCommand: jest.fn(),
  };
  const servicesManager = {
    services: {
      measurementService,
      viewportGridService: {
        getState: jest.fn(() => ({ activeViewportId: 'dental-current' })),
      },
    },
  };
  const hook = renderHook(() =>
    useDentalMeasurements({
      commandsManager: commandsManager as never,
      servicesManager: servicesManager as never,
      preferences: DEFAULT_DENTAL_PREFERENCES,
    })
  );

  return {
    ...hook,
    commandsManager,
    measurementService,
    emit: (event: string, payload: any) => act(() => subscribers.get(event)?.(payload)),
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
    expect(harness.result.current.measurements).toEqual([]);

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
    expect(harness.result.current.measurements[0]).toEqual(
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

    expect(harness.result.current.measurements).toHaveLength(1);
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

    expect(harness.result.current.measurements[0].value).toBe(27.5);
  });
});
