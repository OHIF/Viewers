export class ObjectPath {
  /**
   * Set an object property based on "path" (namespace) supplied creating
   * ... intermediary objects if they do not exist.
   * @param object {Object} An object where the properties specified on path should be set.
   * @param path {String} A string representing the property to be set, e.g. "user.study.series.timepoint".
   * @param value {Any} The value of the property that will be set.
   * @return {Boolean} Returns "true" on success, "false" if any intermediate component of the supplied path
   * ... is not a valid Object, in which case the property cannot be set. No exceptions are thrown.
   */
  static set(object, path, value) {
    let components = ObjectPath.getPathComponents(path),
      length = components !== null ? components.length : 0,
      result = false;

    if (length > 0 && ObjectPath.isValidObject(object)) {
      let i = 0,
        last = length - 1,
        currentObject = object;

      while (i < last) {
        let field = components[i];

        if (field in currentObject) {
          if (!ObjectPath.isValidObject(currentObject[field])) {
            break;
          }
        } else {
          currentObject[field] = {};
        }

        currentObject = currentObject[field];
        i++;
      }

      if (i === last) {
        currentObject[components[last]] = value;
        result = true;
      }
    }

    return result;
  }

  /**
   * Get an object property based on "path" (namespace) supplied traversing the object
   * ... tree as necessary.
   * @param object {Object} An object where the properties specified might exist.
   * @param path {String} A string representing the property to be searched for, e.g. "user.study.series.timepoint".
   * @return {Any} The value of the property if found. By default, returns the special type "undefined".
   */
  static get(object, path) {
    let found, // undefined by default
      components = ObjectPath.getPathComponents(path),
      length = components !== null ? components.length : 0;

    if (length > 0 && ObjectPath.isValidObject(object)) {
      let i = 0,
        last = length - 1,
        currentObject = object;

      while (i < last) {
        let field = components[i];

        const isValid = ObjectPath.isValidObject(currentObject[field]);
        if (field in currentObject && isValid) {
          currentObject = currentObject[field];
          i++;
        } else {
          break;
        }
      }

      if (i === last && components[last] in currentObject) {
        found = currentObject[components[last]];
      }
    }

    return found;
  }

  /**
   * Check if the supplied argument is a real JavaScript Object instance.
   * @param object {Any} The subject to be tested.
   * @return {Boolean} Returns "true" if the object is a real Object instance and "false" otherwise.
   */
  static isValidObject(object) {
    return typeof object === 'object' && object !== null && object instanceof Object;
  }

  static getPathComponents(path) {
    return typeof path === 'string' ? path.split('.') : null;
  }
}

export default ObjectPath;
