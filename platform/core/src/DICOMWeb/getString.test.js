import getString from './getString';

describe('getString', () => {
  it('should return a default value if element is null or undefined', () => {
    const defaultValue = ['A', 'B', 'C'].join('\\');
    const nullElement = null;
    const undefinedElement = undefined;

    expect(getString(nullElement, defaultValue)).toEqual(defaultValue);
    expect(getString(undefinedElement, defaultValue)).toEqual(defaultValue);
  });

  it('should return a default value if element.Value is null, undefined or not present', () => {
    const defaultValue = ['A', 'B', 'C'].join('\\');
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

    expect(getString(nullElement, defaultValue)).toEqual(defaultValue);
    expect(getString(undefinedElement, defaultValue)).toEqual(defaultValue);
    expect(getString(noValuePresentElement, defaultValue)).toEqual(defaultValue);
  });

  it('should return A,B,C,D for element when element.Value[0] = [A, B, C, D]', () => {
    const returnValue = ['A', 'B', 'C'].join('\\');
    const element = {
      Value: ['A', 'B', 'C'],
    };
    expect(getString(element, null)).toEqual(returnValue);
  });

  it('should return 1,4,5,6 for element when element.Value[0] is [1, 4, 5, 6]', () => {
    const returnValue = [1, 4, 5, 6].join('\\');
    const element = {
      Value: [1, 4, 5, 6],
    };
    expect(getString(element, null)).toEqual(returnValue);
  });

  it('should return A,1,3,R,7,-1 for element when element.Value is [-1, 2, 5, -10] ', () => {
    const returnValue = ['A', '1', '3', 'R', '7', '-1'].join('\\');
    const element = {
      Value: ['A', '1', '3', 'R', '7', '-1'],
    };
    expect(getString(element, null)).toEqual(returnValue);
  });
});
