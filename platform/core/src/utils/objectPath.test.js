import objectPath from './objectPath';

describe('objectPath', () => {
  test('should return false when the supplied argument is not a real JavaScript Object instance such as undefined', () => {
    expect(objectPath.isValidObject(undefined)).toBe(false);
  });

  test('should return false when the supplied argument is not a real JavaScript Object instance such as null', () => {
    expect(objectPath.isValidObject(null)).toBe(false);
  });

  test('should return true when the supplied argument is a real JavaScript Object instance', () => {
    expect(objectPath.isValidObject({})).toBe(true);
  });

  test('should return [path1, path2, path3] when the path is path1.path2.path3', () => {
    const path = 'path1.path2.path3';
    const expectedPathComponents = objectPath.getPathComponents(path);
    expect(expectedPathComponents).toEqual(['path1', 'path2', 'path3']);
  });

  test('should return null when the path is not a string', () => {
    const path = 20;
    const expectedPathComponents = objectPath.getPathComponents(path);
    expect(expectedPathComponents).toEqual(null);
  });

  test('should return [path1path2path3] when the path is path1path2path3', () => {
    const path = 'path1path2path3';
    const expectedPathComponents = objectPath.getPathComponents(path);
    expect(expectedPathComponents).toEqual(['path1path2path3']);
  });

  test('should return the property obj.myProperty when the object contains myProperty', () => {
    const searchObject = {
      obj: {
        myProperty: 'MOCK_VALUE',
      },
    };
    const path = 'obj.myProperty';
    const expectedPathComponents = objectPath.get(searchObject, path);
    expect(expectedPathComponents).toEqual(searchObject.obj.myProperty);
  });

  test('should return undefined when the object does not contain a property', () => {
    const searchObject = {
      obj: {
        myProperty: 'MOCK_VALUE',
      },
    };
    const path = 'obj.unknownProperty';
    const expectedPathComponents = objectPath.get(searchObject, path);
    expect(expectedPathComponents).toEqual(undefined);
  });

  test('should return undefined when the object is not a valid object', () => {
    const searchObject = undefined;
    const path = 'obj.unknownProperty';
    const expectedPathComponents = objectPath.get(searchObject, path);
    expect(expectedPathComponents).toEqual(undefined);
  });

  test('should return undefined when the inner object is not a valid object', () => {
    const searchObject = {
      obj: {
        myProperty: null,
      },
    };
    const path = 'obj.unknownProperty';
    const expectedPathComponents = objectPath.get(searchObject, path);
    expect(expectedPathComponents).toEqual(undefined);
  });

  test('should set the property obj.myProperty when the object does not contain myProperty', () => {
    const searchObject = {
      obj: {
        anyProperty: 'MOCK_VALUE',
      },
    };
    const newValue = 'NEW_VALUE';
    const path = 'obj.myProperty';
    const output = objectPath.set(searchObject, path, newValue);
    expect(output).toBe(true);
    expect(searchObject.obj.myProperty).toEqual(newValue);
  });

  test('should return false when the object which is being set is not in a valid path', () => {
    const searchObject = {
      obj: {
        myProperty: 'MOCK_VALUE',
      },
    };
    const path = undefined;
    const newValue = 'NEW_VALUE';

    const output = objectPath.set(searchObject, path, newValue);
    expect(output).toEqual(false);
  });

  describe('set with a path that reaches a prototype', () => {
    class Series {}

    afterEach(() => {
      delete Object.prototype.polluted;
      delete Array.prototype.polluted;
      delete Series.prototype.polluted;
    });

    // Each row: the target, the path, and a check that the target and the prototypes did not change.
    test.each([
      [{ list: [] }, 'list.__proto__.polluted', () => expect([].polluted).toBeUndefined()],
      [new Series(), '__proto__.polluted', () => expect(new Series().polluted).toBeUndefined()],
      [{}, '__proto__', o => expect(Object.getPrototypeOf(o)).toBe(Object.prototype)],
      [{}, 'constructor', o => expect(o.constructor).toBe(Object)],
      [{}, 'missing.__proto__.polluted', o => expect(o).toEqual({})],
      [{}, 'missing.constructor', o => expect(o).toEqual({})],
      [{}, '__proto__.polluted', () => expect({}.polluted).toBeUndefined()],
      [{}, 'constructor.prototype.polluted', () => expect({}.polluted).toBeUndefined()],
    ])('should return false and change nothing for %o with path %s', (target, path, check) => {
      expect(objectPath.set(target, path, { polluted: 'MOCK_VALUE' })).toBe(false);
      check(target);
    });
  });
});
