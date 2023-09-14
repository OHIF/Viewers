/**
 * Constants
 */

const SEPARATOR = '/';

/**
 * API
 */

/**
 * Add values to a list hierarchically.
 *  @ For example:
 *    addToList([], 'a', 'b', 'c');
 *  will add the following hierarchy to the list:
 *    a > b > c
 *  resulting in the following array:
 *    [['a', [['b', ['c']]]]]
 * @param {Array} list The target list;
 * @param  {...string} values The values to be hierarchically added to the list;
 * @returns {Array} Returns the provided list possibly updated with the given
 *  values or null when a bad list (not an actual array) is provided
 */
function addToList(list, ...values) {
  if (Array.isArray(list)) {
    if (values.length > 0) {
      addValuesToList(list, values);
    }
    return list;
  }
  return null;
}

/**
 * Iterates through the provided hierarchical list executing the callback
 * once for each leaf-node of the tree. The ancestors of the leaf-node being
 * visited are passed to the callback function along with the leaf-node in
 * the exact same order they appear on the tree (from root to leaf);
 *  @ For example, if the hierarchy `a > b > c` appears on the tree ("a" being
 *    the root and "c" being the leaf) the callback function will be called as:
 *  callback('a', 'b', 'c');
 * @param {Array} list The hierarchical list to be iterated
 * @param {function} callback The callback which will be executed once for
 *  each leaf-node of the hierarchical list;
 * @returns {Array} Returns the provided list or null for bad arguments;
 */
function forEach(list, callback) {
  if (Array.isArray(list)) {
    if (typeof callback === 'function') {
      forEachValue(list, callback);
    }
    return list;
  }
  return null;
}

/**
 * Retrieves an item from the given hierarchical list based on an index (number)
 * or a path (string).
 *  @ For example:
 *    getItem(list, '1/0/4')
 *  will retrieve the fourth grandchild, from the first child of the second
 *  element of the list;
 * @param {Array} list The source list;
 * @param {string|number} indexOrPath The index of the element inside list
 *  (number) or the path to reach the desired element (string). The slash "/"
 *  character is cosidered the path separator;
 */
function getItem(list, indexOrPath) {
  if (Array.isArray(list)) {
    let subpath = null;
    let index = typeof indexOrPath === 'number' ? indexOrPath : -1;
    if (typeof indexOrPath === 'string') {
      const separator = indexOrPath.indexOf(SEPARATOR);
      if (separator > 0) {
        index = parseInt(indexOrPath.slice(0, separator), 10);
        if (separator + 1 < indexOrPath.length) {
          subpath = indexOrPath.slice(separator + 1, indexOrPath.length);
        }
      } else {
        index = parseInt(indexOrPath, 10);
      }
    }
    if (index >= 0 && index < list.length) {
      const item = list[index];
      if (isSublist(item)) {
        if (subpath !== null) {
          return getItem(item[1], subpath);
        }
        return item[0];
      }
      return item;
    }
  }
}

/**
 * Pretty-print the provided hierarchical list;
 * @param {Array} list The source list;
 * @returns {string} The textual representation of the hierarchical list;
 */
function print(list) {
  let text = '';
  if (Array.isArray(list)) {
    let prev = [];
    forEachValue(list, function (...args) {
      let prevLen = prev.length;
      for (let i = 0, l = args.length; i < l; ++i) {
        if (i < prevLen && args[i] === prev[i]) {
          continue;
        }
        text += '  '.repeat(i) + args[i] + '\n';
      }
      prev = args;
    });
  }
  return text;
}

/**
 * Utils
 */

function forEachValue(list, callback) {
  for (let i = 0, l = list.length; i < l; ++i) {
    let item = list[i];
    if (isSublist(item)) {
      if (item[1].length > 0) {
        forEachValue(item[1], callback.bind(null, item[0]));
        continue;
      }
      item = item[0];
    }
    callback(item);
  }
}

function addValuesToList(list, values) {
  let value = values.shift();
  let index = add(list, value);
  if (index >= 0) {
    if (values.length > 0) {
      let sublist = list[index];
      if (!isSublist(sublist)) {
        sublist = toSublist(value);
        list[index] = sublist;
      }
      return addValuesToList(sublist[1], values);
    }
    return true;
  }
  return false;
}

function add(list, value) {
  let index = find(list, value);
  if (index === -2) {
    index = list.push(value) - 1;
  }
  return index;
}

function find(list, value) {
  if (typeof value === 'string') {
    for (let i = 0, l = list.length; i < l; ++i) {
      let item = list[i];
      if (item === value || (isSublist(item) && item[0] === value)) {
        return i;
      }
    }
    return -2;
  }
  return -1;
}

function isSublist(subject) {
  return (
    Array.isArray(subject) &&
    subject.length === 2 &&
    typeof subject[0] === 'string' &&
    Array.isArray(subject[1])
  );
}

function toSublist(value) {
  return [value + '', []];
}

/**
 * Exports
 */

const hierarchicalListUtils = { addToList, getItem, forEach, print };
export { addToList, getItem, forEach, print };
export default hierarchicalListUtils;
