/**
 * DICOM Representation of Viewports
 * For the "Display Environment Spatial Position" (0072,0108) Attribute,
 * the lower left corner of the overall bounding box has Cartesian coordinates
 * of (0.0,0.0).
 * The upper right corner has coordinates of (1.0,1.0).
 * The scale of the box is based on the "Number of Vertical Pixels" (0072,0104)
 * and "Number of Horizontal Pixels" (0072,0106), not the physical size of the
 * screens that are part of the workstation.
 * The coordinates of each individual screen's box are defined in absolute
 * coordinates relative to the (0,0) and (1,1) range of the overall box.
 * Position of a box is given by a (x1,y1), (x2,y2) pair that identifies the
 * UPPER LEFT CORNER and LOWER RIGHT CORNER if the box is rectangular.
 * For more information, please visit:
 * http://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.23.2.html#sect_C.23.2.1.1
 */

/**
 * Constants
 */

const PRECISION = 6;
const EPSILON = Math.pow(10, -PRECISION) / 2;
const SEPARATOR = '/';
const IS_VALID_LAYOUT = Symbol('isValidLayout');

/**
 * Private Methods & Utils
 */

function signOff(subject) {
  // create a hidden non-enumerable property
  return Object.freeze(
    Object.defineProperty(subject, IS_VALID_LAYOUT, { value: true })
  );
}

function unsafeGetId(offsetList) {
  return offsetList.map(fmt).join(SEPARATOR);
}

function unsafeGetViewportOffsetList(layout, index) {
  const { offsetList } = layout;
  const start = index * 4;
  const end = start + 4;
  if (end <= offsetList.length) {
    return Object.freeze(offsetList.slice(start, end));
  }
  return null;
}

function unsafeGetStandardGridLayout(rows, cols) {
  const offsetList = [];
  const col2offset = (width => col => width * col)(1 / cols);
  const row2offset = (height => row => height * (rows - row))(1 / rows);
  for (let row = 0; row < rows; ++row) {
    const y1 = row2offset(row);
    const y2 = row2offset(row + 1);
    for (let col = 0; col < cols; ++col) {
      const x1 = col2offset(col);
      const x2 = col2offset(col + 1);
      offsetList.push(x1, y1, x2, y2);
    }
  }
  return createLayout(offsetList);
}

function fmt(n) {
  return Number(n)
    .toFixed(PRECISION)
    .replace(/\.?0+$/, '');
}

function eq(a, b) {
  // using absolute error margin since the range in known
  return Math.abs(a - b) < EPSILON;
}

function trunc(n) {
  return n < 0 ? Math.ceil(n) : Math.floor(n);
}

function isValidIndex(subject) {
  return subject === trunc(subject) && subject >= 0;
}

function isValidQtd(subject) {
  return subject === trunc(subject) && subject > 0;
}

/**
 * Public Methods
 */

/**
 * Check if a given value is a valid offset
 * @param {any} subject A value to be tested
 * @returns {boolean}
 */
function isOffset(subject) {
  return typeof subject === 'number' && subject >= 0 && subject <= 1;
}

/**
 * Check if the given object is a valid offset list
 * @param {any} subject The object to be tested
 * @returns {boolean}
 */
function isValidOffsetList(subject) {
  if (Array.isArray(subject)) {
    const { length } = subject;
    return (
      length > 0 &&
      length % 4 === 0 &&
      Array.prototype.every.call(subject, isOffset)
    );
  }
  return false;
}

/**
 * Compares two offsets lists
 * @param {Array} a First list of offsets
 * @param {Array} b Second list of offsets
 */
function offsetListEquals(a, b) {
  return (
    isValidOffsetList(a) &&
    (b === a ||
      (isValidOffsetList(b) &&
        a.length === b.length &&
        Array.prototype.every.call(a, (n, i) => eq(n, b[i]))))
  );
}

/**
 * Check if the provided object is a valid layout object
 * @param {any} subject The object to be tested
 * @returns {boolean}
 */
function isValidLayout(subject) {
  return (
    subject !== null &&
    typeof subject === 'object' &&
    subject[IS_VALID_LAYOUT] === true
  );
}

/**
 * Creates an immutable layout object
 * @param {Array} givenOffsetList An array of offsets
 * @returns {Object} An immutable layout object or null if an invalid list
 *  of offsets was provided
 */
