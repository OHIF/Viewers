import validate from './validator.js';

describe('validator', () => {
  const attributeMap = {
    str: 'Attenuation Corrected',
    upper: 'UPPER',
    num: 3,
    nullValue: null,
    list: ['abc', 'def', 'GHI'],
    listStr: ['Attenuation Corrected'],
  };

  const options = {
    format: 'grouped',
  };

  describe('equals', () => {
    it('returned undefined on strictly equals', () => {
      expect(
        validate(attributeMap, { listStr: { equals: ['Attenuation'] } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { listStr: { equals: 'Attenuation' } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { listStr: { equals: 'Attenuation Corrected' } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { listStr: { equals: ['Attenuation Corrected'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { str: { equals: 'Attenuation Corrected' } }, [options])
      ).toBeUndefined();

      expect(
        validate(attributeMap, { str: { equals: { value: 'Attenuation Corrected' } } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { str: { equals: ['Attenuation Corrected'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { str: { equals: ['Attenuation'] } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { list: { equals: ['abc', 'def', 'GHI'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { equals: ['abc', 'GHI', 'def'] } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { list: { equals: { value: ['abc', 'def', 'GHI'] } } }, [options])
      ).toBeUndefined();
    });
    it('fails a single test value against a longer array', () => {
      expect(validate(attributeMap, { list: { equals: 'abc' } }, [options])).not.toBeUndefined();
      expect(validate(attributeMap, { list: { doesNotEqual: 'abc' } }, [options])).toBeUndefined();
    });
    it('reads a numeric string as a number, and keeps an empty string apart from 0', () => {
      expect(validate({ n: '3' }, { n: { equals: 3 } }, [options])).toBeUndefined();
      expect(validate({ n: ['1', '2'] }, { n: { equals: [1, 2] } }, [options])).toBeUndefined();
      expect(validate({ n: '' }, { n: { equals: { value: 0 } } }, [options])).not.toBeUndefined();
      expect(validate({ n: ['1', '2'] }, { n: { includes: 2 } }, [options])).toBeUndefined();
    });
    it.each([
      [true, 1, true],
      [true, 'true', true],
      [false, 0, true],
      [false, 'false', true],
      [true, 0, false],
    ])('compares the boolean %j with %j: equal is %s', (flag, n, equal) => {
      expect(validate({ n }, { n: { equals: { value: flag } } }, [options]) === undefined).toBe(
        equal
      );
    });
  });
  describe('doesNotEqual', () => {
    it('returns undefined if value does not equal ', () => {
      expect(
        validate(attributeMap, { listStr: { doesNotEqual: 'Attenuation Corrected' } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { listStr: { doesNotEqual: ['Attenuation Corrected'] } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { listStr: { doesNotEqual: 'Attenuation' } }, [options])
      ).toBeUndefined();

      expect(
        validate(attributeMap, { str: { doesNotEqual: 'Attenuation' } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotEqual: { value: 'Attenuation' } } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotEqual: ['Attenuation'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotEqual: ['abc', 'def'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotEqual: ['abc', 'GHI', 'def'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotEqual: ['abc', 'def', 'GHI'] } }, [options])
      ).not.toBeUndefined();
    });
  });
  describe('includes', () => {
    it('returns match any list includes', () => {
      expect(
        validate(attributeMap, { listStr: { includes: 'Attenuation Corrected' } }, [options])
      ).toBeUndefined();
      expect(validate(attributeMap, { list: { includes: 'dog' } }, [options])).not.toBeUndefined();
      expect(
        validate(attributeMap, { listStr: { includes: ['Attenuation Corrected'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { listStr: { includes: ['Attenuation Corrected', 'Corrected'] } }, [
          options,
        ])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { listStr: { includes: ['Attenuation', 'Corrected'] } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { str: { includes: ['Attenuation Corrected', 'Corrected'] } }, [
          options,
        ])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { str: { includes: ['Attenuation', 'Corrected'] } }, [options])
      ).not.toBeUndefined();
      expect(validate(attributeMap, { list: { includes: ['abc'] } }, [options])).toBeUndefined();
      expect(
        validate(attributeMap, { list: { includes: ['GHI', 'HI'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { includes: ['HI', 'bye'] } }, [options])
      ).not.toBeUndefined();
    });
  });
  describe('doesNotInclude', () => {
    it('returns undefined if list does not includes', () => {
      expect(
        validate(attributeMap, { listStr: { doesNotInclude: 'Attenuation Corrected' } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(
          attributeMap,
          {
            listStr: { doesNotInclude: ['Attenuation Corrected', 'Corrected'] },
          },
          [options]
        )
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { listStr: { doesNotInclude: ['Attenuation', 'Corrected'] } }, [
          options,
        ])
      ).toBeUndefined();
      expect(
        validate(
          attributeMap,
          { str: { doesNotInclude: ['Attenuation Corrected', 'Corrected'] } },
          [options]
        )
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotInclude: ['Attenuation', 'Corrected'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotInclude: ['Corr'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotInclude: 'abc' } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotInclude: 'dog' } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotInclude: { value: ['abc'] } } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotInclude: { value: ['att', 'cor'] } } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotInclude: { value: ['abc', 'def', 'dog'] } } }, [
          options,
        ])
      ).not.toBeUndefined();
    });
  });
  describe('containsI', () => {
    it('returns match any list contains case insensitive', () => {
      expect(
        validate(attributeMap, { upper: { containsI: ['hi', 'pre'] } }, [options])
      ).not.toBeUndefined();
      expect(validate(attributeMap, { list: { containsI: 'hi' } }, [options])).toBeUndefined();
      expect(
        validate(attributeMap, { list: { containsI: ['ghi', 'bye'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { containsI: ['bye', 'hi'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { containsI: ['ig', 'hi'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { upper: { containsI: ['bye', 'per'] } }, [options])
      ).toBeUndefined();
    });
  });
  describe('contains', () => {
    it('returns match any list contains', () => {
      expect(validate(attributeMap, { str: { contains: 'Corr' } }, [options])).toBeUndefined();
      expect(
        validate(attributeMap, { str: { contains: { value: 'Corr' } } }, [options])
      ).toBeUndefined();
      expect(validate(attributeMap, { str: { contains: ['Corr'] } }, [options])).toBeUndefined();
      expect(
        validate(attributeMap, { str: { contains: ['corr'] } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { str: { contains: ['Att', 'Wall'] } }, [options])
      ).toBeUndefined();
      expect(validate(attributeMap, { list: { contains: 'GH' } }, [options])).toBeUndefined();
      expect(validate(attributeMap, { list: { contains: ['ab'] } }, [options])).toBeUndefined();

      expect(
        validate(attributeMap, { list: { contains: ['z', 'bc'] } }, [options])
      ).toBeUndefined();
      expect(validate(attributeMap, { list: { contains: ['z'] } }, [options])).not.toBeUndefined();
    });
  });

  describe('doesNotContain', () => {
    it('returns undefined if string does not contain specified value', () => {
      expect(
        validate(attributeMap, { str: { doesNotContain: ['att', 'wall'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotContain: 'Corr' } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotContain: 'corr' } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotContain: { value: 'corr' } } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotContain: ['att', 'cor'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotContain: ['Att', 'cor'] } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotContain: ['bye', 'hi'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotContain: ['GHI', 'hi'] } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotContain: ['hi'] } }, [options])
      ).toBeUndefined();
    });
  });
  describe('doesNotContainI', () => {
    it('returns undefined if string does not contain specified value', () => {
      expect(
        validate(attributeMap, { str: { doesNotContainI: 'corr' } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotContainI: 'Corr' } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotContainI: ['att', 'cor'] } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotContainI: ['Att', 'wall'] } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { str: { doesNotContainI: ['bye', 'hi'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotContainI: ['bye', 'ABC'] } }, [options])
      ).not.toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotContainI: 'bye' } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { doesNotContainI: ['bye', 'ABC'] } }, [options])
      ).not.toBeUndefined();
    });
  });
  describe('startsWith', () => {
    it('returns undefined if string starts with specified value', () => {
      expect(
        validate(attributeMap, { str: { startsWith: { value: 'Atte' } } }, [options])
      ).toBeUndefined();
      expect(validate(attributeMap, { str: { startsWith: 'Att' } }, [options])).toBeUndefined();
      expect(
        validate(attributeMap, { str: { startsWith: ['cat', 'dog', 'Att'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { str: { startsWith: ['cat', 'dog'] } }, [options])
      ).not.toBeUndefined();
      expect(validate(attributeMap, { list: { startsWith: ['GH'] } }, [options])).toBeUndefined();
      expect(
        validate(attributeMap, { list: { startsWith: ['de', 'bye'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { startsWith: ['hi', 'bye'] } }, [options])
      ).not.toBeUndefined();
    });
  });
  describe('endsWith', () => {
    it('returns undefined if string ends with specified value', () => {
      expect(validate(attributeMap, { str: { endsWith: 'ted' } }, [options])).toBeUndefined();
      expect(
        validate(attributeMap, { str: { endsWith: { value: 'ted' } } }, [options])
      ).toBeUndefined();
      expect(validate(attributeMap, { str: { endsWith: ['ted'] } }, [options])).toBeUndefined();
      expect(validate(attributeMap, { str: { endsWith: ['Att'] } }, [options])).not.toBeUndefined();
      expect(
        validate(attributeMap, { str: { endsWith: ['cat', 'dog', 'ted'] } }, [options])
      ).toBeUndefined();
      expect(validate(attributeMap, { list: { endsWith: ['HI'] } }, [options])).toBeUndefined();
      expect(
        validate(attributeMap, { list: { endsWith: ['bc', 'dog', 'ted'] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { list: { endsWith: ['bye', 'dog'] } }, [options])
      ).not.toBeUndefined();
    });
  });

  describe('greaterThan', () => {
    it('returns undefined on greaterThan', () => {
      expect(
        validate(attributeMap, { num: { greaterThan: { value: attributeMap.num - 1 } } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { num: { greaterThan: attributeMap.num - 1 } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { num: { greaterThan: [attributeMap.num - 1] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { num: { greaterThan: [attributeMap.num + 1] } }, [options])
      ).not.toBeUndefined();
    });
    it('fails on an equal value', () => {
      expect(
        validate(attributeMap, { num: { greaterThan: attributeMap.num } }, [options])
      ).not.toBeUndefined();
    });
  });
  describe('greaterThanOrEqual', () => {
    it('passes on an equal or a smaller test value', () => {
      expect(
        validate(attributeMap, { num: { greaterThanOrEqual: { value: attributeMap.num } } }, [
          options,
        ])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { num: { greaterThanOrEqual: attributeMap.num - 1 } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { num: { greaterThanOrEqual: attributeMap.num + 1 } }, [options])
      ).not.toBeUndefined();
    });
  });
  describe('lessThan', () => {
    it('returns undefined on lessThan', () => {
      expect(
        validate(attributeMap, { num: { lessThan: { value: attributeMap.num + 1 } } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { num: { lessThan: attributeMap.num + 1 } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { num: { lessThan: [attributeMap.num + 1] } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { num: { lessThan: [attributeMap.num - 1] } }, [options])
      ).not.toBeUndefined();
    });
    it('fails on an equal value', () => {
      expect(
        validate(attributeMap, { num: { lessThan: attributeMap.num } }, [options])
      ).not.toBeUndefined();
    });
  });
  describe('lessThanOrEqual', () => {
    it('passes on an equal or a larger test value', () => {
      expect(
        validate(attributeMap, { num: { lessThanOrEqual: { value: attributeMap.num } } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { num: { lessThanOrEqual: attributeMap.num + 1 } }, [options])
      ).toBeUndefined();
      expect(
        validate(attributeMap, { num: { lessThanOrEqual: attributeMap.num - 1 } }, [options])
      ).not.toBeUndefined();
    });
  });
  describe('number values', () => {
    const numberValidators = [
      ['greaterThan', 4],
      ['greaterThanOrEqual', 5],
      ['lessThan', 6],
      ['lessThanOrEqual', 5],
    ];
    it.each([
      [5, true],
      ['5', true],
      [[5], true],
      [['5', '9'], true],
      [null, false],
      [undefined, false],
      ['', false],
    ])('reads %j as a number: %s', (n, isNumber) => {
      numberValidators.forEach(([name, testValue]) => {
        expect(validate({ n }, { n: { [name]: testValue } }, [options]) === undefined).toBe(
          isNumber
        );
      });
    });
    it.each([
      ['4', true],
      [['4'], true],
      [{ value: '' }, false],
      [[], false],
      [{ value: null }, false],
      ['a', false],
    ])('reads the test value %j as a number: %s', (testValue, isNumber) => {
      expect(validate({ n: 5 }, { n: { greaterThan: testValue } }, [options]) === undefined).toBe(
        isNumber
      );
    });
  });
  describe('notNull', () => {
    it.each([
      [undefined, false],
      [null, false],
      ['', false],
      [[], false],
      [[''], false],
      [0, true],
      [false, true],
      ['a', true],
      [['a'], true],
    ])('reads %j as having a value: %s', (n, hasValue) => {
      expect(validate({ n }, { n: { notNull: true } }, [options]) === undefined).toBe(hasValue);
      expect(validate({ n }, { n: { notNull: { value: false } } }, [options]) === undefined).toBe(
        !hasValue
      );
    });
  });
  describe('text operands', () => {
    it.each([
      ['startsWith', 0, 'abc', false],
      ['startsWith', 0, '0abc', true],
      ['endsWith', false, 'is false', true],
      ['contains', 1, 'a1b', true],
      ['doesNotContain', 0, 'abc', true],
      ['doesNotContainI', 'X', 'abc', true],
    ])('%s reads the operand %j as text against %j: %s', (name, operand, n, passes) => {
      expect(validate({ n }, { n: { [name]: { value: operand } } }, [options]) === undefined).toBe(
        passes
      );
    });
  });
  describe('range', () => {
    it.each([
      [5, true],
      ['5', true],
      [[5, 60], true],
      [[50, 60], false],
      [null, false],
      ['', false],
    ])('reads %j as the number validators do: in [1, 10] is %s', (n, inRange) => {
      expect(validate({ n }, { n: { range: [1, 10] } }, [options]) === undefined).toBe(inRange);
    });
    it('returns undefined if the value is between', () => {
      expect(
        validate(attributeMap, { num: { range: [attributeMap.num + 1, attributeMap.num - 1] } }, [
          options,
        ])
      ).toBeUndefined();
      expect(validate(attributeMap, { num: { range: [1, 4] } }, [options])).toBeUndefined();
      expect(validate(attributeMap, { num: { range: [1, 2] } }, [options])).not.toBeUndefined();
      expect(validate(attributeMap, { num: { range: [4, 5] } }, [options])).not.toBeUndefined();
      expect(validate(attributeMap, { num: { range: [5] } }, [options])).not.toBeUndefined();
      expect(validate(attributeMap, { num: { range: 5 } }, [options])).not.toBeUndefined();
    });
  });
});
