import * as viewportLayoutUtils from './viewportLayoutUtils';

describe('viewporLayoutUtils', function() {
  describe('createLayout should suport creation of:', function() {
    test('single viewport layout', function() {
      const offsetList = [0, 1, 1, 0];
      const layout = viewportLayoutUtils.createLayout(offsetList);
      expect(layout).toBeInstanceOf(Object);
      expect(layout).toHaveProperty('offsetList');
      expect(layout.offsetList).toStrictEqual(offsetList);
      expect(Object.is(layout.offsetList, offsetList)).toBe(false);
      expect(layout).toHaveProperty('id');
      expect(layout.id).toBe('0/1/1/0');
    });
    test('standard MPR layout', function() {
      const offsetList = [
        0,
        1,
        1 / 2,
        0,
        1 / 2,
        1,
        1,
        1 / 2,
        1 / 2,
        1 / 2,
        1,
        0,
      ];
      const layout = viewportLayoutUtils.createLayout(offsetList);
      expect(layout).toBeInstanceOf(Object);
      expect(layout).toHaveProperty('offsetList');
      expect(layout.offsetList).toStrictEqual(offsetList);
      expect(Object.is(layout.offsetList, offsetList)).toBe(false);
      expect(layout).toHaveProperty('id');
      expect(layout.id).toBe('0/1/0.5/0/0.5/1/1/0.5/0.5/0.5/1/0');
    });
  });

  describe('offsetListEquals should correctly compare offset lists:', function() {
    test('custom offsets', function() {
      expect(
        viewportLayoutUtils.offsetListEquals(
          [0.1 + 0.2, 1 / 3, 1 / 2, 2 / 3],
          [0.3, 0.333333, 0.5000004, 0.666667]
        )
      ).toBe(true);
      expect(
        viewportLayoutUtils.offsetListEquals(
          [0.1 + 0.2, 1 / 3, 1 / 2, 2 / 3],
          [0.3, 0.333333, 0.5000004, 0.666666]
        )
      ).toBe(false);
      expect(
        viewportLayoutUtils.offsetListEquals(
          [0.1 + 0.2, 1 / 3, 1 / 2, 2 / 3],
          [0.3, 0.333333, 0.5000006, 0.666667]
        )
      ).toBe(false);
      expect(
        viewportLayoutUtils.offsetListEquals(
          [0.1 + 0.2, 1 / 3, 1 / 2, 2 / 3],
          [0.3, 0.333334, 0.5000004, 0.666667]
        )
      ).toBe(false);
    });
    test('standard 3x2 layout offsets', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(3, 2);
      expect(
        viewportLayoutUtils.offsetListEquals(layout.offsetList, [
          0,
          1,
          0.5,
          0.666667,
          0.5,
          1,
          1,
          0.666667,
          0,
          0.666667,
          0.5,
          0.333333,
          0.5,
          0.666667,
          1,
          0.333333,
          0,
          0.333333,
          0.5,
          0,
          0.5,
          0.333333,
          1,
          0,
        ])
      ).toBe(true);
    });
  });

  describe('getStandardGridLayout should support creation of standard grid layouts:', function() {
    test('1x1', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(1, 1);
      expect(layout).toBeInstanceOf(Object);
      expect(layout).toHaveProperty('offsetList');
      expect(layout.offsetList).toStrictEqual([0, 1, 1, 0]);
      expect(layout).toHaveProperty('id');
      expect(layout.id).toBe('0/1/1/0');
    });
    test('1x2', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(1, 2);
      expect(layout).toBeInstanceOf(Object);
      expect(layout).toHaveProperty('offsetList');
      expect(layout.offsetList).toStrictEqual([0, 1, 1 / 2, 0, 1 / 2, 1, 1, 0]);
      expect(layout).toHaveProperty('id');
      expect(layout.id).toBe('0/1/0.5/0/0.5/1/1/0');
    });
    test('1x3', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(1, 3);
      expect(layout).toBeInstanceOf(Object);
      expect(layout).toHaveProperty('offsetList');
      expect(layout.offsetList).toStrictEqual([
        0,
        1,
        1 / 3,
        0,
        1 / 3,
        1,
        2 / 3,
        0,
        2 / 3,
        1,
        1,
        0,
      ]);
      expect(layout).toHaveProperty('id');
      expect(layout.id).toBe(
        '0/1/0.333333/0/0.333333/1/0.666667/0/0.666667/1/1/0'
      );
    });
    test('2x1', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(2, 1);
      expect(layout).toBeInstanceOf(Object);
      expect(layout).toHaveProperty('offsetList');
      expect(layout.offsetList).toStrictEqual([0, 1, 1, 1 / 2, 0, 1 / 2, 1, 0]);
      expect(layout).toHaveProperty('id');
      expect(layout.id).toBe('0/1/1/0.5/0/0.5/1/0');
    });
    test('2x2', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(2, 2);
      expect(layout).toBeInstanceOf(Object);
      expect(layout).toHaveProperty('offsetList');
      expect(layout.offsetList).toStrictEqual([
        0,
        1,
        1 / 2,
        1 / 2,
        1 / 2,
        1,
        1,
        1 / 2,
        0,
        1 / 2,
        1 / 2,
        0,
        1 / 2,
        1 / 2,
        1,
        0,
      ]);
      expect(layout).toHaveProperty('id');
      expect(layout.id).toBe('0/1/0.5/0.5/0.5/1/1/0.5/0/0.5/0.5/0/0.5/0.5/1/0');
    });
    test('2x3', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(2, 3);
      expect(layout).toBeInstanceOf(Object);
      expect(layout).toHaveProperty('offsetList');
      expect(layout.offsetList).toStrictEqual([
        0,
        1,
        1 / 3,
        1 / 2,
        1 / 3,
        1,
        2 / 3,
        1 / 2,
        2 / 3,
        1,
        1,
        1 / 2,
        0,
        1 / 2,
        1 / 3,
        0,
        1 / 3,
        1 / 2,
        2 / 3,
        0,
        2 / 3,
        1 / 2,
        1,
        0,
      ]);
      expect(layout).toHaveProperty('id');
      expect(layout.id).toBe(
        '0/1/0.333333/0.5/0.333333/1/0.666667/0.5/0.666667/1/1/0.5/0/0.5/0.333333/0/0.333333/0.5/0.666667/0/0.666667/0.5/1/0'
      );
    });
    test('3x1', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(3, 1);
      expect(layout).toBeInstanceOf(Object);
      expect(layout).toHaveProperty('offsetList');
      expect(layout.offsetList).toStrictEqual([
        0,
        1,
        1,
        2 / 3,
        0,
        2 / 3,
        1,
        1 / 3,
        0,
        1 / 3,
        1,
        0,
      ]);
      expect(layout).toHaveProperty('id');
      expect(layout.id).toBe(
        '0/1/1/0.666667/0/0.666667/1/0.333333/0/0.333333/1/0'
      );
    });
    test('3x2', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(3, 2);
      expect(layout).toBeInstanceOf(Object);
      expect(layout).toHaveProperty('offsetList');
      expect(layout.offsetList).toStrictEqual([
        0,
        1,
        1 / 2,
        2 / 3,
        1 / 2,
        1,
        1,
        2 / 3,
        0,
        2 / 3,
        1 / 2,
        1 / 3,
        1 / 2,
        2 / 3,
        1,
        1 / 3,
        0,
        1 / 3,
        1 / 2,
        0,
        1 / 2,
        1 / 3,
        1,
        0,
      ]);
      expect(layout).toHaveProperty('id');
      expect(layout.id).toBe(
        '0/1/0.5/0.666667/0.5/1/1/0.666667/0/0.666667/0.5/0.333333/0.5/0.666667/1/0.333333/0/0.333333/0.5/0/0.5/0.333333/1/0'
      );
    });
  });

  describe('createVewportGroup should support creation of viewport subgroups:', function() {
    test('2x2 subgroups', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(2, 2);
      const viewportGroups = [[0, 2], [1, 3]].map(indexList =>
        viewportLayoutUtils.createVewportGroup(layout, indexList)
      );
      expect(viewportGroups[0]).toBeInstanceOf(Object);
      expect(viewportGroups[1]).toBeInstanceOf(Object);
      expect(viewportGroups[0].id).toBe('0/1/0.5/0.5/0/0.5/0.5/0');
      expect(viewportGroups[1].id).toBe('0.5/1/1/0.5/0.5/0.5/1/0');
      expect(viewportGroups[0].offsetList).toStrictEqual([
        0,
        1,
        1 / 2,
        1 / 2,
        0,
        1 / 2,
        1 / 2,
        0,
      ]);
      expect(viewportGroups[1].offsetList).toStrictEqual([
        1 / 2,
        1,
        1,
        1 / 2,
        1 / 2,
        1 / 2,
        1,
        0,
      ]);
    });
    test('2x3 subgroups', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(2, 3);
      const viewportGroups = [[0, 1, 2], [3, 4, 5]].map(indexList =>
        viewportLayoutUtils.createVewportGroup(layout, indexList)
      );
      expect(viewportGroups[0]).toBeInstanceOf(Object);
      expect(viewportGroups[1]).toBeInstanceOf(Object);
      expect(viewportGroups[0].id).toBe(
        '0/1/0.333333/0.5/0.333333/1/0.666667/0.5/0.666667/1/1/0.5'
      );
      expect(viewportGroups[1].id).toBe(
        '0/0.5/0.333333/0/0.333333/0.5/0.666667/0/0.666667/0.5/1/0'
      );
      expect(viewportGroups[0].offsetList).toStrictEqual([
        0,
        1,
        1 / 3,
        1 / 2,
        1 / 3,
        1,
        2 / 3,
        1 / 2,
        2 / 3,
        1,
        1,
        1 / 2,
      ]);
      expect(viewportGroups[1].offsetList).toStrictEqual([
        0,
        1 / 2,
        1 / 3,
        0,
        1 / 3,
        1 / 2,
        2 / 3,
        0,
        2 / 3,
        1 / 2,
        1,
        0,
      ]);
    });
  });

  describe('getRowsAndColumns should correctly calculate number of rows and columns of a given layout:', function() {
    test('non-grid layout (MPR layout)', function() {
      const layout = viewportLayoutUtils.createLayout([
        0,
        1,
        1 / 2,
        0,
        1 / 2,
        1,
        1,
        1 / 2,
        1 / 2,
        1 / 2,
        1,
        0,
      ]);
      expect(layout.id).toBe('0/1/0.5/0/0.5/1/1/0.5/0.5/0.5/1/0');
      expect(viewportLayoutUtils.getRowsAndColumns(layout)).toBe(null);
    });
    test('1x1 layout', function() {
      expect(
        viewportLayoutUtils.getRowsAndColumns(
          viewportLayoutUtils.getStandardGridLayout(1, 1)
        )
      ).toStrictEqual([1, 1]);
    });
    test('2x2 layout and subgroups', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(2, 2);
      expect(viewportLayoutUtils.getRowsAndColumns(layout)).toStrictEqual([
        2,
        2,
      ]);
      [[0, 1], [2, 3]]
        .map(indexList =>
          viewportLayoutUtils.createVewportGroup(layout, indexList)
        )
        .forEach(
          group =>
            void expect(
              viewportLayoutUtils.getRowsAndColumns(group)
            ).toStrictEqual([1, 2])
        );
      [[0, 2], [1, 3]]
        .map(indexList =>
          viewportLayoutUtils.createVewportGroup(layout, indexList)
        )
        .forEach(
          group =>
            void expect(
              viewportLayoutUtils.getRowsAndColumns(group)
            ).toStrictEqual([2, 1])
        );
    });
    test('2x3 layout and subgroups', function() {
      const layout = viewportLayoutUtils.getStandardGridLayout(2, 3);
      expect(viewportLayoutUtils.getRowsAndColumns(layout)).toStrictEqual([
        2,
        3,
      ]);
      [[0, 1, 2], [3, 4, 5]]
        .map(indexList =>
          viewportLayoutUtils.createVewportGroup(layout, indexList)
        )
        .forEach(
          group =>
            void expect(
              viewportLayoutUtils.getRowsAndColumns(group)
            ).toStrictEqual([1, 3])
        );
      [[0, 3], [1, 4], [2, 5]]
        .map(indexList =>
          viewportLayoutUtils.createVewportGroup(layout, indexList)
        )
        .forEach(
          group =>
            void expect(
              viewportLayoutUtils.getRowsAndColumns(group)
            ).toStrictEqual([2, 1])
        );
    });
  });

  describe('getViewportCount should return the correct number of viewports', function() {
    test('standard MPR layout', function() {
      expect(
        viewportLayoutUtils.getViewportCount(
          viewportLayoutUtils.createLayout([
            0,
            1,
            1 / 2,
            0,
            1 / 2,
            1,
            1,
            1 / 2,
            1 / 2,
            1 / 2,
            1,
            0,
          ])
        )
      ).toBe(3);
    });
    test('1x1', function() {
      expect(
        viewportLayoutUtils.getViewportCount(
          viewportLayoutUtils.getStandardGridLayout(1, 1)
        )
      ).toBe(1);
    });
    test('1x2', function() {
      expect(
        viewportLayoutUtils.getViewportCount(
          viewportLayoutUtils.getStandardGridLayout(1, 2)
        )
      ).toBe(2);
    });
    test('1x3', function() {
      expect(
        viewportLayoutUtils.getViewportCount(
          viewportLayoutUtils.getStandardGridLayout(1, 3)
        )
      ).toBe(3);
    });
    test('2x3', function() {
      expect(
        viewportLayoutUtils.getViewportCount(
          viewportLayoutUtils.getStandardGridLayout(2, 3)
        )
      ).toBe(6);
    });
    test('3x3', function() {
      expect(
        viewportLayoutUtils.getViewportCount(
          viewportLayoutUtils.getStandardGridLayout(3, 3)
        )
      ).toBe(9);
    });
  });
});
