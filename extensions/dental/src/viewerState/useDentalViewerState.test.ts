import { renderHook, waitFor } from '@testing-library/react';

import { DEFAULT_DENTAL_PREFERENCES, DentalPreferences } from '../preferences/dentalPreferences';
import { useDentalViewerState } from './useDentalViewerState';

function response(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function createServicesManager() {
  const displaySetService = {
    EVENTS: {
      DISPLAY_SETS_ADDED: 'displaySetsAdded',
      DISPLAY_SETS_CHANGED: 'displaySetsChanged',
    },
    getActiveDisplaySets: jest.fn(() => [
      {
        StudyInstanceUID: 'study-1',
        instances: [{ StudyInstanceUID: 'study-1' }],
      },
    ]),
    subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
  };
  const viewportGridService = {
    EVENTS: {
      GRID_STATE_CHANGED: 'gridStateChanged',
    },
    getState: jest.fn(() => ({
      activeViewportId: 'dental-current',
      viewports: new Map([
        ['dental-current', {}],
        ['dental-prior', {}],
      ]),
    })),
    subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
  };
  const hangingProtocolService = {
    getState: jest.fn(() => ({
      protocolId: '@ohif/extension-dental.hangingProtocolModule.dental2x2',
    })),
  };

  return {
    services: {
      displaySetService,
      viewportGridService,
      hangingProtocolService,
    },
  } as unknown as AppTypes.ServicesManager;
}

function renderDentalViewerStateHook({
  fetcher,
  preferences = DEFAULT_DENTAL_PREFERENCES,
}: {
  fetcher: jest.Mock;
  preferences?: DentalPreferences;
}) {
  const originalFetch = global.fetch;
  global.fetch = fetcher;

  const servicesManager = createServicesManager();
  const applyPreferences = jest.fn();
  const appConfig = {
    dental: {
      viewerStateApiUrl: 'http://localhost:4007/api/dental',
      viewerStateAuthToken: 'token',
    },
  } as AppTypes.Config;
  const hook = renderHook(
    props =>
      useDentalViewerState({
        appConfig,
        servicesManager,
        preferences: props.preferences,
        applyPreferences,
      }),
    {
      initialProps: {
        preferences,
      },
    }
  );

  return {
    ...hook,
    applyPreferences,
    servicesManager,
    restoreFetch: () => {
      global.fetch = originalFetch;
    },
  };
}

describe('useDentalViewerState', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message, ...args) => {
      const text = [message, ...args].join(' ');
      if (
        text.includes('ReactDOMTestUtils.act') &&
        text.includes('deprecated')
      ) {
        return;
      }

      throw new Error(text);
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('loads persisted preferences for the current study', () => {
    const fetcher = jest.fn().mockResolvedValue(
      response(200, {
        state: {
          selectedToothId: 'FDI-46',
          numberingSystem: 'FDI',
          theme: 'dental',
        },
      })
    );
    const { result, applyPreferences, restoreFetch } = renderDentalViewerStateHook({ fetcher });

    return waitFor(() => expect(result.current.status).toBe('saved')).then(() => {
      expect(applyPreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedToothId: 'FDI-46',
          numberingSystem: 'FDI',
          theme: 'dental',
        })
      );
      restoreFetch();
    });
  });

  it('keeps controls in memory and marks state unsaved when backend is unavailable', () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('offline'));
    const { result, restoreFetch } = renderDentalViewerStateHook({ fetcher });

    return waitFor(() => expect(result.current.status).toBe('unsaved')).then(() => {
      expect(result.current.lastError).toBe('Dental state not saved');
      restoreFetch();
    });
  });

  it('locks persisted state load/save on auth failure', () => {
    const fetcher = jest.fn().mockResolvedValue(response(403));
    const { result, restoreFetch } = renderDentalViewerStateHook({ fetcher });

    return waitFor(() => expect(result.current.status).toBe('locked')).then(() => {
      expect(result.current.lastError).toBe('Dental state locked');
      restoreFetch();
    });
  });

  it('saves changed preferences after the current study has loaded', () => {
    const fetcher = jest.fn().mockResolvedValue(response(200, { state: null }));
    const hook = renderDentalViewerStateHook({ fetcher });

    return waitFor(() => expect(hook.result.current.status).toBe('saved')).then(() => {
      hook.rerender({
        preferences: {
          ...DEFAULT_DENTAL_PREFERENCES,
          selectedToothId: 'FDI-46',
          numberingSystem: 'FDI',
        },
      });

    return waitFor(() =>
      expect(fetcher).toHaveBeenCalledWith(
        'http://localhost:4007/api/dental/state/study-1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('FDI-46'),
        })
      )
    ).then(() => {
      const saveCall = fetcher.mock.calls.find(([, options]) => options.method === 'PUT');
      const payload = JSON.parse(saveCall[1].body);

      expect(payload.state.layoutContext.stageId).toBe('dental-2x2');
      hook.restoreFetch();
    });
  });
});
});
