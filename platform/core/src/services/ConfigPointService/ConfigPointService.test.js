import { ConfigPointService, mergeAssign, mergeCreate, mergeObject } from './ConfigPointService.js';
import log from '../../log.js';

jest.mock('../../log.js');

describe('ConfigPointService.js', () => {
  const CONFIG_NAME = 'testLevel';
  const BASE_CONFIG = {
    a: '1',
    list: [1, 2, 3],
    obj: { v1: 'v1', v2: 'v2' },
    obj2: { v1: 'v1', v2: 'v2' },
    sumFunc: (a, b) => a + b,
  };

  const MODIFY_CONFIG = {
    a: '2',
    // Default operation is to merge/replace item by item
    list: ["one", "two", "three", "four"],
    // Default object behaviour is update
    obj: { v2: 'v2New', v3: 'v3' },
    // Over-ride operation to replace entire item
    obj2: { v2: 'v2New', v3: 'v3', ...ConfigPointService.REPLACE },
    // Default function behaviour is replace, which in this case means add new.
    subFunc: (a, b) => a - b,
  };

  const MODIFY_MATCH = {
    a: '2',
    // list: [1.5,'two',3],
    // Default object behaviour is update
    // obj: { v1: 'v1', v2: 'v2New', v3: 'v3' },
    // Over-ride operation to replace entire item
    // obj2: { v2: 'v2New', v3: 'v3' },
    // Default function behaviour is replace, which in this case means add new.
    subFunc: MODIFY_CONFIG.subFunc,
  };


  const MODIFY_NAME = "modify";

  beforeEach(() => {
    ConfigPointService.clear();
    log.warn.mockClear();
    jest.clearAllMocks();
  });

  describe('mergeCreate', () => {
    it('creates primitives', () => {
      const aNumber = mergeCreate(123);
      expect(aNumber).toBe(123);
      const aString = mergeCreate('str');
      expect(aString).toBe('str');
      const aBool = mergeCreate(false);
      expect(aBool).toBe(false);
      const aNull = mergeCreate(null);
      expect(aNull).toBe(null);
    });

    it('Copies functions', () => {
      const sumFunc = (a, b) => a + b;
      sumFunc.value = 5;
      sumFunc.obj = { nested: true };
      const copyFunc = mergeCreate(sumFunc);
      expect(typeof (copyFunc)).toBe('function');
      expect(copyFunc.obj).toEqual(sumFunc.obj);
      expect(copyFunc.value).toEqual(sumFunc.value);
    });

    it('Copies arrays', () => {
      const arr = [1, 2, 3];
      const created = mergeCreate(arr);
      expect(created).toEqual(arr);
    });

    it('copies objects', () => {
      const aCopy = mergeCreate(BASE_CONFIG);
      expect(aCopy.a).toBe('1');
      expect(aCopy.list).toEqual([1, 2, 3]);
      expect(aCopy.sumFunc(5, 6)).toBe(11);
    });
  });

  describe('mergeObject', () => {
    it('Merges simple values', () => {
      let dest;
    });

  });

  describe('addConfig()', () => {

    it('Adds an extension level', () => {
      const config = ConfigPointService.addConfig(CONFIG_NAME, BASE_CONFIG);
      expect(config).toMatchObject(BASE_CONFIG);
    });
  });

  describe('extendConfig()', () => {
    it('updates the config data', () => {
      const level = ConfigPointService.addConfig(CONFIG_NAME, BASE_CONFIG);
      level.extendConfig(MODIFY_NAME, MODIFY_CONFIG);
      expect(level).toMatchObject(MODIFY_MATCH);
    });
  });
});
