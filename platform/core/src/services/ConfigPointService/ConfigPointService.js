import log from '../../log.js';

/**
 * Contains the model data for the extensibility level points.
 */
let _configPoints = {};

/** Source types are the original/base type, and are unique by level/name */
export const SOURCE_TYPE = 'source';
export const USER_SETTING_TYPE = 'userSetting';
const extendOp = (op,) => ({ _extendOp: op });
export const ConfigPointOp = {
  insertAt: (position, value) => ({ ...INSERT, position, value }),
};

const performInsert = (sVal, base, bKey, context) => {
  if (sVal.position != null) {
    base.splice(sVal.position, 0, mergeCreate(sVal.value, context));
  }
  return base;
};

const REPLACE = extendOp("replace");
const REMOVE = extendOp('remove');
const INSERT = extendOp('insert');

function isPrimitive(val) {
  const tof = typeof (val);
  return val === null || val === undefined || tof == 'number' || tof == 'boolean' || tof == 'string' || tof == 'bigint';
}

/** Creates an object of the same type as src, as a child of parent */
export const mergeCreate = function (src, context) {
  const reference = src && src._reference;
  if (reference) {
    const refValue = context && context[reference];
    return refValue;
  }

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
    return mergeObject(isArray(src) ? [] : {}, src, context);
  }
  console.warn("Unknown type", tof, "of value", src);
  throw `The value ${src} of type ${tof} isn't a known type for merging.`;
}

export function mergeArray(dest, src, context) {
  return mergeObject(dest, src, context);
}

function mergeKey(base, key, context) {
  return key;
}

function isRemove(src) {
  return src && src._extendOp == "remove";
}

function isReplace(src) {
  return src && src._extendOp == "replace";
}

function isInsert(src) {
  return src && src._extendOp == "insert";
}

function isArray(src) {
  return typeof (src) == 'object' && typeof (src.length) == 'number';
}

export function mergeAssign(base, src, key, context) {
  const bKey = mergeKey(base, key, context);
  const bVal = base[bKey];
  let sVal = src[key];
  if (isArray(bVal)) {
    if (sVal == null) return;
    if (isRemove(sVal)) {
      base.splice(key, 1);
      return base;
    }
  } else {
    if (isRemove(sVal)) {
      delete base[bKey];
      return;
    }
  }

  if (isInsert(sVal)) {
    return performInsert(sVal, base, bKey, context);
  }


  if (isPrimitive(bVal)) {
    return base[bKey] = mergeCreate(sVal, context);
  }

  if (isReplace(sVal)) {
    return base[bKey] = mergeCreate(sVal, context);
  }

  return mergeObject(bVal, sVal, context);
}

export function mergeObject(base, src, context) {
  for (const key in src) {
    mergeAssign(base, src, key, context);
  }
  return base;
}

const ConfigPointFunctionality = {
  extendConfig(data, allowUpdate) {
    const name = data.name && ("_order" + this._extensions._order.length);
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
    return this;
  },

  applyExtensions() {
    const baseContext = this._configBase && this._configBase.context;
    mergeObject(this, this._configBase, baseContext);
    for (const item of this._extensions._order) {
      console.warn("Merge item ", item);
      mergeObject(this, item, this.context);
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
    if (typeof (configBase) === 'string') {
      if (configBase === configName) throw `The configuration point ${configName} uses itself as a base`;
      configBase = this.addConfig(configBase);
    }
    let config = _configPoints[configName];
    if (!config) {
      _configPoints[configName] = config = Object.assign({}, ConfigPointFunctionality);
      config._configBase = configBase;
      config._extensions = { _order: [] };
    } else if (configBase) {
      Object.assign(config, configBase);
      config._configBase = configBase;
    }
    if (configBase) {
      config.applyExtensions();
    }
    return config;
  },

  /** Registers the specified configuration items.
   * The format of config is an array of extension items.
   * Each item has a configName for the top level config to change,
   * and then has configBase to set the base configuration.
   * The base
   * extension, with an extension item or
   * basedOn, to base the extension on another existing configuration.
   */
  register(config) {
    let ret = {};
    for (const configItem of config) {
      const { configName, configBase, extension, basedOn } = configItem;
      if (configBase) {
        ret[configName] = this.addConfig(configName, configBase);
      }
      if (extension) {
        ret[configName] = this.addConfig(configName).extendConfig(extension);
      }
    }
    console.warn("Returning", ret);
    return ret;
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
//
// ConfigPointService.register([  {configName: 'StudyListPagination',extension: {extraItems: { ranges: [null, { label: 'Twenty Five' }, null, { value: '10', label: 'Ten' }] },}});
