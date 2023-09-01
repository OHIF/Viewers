import getName from './getName';

describe('getName', () => {
  it('should return a default value if element is null or undefined', () => {
    const defaultValue = 'DEFAULT_NAME';
    const nullElement = null;
    const undefinedElement = undefined;

    expect(getName(nullElement, defaultValue)).toEqual(defaultValue);
    expect(getName(undefinedElement, defaultValue)).toEqual(defaultValue);
  });

  it('should return a default value if element.Value is null, undefined or not present', () => {
    const defaultValue = 'DEFAULT_NAME';
    const nullElement = {
      id: 0,
      Value: null,
    };
    const undefinedElement = {
      id: 0,
      Value: undefined,
    };
    const noValuePresentElement = {
      id: 0,
    };

    expect(getName(nullElement, defaultValue)).toEqual(defaultValue);
    expect(getName(undefinedElement, defaultValue)).toEqual(defaultValue);
    expect(getName(noValuePresentElement, defaultValue)).toEqual(defaultValue);
  });

  it('should return A for element when Alphabetic is [A, B, C, D]', () => {
    const returnValue = 'A';
    const element = {
      Value: [{ Alphabetic: 'A' }, { Alphabetic: 'B' }, { Alphabetic: 'C' }, { Alphabetic: 'D' }],
    };
    expect(getName(element, null)).toEqual(returnValue);
  });

  it('should return FIRST for element when Alphabetic is [FIRST, SECOND]', () => {
    const returnValue = 'FIRST';
    const element = {
      Value: [{ Alphabetic: 'FIRST' }, { Alphabetic: 'SECOND' }],
    };
    expect(getName(element, null)).toEqual(returnValue);
  });

  it('should return element.value[0] for element with not Alphabetic and when there is at least on element.Value', () => {
    const returnValue = {
      anyOtherProperty: 'FIRST',
    };
    const element = {
      Value: [{ anyOtherProperty: 'FIRST' }, { Alphabetic: 'SECOND' }],
    };
    expect(getName(element, null)).toEqual(returnValue);
  });
});
