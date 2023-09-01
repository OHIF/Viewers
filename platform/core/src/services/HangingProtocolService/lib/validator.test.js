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
      ).not.toBeUndefined();
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
  });
  describe('range', () => {
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
