import { isMeasurementWithinViewport } from './isMeasurementWithinViewport';
import { getCenterExtent } from './getCenterExtent';

jest.mock('./getCenterExtent', () => ({
  getCenterExtent: jest.fn(),
}));

describe('isMeasurementWithinViewport', () => {
  const mockViewport = {
    getCamera: jest.fn(),
  };

  const mockMeasurement = {
    points: [
      [0, 0, 0],
      [10, 10, 10],
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when measurement is within viewport extent', () => {
    const mockCamera = {
      focalPoint: [5, 5, 5],
      parallelScale: 15,
    };

    const mockExtent = {
      extent: {
        min: [0, 0, 0],
        max: [10, 10, 10],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(mockViewport.getCamera).toHaveBeenCalled();
    expect(getCenterExtent).toHaveBeenCalledWith(mockMeasurement);
    expect(result).toBe(true);
  });

  it('should return false when measurement min point is outside viewport extent', () => {
    const mockCamera = {
      focalPoint: [5, 5, 5],
      parallelScale: 4,
    };

    const mockExtent = {
      extent: {
        min: [0, 0, 0],
        max: [10, 10, 10],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(false);
  });

  it('should return false when measurement max point is outside viewport extent', () => {
    const mockCamera = {
      focalPoint: [5, 5, 5],
      parallelScale: 4,
    };

    const mockExtent = {
      extent: {
        min: [1, 1, 1],
        max: [15, 15, 15],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(false);
  });

  it('should return false when min point exceeds parallelScale in first dimension', () => {
    const mockCamera = {
      focalPoint: [10, 5, 5],
      parallelScale: 5,
    };

    const mockExtent = {
      extent: {
        min: [0, 0, 0],
        max: [8, 8, 8],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(false);
  });

  it('should return false when max point exceeds parallelScale in second dimension', () => {
    const mockCamera = {
      focalPoint: [5, 5, 5],
      parallelScale: 5,
    };

    const mockExtent = {
      extent: {
        min: [3, 3, 3],
        max: [7, 12, 7],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(false);
  });

  it('should return false when max point exceeds parallelScale in third dimension', () => {
    const mockCamera = {
      focalPoint: [5, 5, 5],
      parallelScale: 5,
    };

    const mockExtent = {
      extent: {
        min: [3, 3, 3],
        max: [7, 7, 12],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(false);
  });

  it('should return true when measurement extent exactly matches parallelScale', () => {
    const mockCamera = {
      focalPoint: [5, 5, 5],
      parallelScale: 5,
    };

    const mockExtent = {
      extent: {
        min: [0, 0, 0],
        max: [10, 10, 10],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(true);
  });

  it('should handle negative coordinates correctly', () => {
    const mockCamera = {
      focalPoint: [-5, -5, -5],
      parallelScale: 10,
    };

    const mockExtent = {
      extent: {
        min: [-10, -10, -10],
        max: [0, 0, 0],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(true);
  });

  it('should handle zero parallelScale', () => {
    const mockCamera = {
      focalPoint: [0, 0, 0],
      parallelScale: 0,
    };

    const mockExtent = {
      extent: {
        min: [0, 0, 0],
        max: [0, 0, 0],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(true);
  });

  it('should handle zero parallelScale with non-zero extent', () => {
    const mockCamera = {
      focalPoint: [0, 0, 0],
      parallelScale: 0,
    };

    const mockExtent = {
      extent: {
        min: [0, 0, 0],
        max: [1, 1, 1],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(false);
  });

  it('should handle large parallelScale values', () => {
    const mockCamera = {
      focalPoint: [0, 0, 0],
      parallelScale: 1000000,
    };

    const mockExtent = {
      extent: {
        min: [-500, -500, -500],
        max: [500, 500, 500],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(true);
  });

  it('should handle floating point coordinates', () => {
    const mockCamera = {
      focalPoint: [1.5, 2.7, 3.1],
      parallelScale: 5.5,
    };

    const mockExtent = {
      extent: {
        min: [0.1, 0.2, 0.3],
        max: [2.9, 5.2, 5.9],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(true);
  });

  it('should fail when min point distance equals parallelScale plus epsilon', () => {
    const mockCamera = {
      focalPoint: [5, 5, 5],
      parallelScale: 5,
    };

    const mockExtent = {
      extent: {
        min: [-0.1, 0, 0],
        max: [10, 10, 10],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(false);
  });

  it('should pass when extent is within parallelScale boundary', () => {
    const mockCamera = {
      focalPoint: [5, 5, 5],
      parallelScale: 6,
    };

    const mockExtent = {
      extent: {
        min: [-1, -1, -1],
        max: [11, 11, 11],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(true);
  });

  it('should handle asymmetric extent around focal point', () => {
    const mockCamera = {
      focalPoint: [10, 10, 10],
      parallelScale: 8,
    };

    const mockExtent = {
      extent: {
        min: [5, 5, 5],
        max: [18, 18, 18],
      },
    };

    mockViewport.getCamera.mockReturnValue(mockCamera);
    (getCenterExtent as jest.Mock).mockReturnValue(mockExtent);

    const result = isMeasurementWithinViewport(mockViewport, mockMeasurement);

    expect(result).toBe(true);
  });
});
