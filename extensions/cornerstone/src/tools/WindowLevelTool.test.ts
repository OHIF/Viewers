import { getEnabledElement } from '@cornerstonejs/core';
import { WindowLevelTool as CornerstoneWindowLevelTool } from '@cornerstonejs/tools';
import WindowLevelTool from './WindowLevelTool';

jest.mock('@cornerstonejs/core', () => ({
  Enums: {
    ViewportType: {
      STACK: 'stack',
      ECG: 'ecg',
      ECG_NEXT: 'ecgNext',
    },
  },
  getEnabledElement: jest.fn(),
}));

jest.mock('@cornerstonejs/tools', () => {
  class MockWindowLevelTool {
    static toolName = 'WindowLevel';
  }
  MockWindowLevelTool.prototype['mouseDragCallback'] = jest.fn();
  return { WindowLevelTool: MockWindowLevelTool };
});

describe('WindowLevelTool', () => {
  const cornerstoneDrag = CornerstoneWindowLevelTool.prototype.mouseDragCallback as jest.Mock;
  const evt = { detail: { element: {} } };

  const dragOn = (viewport?: { type: string }) => {
    (getEnabledElement as jest.Mock).mockReturnValue(viewport ? { viewport } : undefined);
    new WindowLevelTool().mouseDragCallback(evt);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the Cornerstone tool name', () => {
    expect(WindowLevelTool.toolName).toBe('WindowLevel');
  });

  it.each(['ecg', 'ecgNext'])('ignores drags on %s viewports', type => {
    expect(() => dragOn({ type })).not.toThrow();
    expect(cornerstoneDrag).not.toHaveBeenCalled();
  });

  it('ignores drags when there is no enabled viewport', () => {
    dragOn();
    expect(cornerstoneDrag).not.toHaveBeenCalled();
  });

  it('applies window/level on other viewports', () => {
    dragOn({ type: 'stack' });
    expect(cornerstoneDrag).toHaveBeenCalledWith(evt);
  });
});
