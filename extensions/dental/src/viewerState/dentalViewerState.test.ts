import { normalizeDentalViewerState } from './dentalViewerState';

describe('normalizeDentalViewerState', () => {
  it('normalizes persisted dental viewer state', () => {
    const state = normalizeDentalViewerState({
      selectedToothId: 'FDI-46',
      numberingSystem: 'FDI',
      theme: 'dental',
      layoutContext: {
        activeViewportId: 'dental-current',
        viewportIds: ['dental-current', 'dental-prior', 42],
        protocolId: '@ohif/extension-dental.hangingProtocolModule.dental2x2',
        stageId: 'dental-2x2',
      },
    });

    expect(state).toEqual({
      selectedToothId: 'FDI-46',
      numberingSystem: 'FDI',
      theme: 'dental',
      layoutContext: {
        activeViewportId: 'dental-current',
        viewportIds: ['dental-current', 'dental-prior'],
        protocolId: '@ohif/extension-dental.hangingProtocolModule.dental2x2',
        stageId: 'dental-2x2',
      },
    });
  });

  it('falls back to safe defaults for invalid state', () => {
    const state = normalizeDentalViewerState({
      selectedToothId: 46,
      numberingSystem: 'Palmer',
      theme: 'sepia',
      layoutContext: null,
    });

    expect(state.selectedToothId).toBe('permanent-30');
    expect(state.numberingSystem).toBe('Universal');
    expect(state.theme).toBe('standard');
    expect(state.layoutContext.viewportIds).toEqual([]);
  });
});
