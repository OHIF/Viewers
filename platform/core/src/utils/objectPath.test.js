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

    test('should return false and leave Array.prototype untouched when __proto__ follows an array', () => {
      const searchObject = { list: [] };
      const output = objectPath.set(searchObject, 'list.__proto__.polluted', 'MOCK_VALUE');
      expect(output).toBe(false);
      expect([].polluted).toBeUndefined();
    });

    test('should return false and leave the class prototype untouched when __proto__ follows an instance', () => {
      const output = objectPath.set(new Series(), '__proto__.polluted', 'MOCK_VALUE');
      expect(output).toBe(false);
      expect(new Series().polluted).toBeUndefined();
    });

    test('should return false and keep the prototype of the object when the path is __proto__', () => {
      const searchObject = {};
      const output = objectPath.set(searchObject, '__proto__', { polluted: 'MOCK_VALUE' });
      expect(output).toBe(false);
      expect(Object.getPrototypeOf(searchObject)).toBe(Object.prototype);
    });

    test('should return false and keep the constructor of the object when the path is constructor', () => {
      const searchObject = {};
      const output = objectPath.set(searchObject, 'constructor', 'MOCK_VALUE');
      expect(output).toBe(false);
      expect(searchObject.constructor).toBe(Object);
    });

    test('should return false and leave Object.prototype untouched when the path starts with __proto__', () => {
      const output = objectPath.set({}, '__proto__.polluted', 'MOCK_VALUE');
      expect(output).toBe(false);
      expect({}.polluted).toBeUndefined();
    });

    test('should return false and leave Object.prototype untouched when the path goes through constructor.prototype', () => {
      const output = objectPath.set({}, 'constructor.prototype.polluted', 'MOCK_VALUE');
      expect(output).toBe(false);
      expect({}.polluted).toBeUndefined();
    });
  });
});
