import calculateAreaUnderCurve from './calculateAreaUnderCurve.js';

describe('calculateAreaUnderCurves.js', () => {
  function _getMockTimecourse() {
    return [
      [0, 0],
      [10, 0],
      [20, 2],
      [30, 4],
      [40, 6],
      [50, 8],
      [60, 10],
      [70, 11],
      [80, 10.5],
      [90, 10],
      [100, 10],
      [110, 10],
      [120, 9.5],
      [130, 9],
      [140, 8.5],
      [150, 8],
      [160, 7.5],
      [170, 7],
      [180, 6.5],
      [190, 6],
      [200, 5.5],
      [210, 5],
      [220, 4.5],
      [230, 4],
      [240, 3],
      [250, 2],
      [260, 2],
    ];
  }

  const timecourse = _getMockTimecourse();

  describe('calculateAreaUnderCurve()', () => {
    it('should calculate the area under the curve', () => {
      const areaUnderCurve = calculateAreaUnderCurve(timecourse, 2, 15);

      expect(areaUnderCurve).toBeCloseTo(1156.43, 2);
    });
  });
});
