import getAttribute from './getAttribute';

describe('getAttribute', () => {
  it('should return a default value if element is null or undefined', () => {
    const defaultValue = '0000';
    const nullElement = null;
    const undefinedElement = undefined;

    expect(getAttribute(nullElement, defaultValue)).toEqual(defaultValue);
    expect(getAttribute(undefinedElement, defaultValue)).toEqual(defaultValue);
  });

  it('should return a default value if element.Value is null, undefined or not present', () => {
    const defaultValue = '0000';
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

    expect(getAttribute(nullElement, defaultValue)).toEqual(defaultValue);
    expect(getAttribute(undefinedElement, defaultValue)).toEqual(defaultValue);
    expect(getAttribute(noValuePresentElement, defaultValue)).toEqual(
      defaultValue
    );
  });

  it('should return 48 for element with value 0', () => {
    const returnValue = 48;
    const element = {
      Value: '0',
    };
    expect(getAttribute(element, null)).toEqual(returnValue);
  });

  it('should return 3211313 for element with value 11', () => {
    const returnValue = 3211313;
    const element = {
      Value: '11',
    };
    expect(getAttribute(element, null)).toEqual(returnValue);
  });

  it('should return 2.4923405222191973e+35 for element with value 00280009', () => {
    const returnValue = 2.4923405222191973e35;
    const element = {
      id: 0,
      Value: '00280009',
    };
    expect(getAttribute(element, null)).toEqual(returnValue);
  });

  it('should return 2949169 for element with value -1', () => {
    const returnValue = 2949169;
    const element = {
      id: 0,
      Value: '-1',
    };
    expect(getAttribute(element, null)).toEqual(returnValue);
  });
});
