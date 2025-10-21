import { getEnabledElement } from '@cornerstonejs/core';
import { getEnabledElement as OHIFgetEnabledElement } from '../state';
import { getViewportEnabledElement } from './getViewportEnabledElement';

jest.mock('@cornerstonejs/core', () => ({
  getEnabledElement: jest.fn(),
}));

jest.mock('../state', () => ({
  getEnabledElement: jest.fn(),
}));

describe('getViewportEnabledElement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return enabled element when OHIF getEnabledElement returns element', () => {
    const mockElement = document.createElement('div');
    const mockEnabledElement = { viewport: 'test-viewport' };

    (OHIFgetEnabledElement as jest.Mock).mockReturnValue({ element: mockElement });
    (getEnabledElement as jest.Mock).mockReturnValue(mockEnabledElement);

    const result = getViewportEnabledElement('test-viewport-id');

    expect(OHIFgetEnabledElement).toHaveBeenCalledWith('test-viewport-id');
    expect(getEnabledElement).toHaveBeenCalledWith(mockElement);
    expect(result).toBe(mockEnabledElement);
  });

  it('should return enabled element when OHIF getEnabledElement returns null', () => {
    const mockEnabledElement = { viewport: 'test-viewport' };

    (OHIFgetEnabledElement as jest.Mock).mockReturnValue(null);
    (getEnabledElement as jest.Mock).mockReturnValue(mockEnabledElement);

    const result = getViewportEnabledElement('test-viewport-id');

    expect(OHIFgetEnabledElement).toHaveBeenCalledWith('test-viewport-id');
    expect(getEnabledElement).toHaveBeenCalledWith(undefined);
    expect(result).toBe(mockEnabledElement);
  });

  it('should return enabled element when OHIF getEnabledElement returns object without element', () => {
    const mockEnabledElement = { viewport: 'test-viewport' };

    (OHIFgetEnabledElement as jest.Mock).mockReturnValue({});
    (getEnabledElement as jest.Mock).mockReturnValue(mockEnabledElement);

    const result = getViewportEnabledElement('test-viewport-id');

    expect(OHIFgetEnabledElement).toHaveBeenCalledWith('test-viewport-id');
    expect(getEnabledElement).toHaveBeenCalledWith(undefined);
    expect(result).toBe(mockEnabledElement);
  });

  it('should return null when cornerstone getEnabledElement returns null', () => {
    const mockElement = document.createElement('div');

    (OHIFgetEnabledElement as jest.Mock).mockReturnValue({ element: mockElement });
    (getEnabledElement as jest.Mock).mockReturnValue(null);

    const result = getViewportEnabledElement('test-viewport-id');

    expect(OHIFgetEnabledElement).toHaveBeenCalledWith('test-viewport-id');
    expect(getEnabledElement).toHaveBeenCalledWith(mockElement);
    expect(result).toBe(null);
  });

  it('should return undefined when cornerstone getEnabledElement returns undefined', () => {
    const mockElement = document.createElement('div');

    (OHIFgetEnabledElement as jest.Mock).mockReturnValue({ element: mockElement });
    (getEnabledElement as jest.Mock).mockReturnValue(undefined);

    const result = getViewportEnabledElement('test-viewport-id');

    expect(OHIFgetEnabledElement).toHaveBeenCalledWith('test-viewport-id');
    expect(getEnabledElement).toHaveBeenCalledWith(mockElement);
    expect(result).toBe(undefined);
  });
});
