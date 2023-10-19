import { addToList, forEach, getItem, print } from './hierarchicalListUtils';

describe('hierarchicalListUtils', function () {
  let sharedList;

  beforeEach(function () {
    sharedList = [
      ['1.2.3.1', ['1.2.3.1.1', '1.2.3.1.2']],
      '1.2.3.2',
      ['1.2.3.3', ['1.2.3.3.1', ['1.2.3.3.2', ['1.2.3.3.2.1', '1.2.3.3.2.2']]]],
    ];
  });

  describe('getItem', function () {
    it('should retrieve elements from a list by index', function () {
      expect(getItem(sharedList, 0)).toBe('1.2.3.1');
      expect(getItem(sharedList, 1)).toBe('1.2.3.2');
      expect(getItem(sharedList, 2)).toBe('1.2.3.3');
      expect(getItem(sharedList, 3)).toBeUndefined();
    });
    it('should retrieve elements from a list by path', function () {
      expect(getItem(sharedList, '0')).toBe('1.2.3.1');
      expect(getItem(sharedList, '0/0')).toBe('1.2.3.1.1');
      expect(getItem(sharedList, '0/1')).toBe('1.2.3.1.2');
      expect(getItem(sharedList, '0/2')).toBeUndefined();
      expect(getItem(sharedList, '1')).toBe('1.2.3.2');
      expect(getItem(sharedList, '2')).toBe('1.2.3.3');
      expect(getItem(sharedList, '2/0')).toBe('1.2.3.3.1');
      expect(getItem(sharedList, '2/1')).toBe('1.2.3.3.2');
      expect(getItem(sharedList, '2/2')).toBeUndefined();
      expect(getItem(sharedList, '2/1/0')).toBe('1.2.3.3.2.1');
      expect(getItem(sharedList, '2/1/1')).toBe('1.2.3.3.2.2');
      expect(getItem(sharedList, '2/1/2')).toBeUndefined();
      expect(getItem(sharedList, '3')).toBeUndefined();
    });
  });

  describe('addToList', function () {
    it('should support adding elements to a list hierarchically', function () {
      const list = [];
      addToList(list, '1.2.3.1', '1.2.3.1.1');
      addToList(list, '1.2.3.1', '1.2.3.1.2');
      addToList(list, '1.2.3.2');
      addToList(list, '1.2.3.3', '1.2.3.3.1');
      addToList(list, '1.2.3.3', '1.2.3.3.2', '1.2.3.3.2.1');
      addToList(list, '1.2.3.3', '1.2.3.3.2', '1.2.3.3.2.2');
      expect(list).toStrictEqual(sharedList);
    });
    it('should change leaf nodes into non-leaf nodes', function () {
      const listw = [];
      const listx = [['x.1', ['x.1.1', 'x.1.2']], 'x.2'];
      const listy = [
        ['x.1', [['x.1.1', ['x.1.1.1']], 'x.1.2']],
        ['x.2', ['x.2.1']],
      ];
      addToList(listw, 'x.1');
      addToList(listw, 'x.1', 'x.1.1');
      addToList(listw, 'x.1', 'x.1.2');
      addToList(listw, 'x.2');
      expect(listw).toStrictEqual(listx);
      addToList(listw, 'x.2', 'x.2.1');
      addToList(listw, 'x.1', 'x.1.1', 'x.1.1.1');
      expect(listw).toStrictEqual(listy);
    });
  });

  describe('forEach', function () {
    it('should iterate through all leaf nodes of the tree', function () {
      const fn = jest.fn();
      forEach(sharedList, fn);
      expect(fn).toHaveBeenCalledTimes(6);
      expect(fn).nthCalledWith(1, '1.2.3.1', '1.2.3.1.1');
      expect(fn).nthCalledWith(2, '1.2.3.1', '1.2.3.1.2');
      expect(fn).nthCalledWith(3, '1.2.3.2');
      expect(fn).nthCalledWith(4, '1.2.3.3', '1.2.3.3.1');
      expect(fn).nthCalledWith(5, '1.2.3.3', '1.2.3.3.2', '1.2.3.3.2.1');
      expect(fn).nthCalledWith(6, '1.2.3.3', '1.2.3.3.2', '1.2.3.3.2.2');
    });
  });

  describe('print', function () {
    it('should pretty-print the hierarchical list', function () {
      expect(print(sharedList)).toBe(
        '1.2.3.1\n' +
          '  1.2.3.1.1\n' +
          '  1.2.3.1.2\n' +
          '1.2.3.2\n' +
          '1.2.3.3\n' +
          '  1.2.3.3.1\n' +
          '  1.2.3.3.2\n' +
          '    1.2.3.3.2.1\n' +
          '    1.2.3.3.2.2\n'
      );
    });
  });
});