function createLayout(givenOffsetList) {
  if (isValidOffsetList(givenOffsetList)) {
    const offsetList = Object.freeze(
      Array.prototype.slice.call(givenOffsetList)
    );
    return signOff({
      offsetList,
      id: unsafeGetId(offsetList),
    });
  }
  return null;
}

/**
 * Calculate the number of viewports from a given layout object
 * @param {Object} layout The source layout object
 * @returns {number} The number of viewports in the given layout or zero
 */
function getViewportCount(layout) {
  if (isValidLayout(layout)) {
    return layout.offsetList.length / 4;
  }
  return 0;
}

/**
 * Check if a viewport exists in a given layout object
 * @param {Object} givenLayout The source layout object
 * @param {number} index The index of the viewport being tested
 * @returns {boolean}
 */
function hasViewport(givenLayout, index) {
  return index < getViewportCount(givenLayout);
}

/**
 * Get the offset list of a given viewport contained inside the given layout
 * object
 * @param {Object} layout The source layout object
 * @param {number} index The index of the requested viewport
 * @returns {Array} The 4-tuple with the offsets that compose the viewport
 */
function getViewportOffsetList(layout, index) {
  if (isValidLayout(layout) && isValidIndex(index)) {
    return unsafeGetViewportOffsetList(layout, index);
  }
  return null;
}

/**
 * Extract a viewport object from a layout object by index. Please note that
 * the viewport object itself is a layout object with a single viewport
 * @param {Object} layout The source layout object from which the viewport
 *  object is to be extracted
 * @param {number} index The index of the requested viewport
 * @returns {Object} A layout object representing the requested viewport
 */
function getViewport(layout, index) {
  const offsetList = getViewportOffsetList(layout, index);
  if (offsetList) {
    return createLayout(offsetList);
  }
  return null;
}

/**
 * Build a new (sub-)layout object based on a list of viewport indexes contained
 * within the source layout object
 * @param {Object} layout The source layout object which contains the
 *  requested viewports
 * @param {Array} indexList A list of viewport indexes that will be part of the
 *  returned layout object (the viewport group)
 * @returns {Object} The new layout object containing the specified viewports
 */
function createVewportGroup(layout, indexList) {
  if (
    isValidLayout(layout) &&
    Array.isArray(indexList) &&
    indexList.length > 0
  ) {
    const offsetList = [];
    const { length } = indexList;
    let i = 0;
    for (; i < length; ++i) {
      const index = indexList[i];
      if (isValidIndex(index)) {
        const viewportOffsetList = unsafeGetViewportOffsetList(layout, index);
        if (viewportOffsetList) {
          offsetList.push.apply(offsetList, viewportOffsetList);
          continue;
        }
      }
      break;
    }
    if (i === length) {
      // all groups successfully created
      return createLayout(offsetList);
    }
  }
  return null;
}

/**
 * Calculate the number of rows and columns the source layout has. This method
 * returns null if the given layout is not a regular grid layout.
 * @param {Object} layout The source layout object
 * @returns {Array} A 2-tuple representing the number of rows and columns
 *  in that order
 */
function getRowsAndColumns(layout) {
  const viewportCount = getViewportCount(layout);
  if (viewportCount > 0) {
    const { offsetList } = layout;
    const ulx = new Set();
    const uly = new Set();
    const lrx = new Set();
    const lry = new Set();
    for (let i = 0; i < viewportCount; ++i) {
      const base = i * 4;
      // x1, y1, x2, y2
      ulx.add(offsetList[base]);
      uly.add(offsetList[base + 1]);
      lrx.add(offsetList[base + 2]);
      lry.add(offsetList[base + 3]);
    }
    const rows = uly.size;
    const cols = ulx.size;
    if (
      cols === lrx.size &&
      rows === lry.size &&
      cols * rows === viewportCount
    ) {
      // is a regular grid layout
      return [rows, cols];
    }
  }
  return null;
}

/**
 * Interface
 */

function getStandardGridLayout(rows, cols) {
  if (isValidQtd(rows) && isValidQtd(cols)) {
    return unsafeGetStandardGridLayout(rows, cols);
  }
  return null;
}

/**
 * Exports
 */

export {
  isOffset,
  isValidOffsetList,
  offsetListEquals,
  createLayout,
  isValidLayout,
  getStandardGridLayout,
  getViewportOffsetList,
  getViewport,
  getViewportCount,
  hasViewport,
  createVewportGroup,
  getRowsAndColumns,
};
