import * as utils from './viewportLayoutUtils';

/**
 * Constants
 */

const TYPE = Symbol('Type');
const STATE = Symbol('State');
const LAYOUT = Symbol('Layout');
const VIEWPORT = Symbol('Viewport');
const MAP = Symbol('Map');

/**
 * Definitions
 */

function createState(options) {
  let { layout, custom, activeViewportIndex, viewportSpecificData } = options;

  if (!isOfType(LAYOUT, layout)) {
    layout = createStandardLayout(1, 1);
  }

  let [numRows, numColumns] = utils.getRowsAndColumns(layout.model) || [0, 0];
  let viewportCount = utils.getViewportCount(layout.model);

  if (!isOfType(MAP, viewportSpecificData)) {
    viewportSpecificData = buildViewportDataMap(options.data, viewportCount);
  }

  return setType(STATE, {
    layout,
    numRows,
    numColumns,
    activeViewportIndex: getActiveViewportIndex(
      activeViewportIndex,
      viewportCount
    ),
    viewportSpecificData,
    custom: Object.freeze({ ...custom }),
  });
}

function createStandardLayout(rows, columns, attributes, groups) {
  return createCustomLayout(
    utils.getStandardGridLayout(rows, columns),
    attributes,
    groups
  );
}

function createCustomLayout(model, attributes, groups) {
  if (utils.isValidLayout(model)) {
    const viewports = createViewports(model, attributes);
    if (viewports) {
      return setType(LAYOUT, {
        viewports,
        model,
        groups: createGroups(model, groups),
      });
    }
  }
  return null;
}

function createViewports(model, attributes) {
  const viewportCount = utils.getViewportCount(model);
  if (viewportCount > 0) {
    const attributesSource = getAttributesSource(attributes);
    const viewportList = new Array(viewportCount);
    for (let i = 0; i < viewportCount; ++i) {
      viewportList[i] = createViewport(
        utils.getViewport(model, i),
        attributesSource(i)
      );
    }
    return Object.freeze(viewportList);
  }
  return null;
}

function resetViewportAttributes(layout, attributes) {
  if (isOfType(LAYOUT, layout)) {
    const attributesSource = getAttributesSource(attributes);
    let { viewports, model, groups } = layout;
    viewports = Object.freeze(
      viewports.map((viewport, i) =>
        createViewport(viewport.model, attributesSource(i))
      )
    );
    return setType(LAYOUT, { viewports, model, groups });
  }
  return null;
}

function setViewportSpecificAttributes(layout, index, attributes) {
  if (isOfType(LAYOUT, layout)) {
    let { viewports, model, groups } = layout;
    viewports = Object.freeze(
      viewports.map((viewport, i) =>
        i === index
          ? createViewport(viewport.model, { ...viewport, ...attributes })
          : viewport
      )
    );
    return setType(LAYOUT, { viewports, model, groups });
  }
  return null;
}

function createViewport(model, attributes) {
  return setType(VIEWPORT, {
    ...attributes,
    model,
  });
}

function createGroups(model, groups) {
  if (Array.isArray(groups) && groups.length > 0) {
    const { length } = groups;
    const viewportGroups = new Array(length);
    let i = 0;
    for (; i < length; ++i) {
      const group = utils.createVewportGroup(model, groups[i]);
      if (!group) {
        break;
      }
      viewportGroups[i] = createCustomLayout(group);
    }
    if (i === length) {
      return viewportGroups;
    }
  }
  return null;
}

function getActiveViewportIndex(index, limit) {
  if (Number.isInteger(index) && index > 0 && index < limit) {
    return index;
  }
  return 0;
}

function buildViewportDataMap(list, limit) {
  const map = Object.create(null);
  if (Array.isArray(list)) {
    const count = Math.min(list.length, limit);
    for (let i = 0; i < count; ++i) {
      const item = list[i];
      if (item !== undefined) {
        map[i] = item;
      }
    }
  }
  return setType(MAP, map);
}

function buildViewportDataList(map, limit) {
  if (isObject(map) && Number.isInteger(limit) && limit > 0) {
    const hasOwn = Object.prototype.hasOwnProperty.bind(map);
    const dataList = new Array(limit);
    for (let key in map) {
      if (hasOwn(key)) {
        const value = map[key];
        const index = parseInt(key, 10);
        if (index >= 0 && index < limit && value !== undefined) {
          dataList[index] = value;
        }
      }
    }
    return dataList;
  }
  return null;
}

function getViewportCount(layout) {
  if (isOfType(LAYOUT, layout)) {
    return utils.getViewportCount(layout.model);
  }
  return 0;
}

function getViewportIndex(layout, viewportIndex, groupIndex) {
  if (isOfType(LAYOUT, layout) && isValidIndex(viewportIndex)) {
    const layoutViewports = layout.viewports;
    const layoutViewportsLength = layoutViewports.length;
    if (
      isValidIndex(groupIndex) &&
      Array.isArray(layout.groups) &&
      groupIndex < layout.groups.length
    ) {
      const group = layout.groups[groupIndex];
      if (viewportIndex < group.viewports.length) {
        const id = group.viewports[viewportIndex].model.id;
        for (let i = 0; i < layoutViewportsLength; ++i) {
          if (layoutViewports[i].model.id === id) {
            return i;
          }
        }
      }
    }
    if (viewportIndex < layoutViewportsLength) {
      return viewportIndex;
    }
  }
  return 0;
}

/**
 * Utils
 */

function setType(value, subject) {
  return Object.freeze(Object.defineProperty(subject, TYPE, { value }));
}

function isOfType(value, subject) {
  return isObject(subject) && subject[TYPE] === value;
}

function isObject(subject) {
  return subject !== null && typeof subject === 'object';
}

function getAttributesSource(attributes) {
  if (Array.isArray(attributes)) {
    return function attributesSource(index) {
      // prevent deopts from out of bounds access
      if (index < attributes.length) {
        return Object(attributes[index]);
      }
    };
  }
  return function attributesSource() {
    return Object(attributes);
  };
}

function isValidIndex(subject) {
  return Number.isInteger(subject) && subject >= 0;
}

/**
 * Exports
 */

export {
  createState,
  createStandardLayout,
  createCustomLayout,
  resetViewportAttributes,
  setViewportSpecificAttributes,
  buildViewportDataList,
  buildViewportDataMap,
  getViewportCount,
  getViewportIndex,
};
