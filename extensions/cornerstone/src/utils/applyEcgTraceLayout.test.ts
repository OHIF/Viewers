import { applyEcgTraceLayout } from './applyEcgTraceLayout';

describe('applyEcgTraceLayout', () => {
  it('sets the trace layout of a Generic Viewport ECG', () => {
    const viewport = { setViewState: jest.fn(), setProperties: jest.fn() };
    const definition = { regions: [] };

    applyEcgTraceLayout(viewport, '3x4+1');
    applyEcgTraceLayout(viewport, definition);

    expect(viewport.setViewState).toHaveBeenNthCalledWith(1, { traceLayout: '3x4+1' });
    expect(viewport.setViewState).toHaveBeenNthCalledWith(2, { traceLayout: definition });
    expect(viewport.setProperties).not.toHaveBeenCalled();
  });

  it('gives an older ECG viewport the layout name as layoutType', () => {
    const viewport = { setProperties: jest.fn() };

    applyEcgTraceLayout(viewport, '3x4');
    applyEcgTraceLayout(viewport, { regions: [] });

    expect(viewport.setProperties).toHaveBeenCalledTimes(1);
    expect(viewport.setProperties).toHaveBeenCalledWith({ layoutType: '3x4' });
  });

  it('leaves the viewport alone when the hanging protocol gives no layout', () => {
    const viewport = { setViewState: jest.fn() };

    applyEcgTraceLayout(viewport, undefined);

    expect(viewport.setViewState).not.toHaveBeenCalled();
  });
});
