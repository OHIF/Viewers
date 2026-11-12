import { getViewportEnabledElement } from './getViewportEnabledElement';
import getActiveViewportEnabledElement from './getActiveViewportEnabledElement';

jest.mock('./getViewportEnabledElement', () => ({
  getViewportEnabledElement: jest.fn(),
}));

describe('getActiveViewportEnabledElement', () => {
  const mockViewportGridService = {
    getState: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return enabled element for active viewport', () => {
    const mockEnabledElement = { viewport: 'test-viewport' };
    mockViewportGridService.getState.mockReturnValue({ activeViewportId: 'viewport-1' });
    (getViewportEnabledElement as jest.Mock).mockReturnValue(mockEnabledElement);

    const result = getActiveViewportEnabledElement(mockViewportGridService);

    expect(mockViewportGridService.getState).toHaveBeenCalledTimes(1);
    expect(getViewportEnabledElement).toHaveBeenCalledWith('viewport-1');
    expect(result).toBe(mockEnabledElement);
  });

  it('should handle null activeViewportId', () => {
    const mockEnabledElement = null;
    mockViewportGridService.getState.mockReturnValue({ activeViewportId: null });
    (getViewportEnabledElement as jest.Mock).mockReturnValue(mockEnabledElement);

    const result = getActiveViewportEnabledElement(mockViewportGridService);

    expect(getViewportEnabledElement).toHaveBeenCalledWith(null);
    expect(result).toBe(null);
  });

  it('should handle undefined activeViewportId', () => {
    const mockEnabledElement = undefined;
    mockViewportGridService.getState.mockReturnValue({ activeViewportId: undefined });
    (getViewportEnabledElement as jest.Mock).mockReturnValue(mockEnabledElement);

    const result = getActiveViewportEnabledElement(mockViewportGridService);

    expect(getViewportEnabledElement).toHaveBeenCalledWith(undefined);
    expect(result).toBe(undefined);
  });

  it('should handle empty state object', () => {
    const mockEnabledElement = undefined;
    mockViewportGridService.getState.mockReturnValue({});
    (getViewportEnabledElement as jest.Mock).mockReturnValue(mockEnabledElement);

    const result = getActiveViewportEnabledElement(mockViewportGridService);

    expect(getViewportEnabledElement).toHaveBeenCalledWith(undefined);
    expect(result).toBe(undefined);
  });

  it('should handle getViewportEnabledElement returning null', () => {
    mockViewportGridService.getState.mockReturnValue({ activeViewportId: 'viewport-1' });
    (getViewportEnabledElement as jest.Mock).mockReturnValue(null);

    const result = getActiveViewportEnabledElement(mockViewportGridService);

    expect(result).toBe(null);
  });
});
