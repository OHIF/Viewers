// Transforms a shallow object with keys separated by "." into a nested object
function getNestedObject(shallowObject) {
  const nestedObject = {};
  for (let key in shallowObject) {
    if (!shallowObject.hasOwnProperty(key)) {
      continue;
    }
    const value = shallowObject[key];
    const propertyArray = key.split('.');
    let currentObject = nestedObject;
    while (propertyArray.length) {
      const currentProperty = propertyArray.shift();
      if (!propertyArray.length) {
        currentObject[currentProperty] = value;
      } else {
        if (!currentObject[currentProperty]) {
          currentObject[currentProperty] = {};
        }

        currentObject = currentObject[currentProperty];
      }
    }
  }

  return nestedObject;
}

// Transforms a nested object into a shallowObject merging its keys with "." character
function getShallowObject(nestedObject) {
  const shallowObject = {};
  const putValues = (baseKey, nestedObject, resultObject) => {
    for (let key in nestedObject) {
      if (!nestedObject.hasOwnProperty(key)) {
        continue;
      }
      let currentKey = baseKey ? `${baseKey}.${key}` : key;
      const currentValue = nestedObject[key];
      if (typeof currentValue === 'object') {
        if (currentValue instanceof Array) {
          currentKey += '[]';
        }

        putValues(currentKey, currentValue, resultObject);
      } else {
        resultObject[currentKey] = currentValue;
      }
    }
  };

  putValues('', nestedObject, shallowObject);
  return shallowObject;
}

const object = {
  getNestedObject,
  getShallowObject,
};

export default object;
