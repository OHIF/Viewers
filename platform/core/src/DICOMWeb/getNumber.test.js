import getNumber from './getNumber';

describe('getNumber', () => {
  it('should return a default value if element is null or undefined', () => {
    const defaultValue = 1.0;
    const nullElement = null;
    const undefinedElement = undefined;

    expect(getNumber(nullElement, defaultValue)).toEqual(defaultValue);
    expect(getNumber(undefinedElement, defaultValue)).toEqual(defaultValue);
  });

  it('should return a default value if element.Value is null, undefined or not present', () => {
    const defaultValue = 1.0;
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

    expect(getNumber(nullElement, defaultValue)).toEqual(defaultValue);
    expect(getNumber(undefinedElement, defaultValue)).toEqual(defaultValue);
    expect(getNumber(noValuePresentElement, defaultValue)).toEqual(
      defaultValue
    );
  });

  it('should return 2.0 for element when element.Value[0] = 2', () => {
    const returnValue = 2.0;
    const element = {
      Value: ['2'],
    };
    expect(getNumber(element, null)).toEqual(returnValue);
  });

  it('should return -1.0 for element when element.Value[0] is -1', () => {
    const returnValue = -1.0;
    const element = {
      Value: ['-1'],
    };
    expect(getNumber(element, null)).toEqual(returnValue);
  });

  it('should return -1.0 for element when element.Value is [-1, 2, 5, -10] ', () => {
    const returnValue = -1.0;
    const element = {
      Value: ['-1', '2', '5', '-10'],
    };
    expect(getNumber(element, null)).toEqual(returnValue);
  });
});
