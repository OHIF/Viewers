import {
  setGpuSettingsPreset,
  resetGpuSettingsPreset,
  setLossyDownsampling,
} from '@cornerstonejs/core';
import initGpuSettingsPreset from './initGpuSettingsPreset';

jest.mock('@cornerstonejs/core', () => ({
  setGpuSettingsPreset: jest.fn(),
  resetGpuSettingsPreset: jest.fn(),
  setLossyDownsampling: jest.fn(),
}));

const CUSTOMIZATION_ID = 'cornerstone.gpuSettingsPreset';

function makeCustomizationService(initial: string | null | undefined) {
  let value = initial;
  const handlers: Record<string, () => void> = {};
  const service = {
    EVENTS: {
      GLOBAL_CUSTOMIZATION_MODIFIED: 'global',
      MODE_CUSTOMIZATION_MODIFIED: 'mode',
    },
    getValue: jest.fn((id: string) => (id === CUSTOMIZATION_ID ? value : undefined)),
    subscribe: jest.fn((event: string, handler: () => void) => {
      handlers[event] = handler;
    }),
  };
  return {
    service,
    set: (next: string | null | undefined) => {
      value = next;
    },
    fire: (event: string) => handlers[event]?.(),
  };
}

describe('initGpuSettingsPreset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('selects the preset and turns final downsampling on, even if the app config has it off', () => {
    const { service } = makeCustomizationService('lowMemory');

    initGpuSettingsPreset({
      customizationService: service,
      appConfig: { lossyDownsampling: { final: false } },
    });

    expect(setGpuSettingsPreset).toHaveBeenCalledWith('lowMemory');
    expect(setLossyDownsampling).toHaveBeenCalledWith({ final: true });
    expect(resetGpuSettingsPreset).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'returns to the default preset and the app config value (final: %s) when the customization is unset',
    configuredFinal => {
      const { service, set, fire } = makeCustomizationService('lowMemory');

      initGpuSettingsPreset({
        customizationService: service,
        appConfig: { lossyDownsampling: { final: configuredFinal } },
      });
      jest.clearAllMocks();

      set(null);
      fire(service.EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED);

      expect(resetGpuSettingsPreset).toHaveBeenCalledTimes(1);
      expect(setLossyDownsampling).toHaveBeenCalledWith({ final: configuredFinal });
      expect(setGpuSettingsPreset).not.toHaveBeenCalled();
    }
  );

  it('leaves Cornerstone3D untouched at startup when no preset is configured', () => {
    const { service } = makeCustomizationService(undefined);

    initGpuSettingsPreset({ customizationService: service, appConfig: undefined });

    expect(setGpuSettingsPreset).not.toHaveBeenCalled();
    expect(resetGpuSettingsPreset).not.toHaveBeenCalled();
    expect(setLossyDownsampling).not.toHaveBeenCalled();
  });

  it('treats a missing app config as final: false when resetting', () => {
    const { service, set, fire } = makeCustomizationService('lowMemory');

    initGpuSettingsPreset({ customizationService: service, appConfig: undefined });
    jest.clearAllMocks();
    set(undefined);
    fire(service.EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED);

    expect(resetGpuSettingsPreset).toHaveBeenCalledTimes(1);
    expect(setLossyDownsampling).toHaveBeenCalledWith({ final: false });
  });

  it('warns and does not throw when Cornerstone3D rejects the preset id', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (setGpuSettingsPreset as jest.Mock).mockImplementationOnce(() => {
      throw new Error('unknown preset');
    });
    const { service } = makeCustomizationService('nope');

    expect(() =>
      initGpuSettingsPreset({ customizationService: service, appConfig: {} })
    ).not.toThrow();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('nope');
    expect(setLossyDownsampling).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('still applies a later valid preset after a rejected one', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (setGpuSettingsPreset as jest.Mock).mockImplementationOnce(() => {
      throw new Error('unknown preset');
    });
    const { service, set, fire } = makeCustomizationService('nope');

    initGpuSettingsPreset({ customizationService: service, appConfig: {} });
    set('lowMemory');
    fire(service.EVENTS.MODE_CUSTOMIZATION_MODIFIED);

    expect(setGpuSettingsPreset).toHaveBeenLastCalledWith('lowMemory');
    expect(setLossyDownsampling).toHaveBeenCalledWith({ final: true });
    warn.mockRestore();
  });

  it('does not apply again when the preset id has not changed', () => {
    const { service, fire } = makeCustomizationService('lowMemory');

    initGpuSettingsPreset({ customizationService: service, appConfig: {} });
    fire(service.EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED);
    fire(service.EVENTS.MODE_CUSTOMIZATION_MODIFIED);

    expect(setGpuSettingsPreset).toHaveBeenCalledTimes(1);
  });

  it('applies a changed preset when the global or the mode customization is modified', () => {
    const { service, set, fire } = makeCustomizationService('a');

    initGpuSettingsPreset({ customizationService: service, appConfig: {} });
    set('b');
    fire(service.EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED);
    set('c');
    fire(service.EVENTS.MODE_CUSTOMIZATION_MODIFIED);

    expect(setGpuSettingsPreset.mock.calls.map(call => call[0])).toEqual(['a', 'b', 'c']);
  });
});
