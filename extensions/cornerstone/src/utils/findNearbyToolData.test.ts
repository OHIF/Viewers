import { findNearbyToolData } from './findNearbyToolData';

describe('findNearbyToolData', () => {
  const mockCommandsManager = {
    runCommand: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return undefined when event is null', () => {
    const result = findNearbyToolData(mockCommandsManager, null);

    expect(result).toBeUndefined();
    expect(mockCommandsManager.runCommand).not.toHaveBeenCalled();
  });

  it('should return undefined when event is undefined', () => {
    const result = findNearbyToolData(mockCommandsManager, undefined);

    expect(result).toBeUndefined();
    expect(mockCommandsManager.runCommand).not.toHaveBeenCalled();
  });

  it('should return undefined when event has no detail', () => {
    const event = {};
    const result = findNearbyToolData(mockCommandsManager, event);

    expect(result).toBeUndefined();
    expect(mockCommandsManager.runCommand).not.toHaveBeenCalled();
  });

  it('should return undefined when event detail is null', () => {
    const event = { detail: null };
    const result = findNearbyToolData(mockCommandsManager, event);

    expect(result).toBeUndefined();
    expect(mockCommandsManager.runCommand).not.toHaveBeenCalled();
  });

  it('should call runCommand with correct parameters when event has valid detail', () => {
    const mockElement = document.createElement('div');
    const mockCurrentPoints = { canvas: { x: 100, y: 200 } };
    const mockToolData = { id: 'annotation-1' };
    const event = {
      detail: {
        element: mockElement,
        currentPoints: mockCurrentPoints,
      },
    };

    mockCommandsManager.runCommand.mockReturnValue(mockToolData);

    const result = findNearbyToolData(mockCommandsManager, event);

    expect(mockCommandsManager.runCommand).toHaveBeenCalledWith(
      'getNearbyAnnotation',
      {
        element: mockElement,
        canvasCoordinates: mockCurrentPoints.canvas,
      },
      'CORNERSTONE'
    );
    expect(result).toBe(mockToolData);
  });

  it('should handle event with element but no currentPoints', () => {
    const mockElement = document.createElement('div');
    const event = {
      detail: {
        element: mockElement,
      },
    };

    findNearbyToolData(mockCommandsManager, event);

    expect(mockCommandsManager.runCommand).toHaveBeenCalledWith(
      'getNearbyAnnotation',
      {
        element: mockElement,
        canvasCoordinates: undefined,
      },
      'CORNERSTONE'
    );
  });

  it('should handle event with currentPoints but no canvas coordinates', () => {
    const mockElement = document.createElement('div');
    const mockCurrentPoints = {};
    const event = {
      detail: {
        element: mockElement,
        currentPoints: mockCurrentPoints,
      },
    };

    findNearbyToolData(mockCommandsManager, event);

    expect(mockCommandsManager.runCommand).toHaveBeenCalledWith(
      'getNearbyAnnotation',
      {
        element: mockElement,
        canvasCoordinates: undefined,
      },
      'CORNERSTONE'
    );
  });

  it('should return result from runCommand', () => {
    const mockToolData = { id: 'test-annotation', data: 'test-data' };
    const event = {
      detail: {
        element: document.createElement('div'),
        currentPoints: { canvas: { x: 50, y: 75 } },
      },
    };

    mockCommandsManager.runCommand.mockReturnValue(mockToolData);

    const result = findNearbyToolData(mockCommandsManager, event);

    expect(result).toBe(mockToolData);
  });
});
