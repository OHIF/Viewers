import { getCenterExtent } from './getCenterExtent';

describe('getCenterExtent', () => {
  it('should return default values when points is undefined', () => {
    const measurement = {};

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [0, 0, 0],
      extent: {
        min: [0, 0, 0],
        max: [0, 0, 0],
      },
    });
  });

  it('should return default values when points is null', () => {
    const measurement = { points: null };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [0, 0, 0],
      extent: {
        min: [0, 0, 0],
        max: [0, 0, 0],
      },
    });
  });

  it('should return default values when points is not an array', () => {
    const measurement = { points: 'invalid' };

    // @ts-expect-error - purposely passing an invalid type
    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [0, 0, 0],
      extent: {
        min: [0, 0, 0],
        max: [0, 0, 0],
      },
    });
  });

  it('should return default values when points array is empty', () => {
    const measurement = { points: [] };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [0, 0, 0],
      extent: {
        min: [0, 0, 0],
        max: [0, 0, 0],
      },
    });
  });

  it('should handle single point correctly', () => {
    const measurement = {
      points: [[5, 10, 15]],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [5, 10, 15],
      extent: {
        min: [5, 10, 15],
        max: [5, 10, 15],
      },
    });
  });

  it('should calculate center and extent for two points', () => {
    const measurement = {
      points: [
        [0, 0, 0],
        [10, 20, 30],
      ],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [5, 10, 15],
      extent: {
        min: [0, 0, 0],
        max: [10, 20, 30],
      },
    });
  });

  it('should calculate center and extent for multiple points', () => {
    const measurement = {
      points: [
        [0, 0, 0],
        [10, 20, 30],
        [5, 5, 5],
        [-5, 15, 25],
      ],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [2.5, 10, 15],
      extent: {
        min: [-5, 0, 0],
        max: [10, 20, 30],
      },
    });
  });

  it('should handle negative coordinates', () => {
    const measurement = {
      points: [
        [-10, -20, -30],
        [-5, -15, -25],
      ],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [-7.5, -17.5, -27.5],
      extent: {
        min: [-10, -20, -30],
        max: [-5, -15, -25],
      },
    });
  });

  it('should handle mixed positive and negative coordinates', () => {
    const measurement = {
      points: [
        [-10, -5, 0],
        [10, 5, 20],
        [0, 0, -10],
      ],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [0, 0, 5],
      extent: {
        min: [-10, -5, -10],
        max: [10, 5, 20],
      },
    });
  });

  it('should handle floating point coordinates', () => {
    const measurement = {
      points: [
        [1.5, 2.3, 3.1],
        [4.2, 8.9, 6.3],
      ],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [2.85, 5.6, 4.7],
      extent: {
        min: [1.5, 2.3, 3.1],
        max: [4.2, 8.9, 6.3],
      },
    });
  });

  it('should handle points with same coordinates', () => {
    const measurement = {
      points: [
        [5, 5, 5],
        [5, 5, 5],
        [5, 5, 5],
      ],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [5, 5, 5],
      extent: {
        min: [5, 5, 5],
        max: [5, 5, 5],
      },
    });
  });

  it('should handle zero coordinates', () => {
    const measurement = {
      points: [
        [0, 0, 0],
        [0, 0, 0],
      ],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [0, 0, 0],
      extent: {
        min: [0, 0, 0],
        max: [0, 0, 0],
      },
    });
  });

  it('should handle large coordinate values', () => {
    const measurement = {
      points: [
        [1000000, 2000000, 3000000],
        [1000001, 2000001, 3000001],
      ],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [1000000.5, 2000000.5, 3000000.5],
      extent: {
        min: [1000000, 2000000, 3000000],
        max: [1000001, 2000001, 3000001],
      },
    });
  });

  it('should handle points in different order', () => {
    const measurement = {
      points: [
        [10, 20, 30],
        [0, 0, 0],
        [5, 10, 15],
      ],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [5, 10, 15],
      extent: {
        min: [0, 0, 0],
        max: [10, 20, 30],
      },
    });
  });

  it('should handle points where min and max are not the first point', () => {
    const measurement = {
      points: [
        [5, 5, 5],
        [0, 0, 0],
        [10, 10, 10],
        [3, 3, 3],
      ],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [5, 5, 5],
      extent: {
        min: [0, 0, 0],
        max: [10, 10, 10],
      },
    });
  });

  it('should handle asymmetric extent distribution', () => {
    const measurement = {
      points: [
        [0, 0, 0],
        [100, 10, 1],
        [50, 50, 50],
      ],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [50, 25, 25],
      extent: {
        min: [0, 0, 0],
        max: [100, 50, 50],
      },
    });
  });

  it('should handle points with different ranges per dimension', () => {
    const measurement = {
      points: [
        [0, 100, 1000],
        [1, 101, 1001],
        [0.5, 100.5, 1000.5],
      ],
    };

    const result = getCenterExtent(measurement);

    expect(result).toEqual({
      center: [0.5, 100.5, 1000.5],
      extent: {
        min: [0, 100, 1000],
        max: [1, 101, 1001],
      },
    });
  });
});
