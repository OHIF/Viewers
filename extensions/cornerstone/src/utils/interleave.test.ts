import interleave from './interleave';

describe('interleave', () => {
  beforeEach(() => {
    jest.spyOn(console, 'time').mockImplementation();
    jest.spyOn(console, 'timeEnd').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return empty array when input is null', () => {
    const result = interleave(null);

    expect(result).toEqual([]);
  });

  it('should return empty array when input is undefined', () => {
    const result = interleave(undefined);

    expect(result).toEqual([]);
  });

  it('should return empty array when input is empty array', () => {
    const result = interleave([]);

    expect(result).toEqual([]);
  });

  it('should return same array when only one list is provided', () => {
    const input = [[1, 2, 3, 4]];

    const result = interleave(input);

    expect(result).toEqual([1, 2, 3, 4]);
    expect(result).toBe(input[0]);
  });

  it('should interleave two arrays of equal length', () => {
    const input = [
      [1, 3, 5],
      [2, 4, 6],
    ];

    const result = interleave(input);

    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should interleave three arrays of equal length', () => {
    const input = [
      [1, 4, 7],
      [2, 5, 8],
      [3, 6, 9],
    ];

    const result = interleave(input);

    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should handle arrays of different lengths', () => {
    const input = [
      [1, 4],
      [2, 5, 7, 8],
      [3, 6],
    ];

    const result = interleave(input);

    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('should handle first array being longer', () => {
    const input = [
      [1, 3, 5, 7, 9, 11],
      [2, 4, 6],
    ];

    const result = interleave(input);

    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 9, 11]);
  });

  it('should handle second array being longer', () => {
    const input = [
      [1, 3, 5],
      [2, 4, 6, 8, 10, 12],
    ];

    const result = interleave(input);

    expect(result).toEqual([1, 2, 3, 4, 5, 6, 8, 10, 12]);
  });

  it('should handle empty arrays in the input', () => {
    const input = [[1, 3, 5], [], [2, 4, 6]];

    const result = interleave(input);

    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should handle all empty arrays', () => {
    const input = [[], [], []];

    const result = interleave(input);

    expect(result).toEqual([]);
  });

  it('should handle single element arrays', () => {
    const input = [[1], [2], [3], [4]];

    const result = interleave(input);

    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('should handle mixed single and multi-element arrays', () => {
    const input = [[1], [2, 5, 8], [3], [4, 6, 7, 9]];

    const result = interleave(input);

    expect(result).toEqual([1, 2, 3, 4, 5, 6, 8, 7, 9]);
  });

  it('should handle string arrays', () => {
    const input = [
      ['a', 'c', 'e'],
      ['b', 'd', 'f'],
    ];

    const result = interleave(input);

    expect(result).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('should handle object arrays', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    const obj3 = { id: 3 };
    const obj4 = { id: 4 };

    const input = [
      [obj1, obj3],
      [obj2, obj4],
    ];

    const result = interleave(input);

    expect(result).toEqual([obj1, obj2, obj3, obj4]);
  });

  it('should handle large arrays efficiently', () => {
    const array1 = Array.from({ length: 1000 }, (_, i) => i * 2);
    const array2 = Array.from({ length: 1000 }, (_, i) => i * 2 + 1);
    const input = [array1, array2];

    const startTime = performance.now();
    const result = interleave(input);
    const endTime = performance.now();

    expect(result).toHaveLength(2000);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(1);
    expect(result[2]).toBe(2);
    expect(result[3]).toBe(3);
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should handle very large number of arrays', () => {
    const input = Array.from({ length: 100 }, (_, i) => [i, i + 100, i + 200]);

    const result = interleave(input);

    expect(result).toHaveLength(300);
    expect(result.slice(0, 100)).toEqual(Array.from({ length: 100 }, (_, i) => i));
  });

  it('should handle arrays with different data types', () => {
    const input = [
      [1, 'a', true],
      [2, 'b', false],
      [3, 'c', null],
    ];

    const result = interleave(input);

    expect(result).toEqual([1, 2, 3, 'a', 'b', 'c', true, false, null]);
  });

  it('should not mutate original arrays', () => {
    const array1 = [1, 3, 5];
    const array2 = [2, 4, 6];
    const input = [array1, array2];
    const originalArray1 = [...array1];
    const originalArray2 = [...array2];

    interleave(input);

    expect(array1).toEqual(originalArray1);
    expect(array2).toEqual(originalArray2);
  });

  it('should handle nested arrays', () => {
    const input = [
      [
        [1, 2],
        [5, 6],
      ],
      [
        [3, 4],
        [7, 8],
      ],
    ];

    const result = interleave(input);

    expect(result).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
    ]);
  });

  it('should handle arrays with undefined and null values', () => {
    const input = [
      [1, undefined, 3],
      [null, 2, 4],
    ];

    const result = interleave(input);

    expect(result).toEqual([1, null, undefined, 2, 3, 4]);
  });

  it('should handle extremely unbalanced arrays', () => {
    const input = [[1], Array.from({ length: 1000 }, (_, i) => i + 2)];

    const result = interleave(input);

    expect(result).toHaveLength(1001);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(2);
    expect(result[2]).toBe(3);
  });

  it('should handle performance with many small arrays', () => {
    const input = Array.from({ length: 1000 }, (_, i) => [i]);

    const startTime = performance.now();
    const result = interleave(input);
    const endTime = performance.now();

    expect(result).toHaveLength(1000);
    expect(result).toEqual(Array.from({ length: 1000 }, (_, i) => i));
    expect(endTime - startTime).toBeLessThan(50);
  });

  it('should handle zero values correctly', () => {
    const input = [
      [0, 2, 4],
      [1, 3, 5],
    ];

    const result = interleave(input);

    expect(result).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should handle boolean arrays', () => {
    const input = [
      [true, false, true],
      [false, true, false],
    ];

    const result = interleave(input);

    expect(result).toEqual([true, false, false, true, true, false]);
  });

  it('should handle single empty array with non-empty arrays', () => {
    const input = [[], [1, 2, 3], [4, 5, 6]];

    const result = interleave(input);

    expect(result).toEqual([1, 4, 2, 5, 3, 6]);
  });

  it('should maintain order within each array', () => {
    const input = [
      [10, 20, 30, 40, 50],
      [15, 25],
      [12, 22, 32],
    ];

    const result = interleave(input);

    expect(result).toEqual([10, 15, 12, 20, 25, 22, 30, 32, 40, 50]);
  });
});
