import log from '../../log.js';

/**
 * Contains the model data for the extensibility level points.
 */
let _levels = {};

/** Source types are the original/base type, and are unique by level/name */
export const SOURCE_TYPE = 'source';
export const USER_SETTING_TYPE = 'userSetting';
const extensibilityOp = (op, args) => ({ _extensibilityOp: op, ...args });
export const REPLACE = extensibilityOp("replace");
export const REMOVE = extensibilityOp('remove');
export const INSERT = extensibilityOp('insert');

function isPrimitive(val) {
  const tof = typeof (val);
  return val === null || val === undefined || tof == 'number' || tof == 'boolean' || tof == 'string' || tof == 'bigint';
}

/** Creates an object of the same type as src, as a child of parent */
export const mergeCreate = function (src) {
  if (isPrimitive(src)) {
    return src;
  }
  const tof = typeof (src);
  if (tof == 'function') {
    // TODO - decide between returning raw original and copied/updated value
    return src;
    // return function () {
    //   console.warn("In nested apply this", this, "arguments", arguments);
    //   return src.apply(this, arguments);
    // };
  }
  if (tof == 'object') {
    return mergeObject(isArray(src) ? [] : {}, src);
  }
  console.warn("Unknown type", tof, "of value", src);
  throw `The value ${src} of type ${tof} isn't a known type for merging.`;
}

export function mergeArray(dest, src) {
  return mergeObject(dest, src);
}

function mergeKey(base, key) {
  return key;
}

function isRemove(src) {
  return src && src._extensibilityOp == "remove";
}

function isReplace(src) {
  return src && src._extensibilityOp == "replace";
}

function isInsert(src) {
  return src && src._extensibilityOp == "insert";
}

function isArray(src) {
  return typeof (src) == 'object' && typeof (src.length) == 'number';
}

export function mergeAssign(base, src, key) {
  const bKey = mergeKey(base, key);
  const bVal = base[bKey];
  const sVal = src[key];
  if (isArray(bVal)) {
    if (sVal == null) return;
    if (isRemove(sVal)) {
      base.splice(key, 1);
      return base;
    }
    if (isInsert(sVal)) {
      base.splice(bKey, 0, mergeCreate(sVal));
      return base;
    }
  } else {
    if (isRemove(sVal)) {
      delete base[bKey];
      return;
    }
  }
  if (isPrimitive(bVal)) {
    return base[bKey] = mergeCreate(sVal);
  }
  if (isReplace(sVal)) {
    return base[bKey] = mergeCreate(sVal);
  }
  return mergeObject(bVal, sVal);
}

export function mergeObject(base, src) {
  for (const key in src) {
    mergeAssign(base, src, key);
  }
  return base;
}

const LevelFunctionality = {
  extendLevel(name, data) {
    if (this._extensions[name]) {
      throw `Level already has extension ${name}`;
    }
    this._extensions[name] = data;
    this._extensions._order.push(data);
    this.applyExtensions();
  },

  applyExtensions() {
    mergeObject(this, this._levelBase);
    for (const item of this._extensions._order) {
      console.warn("Merge item ", item);
      mergeObject(this, item);
    }
  },
};

const BaseImplementation = {
  /** Adds a new level name, must get executed before the level is used.
   * It isn't necessary to provide a default levelBase, but doing so enables
   * inheritting from the levelBase to provide other functionality for the given level.
   * The ordering of when addLevel is called to provide levelBase doesn't matter much.
   */
  addLevel(levelName, levelBase) {
    let level = _levels[levelName];
    if (!level) {
      _levels[levelName] = level = Object.assign({}, LevelFunctionality, levelBase);
      level._levelBase = levelBase;
      level._extensions = { _order: [] };
    } else if (levelBase) {
      Object.assign(level, levelBase);
      level._levelBase = levelBase;
    }
    return level;
  },

  hasLevel(levelName) {
    return _levels[levelName] != undefined;
  },

  clear() {
    _levels = {};
  }
};

const ExtensibilityService = Object.assign(
  { name: 'ExtensibilityService', create: () => ExtensibilityService, },
  BaseImplementation,
);


export { ExtensibilityService };
export default ExtensibilityService;

// TODO - find a way to allow loading a safe list of configuration elements
// Make this globally available for now until a better method is found
window.ExtensibilityService = ExtensibilityService;
// This allows, for example, the following extension to the pagination service
// Just run this in the console.
// let StudyListPaginationLevel = ExtensibilityService.addLevel("StudyListPagination");
// StudyListPaginationLevel.extendLevel('extraItems', {ranges:[null,{label:'Twenty Five'},null,{value:'10', label:'Ten'}]});
