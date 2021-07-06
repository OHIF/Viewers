import log from '../../log.js';

/**
 * Contains the model data for the extensibility level points.
 */
let _configPoints = {};

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

const ConfigPointFunctionality = {
  extendConfig(name, data, allowUpdate) {
    const toRemove = this._extensions[name];
    if (toRemove) {
      if (allowUpdate) {
        this._extensions._order = this._extensions._order.filter(item => item !== toRemove);
      } else {
        throw `Level already has extension ${name}`;
      }
    }
    this._extensions[name] = data;
    this._extensions._order.push(data);
    this.applyExtensions();
  },

  applyExtensions() {
    mergeObject(this, this._configBase);
    for (const item of this._extensions._order) {
      console.warn("Merge item ", item);
      mergeObject(this, item);
    }
  },
};

const BaseImplementation = {
  /** Adds a new configuraiton point, must get executed before the level is used.
   * It isn't necessary to provide a default configBase, but doing so enables
   * inheritting from the levelBase to provide other functionality for the given level.
   * The ordering of when addConfig is called to provide configBase doesn't matter much.
   */
  addConfig(configName, configBase) {
    let config = _configPoints[configName];
    if (!config) {
      _configPoints[configName] = config = Object.assign({}, ConfigPointFunctionality, configBase);
      config._levelBase = configBase;
      config._extensions = { _order: [] };
    } else if (configBase) {
      Object.assign(config, configBase);
      config._configBase = configBase;
    }
    return config;
  },

  /** Extend the overall configuration on each configuration point referenced,
   * adding the specified child items.
   */
  extendConfig(config) {
    for (const configName in config) {
      if (!this.hasConfig(configName)) {
        console.warn(`Unknown ConfigPoint  ${configName}`);
        continue;
      }
      const configPoint = this.addConfig(configName);
      const extendItems = config[configName];
      for (const itemName in extendItems) {
        const item = extendItems[itemName];
        configPoint.extendConfig(itemName, item);
      }
    }
  },

  hasConfig(configName) {
    return _configPoints[configName] != undefined;
  },

  clear() {
    _configPoints = {};
  }
};

const ConfigPointService = Object.assign(
  { name: 'ConfigPointService', create: () => ConfigPointService, },
  BaseImplementation,
);


export { ConfigPointService };
export default ConfigPointService;

// TODO - find a way to allow loading a safe list of configuration elements
// Make this globally available for now until a better method is found
window.ConfigPointService = ConfigPointService;
// This allows, for example, the following extension to the pagination service
// Just run this in the console.
// ConfigPointService.extendConfig({StudyListPagination: {extraItems, {ranges:[null,{label:'Twenty Five'},null,{value:'10', label:'Ten'}]}}});
