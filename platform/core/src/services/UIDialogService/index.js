/**
 * A UI Element Position
 *
 * @typedef {Object} ElementPosition
 * @property {number} top -
 * @property {number} left -
 * @property {number} right -
 * @property {number} bottom -
 */

/**
 * UI Dialog
 *
 * @typedef {Object} DialogProps
 * @property {string} id The dialog id.
 * @property {ReactElement|HTMLElement} content The dialog content.
 * @property {Object} contentProps The dialog content props.
 * @property {boolean} [isDraggable=true] Controls if dialog content is draggable or not.
 * @property {boolean} [showOverlay=false] Controls dialog overlay.
 * @property {boolean} [centralize=false] Center the dialog on the screen.
 * @property {boolean} [useLastPosition=true] Use last position instead of default.
 * @property {ElementPosition} defaultPosition Specifies the `x` and `y` that the dragged item should start at.
 * @property {ElementPosition} position If this property is present, the item becomes 'controlled' and is not responsive to user input.
 * @property {Function} onStart Called when dragging starts. If `false` is returned any handler, the action will cancel.
 * @property {Function} onStop Called when dragging stops.
 * @property {Function} onDrag Called while dragging.
 */

const uiDialogServicePublicAPI = {
  name: 'UIDialogService',
  dismiss,
  dismissAll,
  create,
  setServiceImplementation,
};

const uiDialogServiceImplementation = {
  _dismiss: () => console.warn('dismiss() NOT IMPLEMENTED'),
  _dismissAll: () => console.warn('dismissAll() NOT IMPLEMENTED'),
  _create: () => console.warn('create() NOT IMPLEMENTED'),
};

function createUIDialogService() {
  return uiDialogServicePublicAPI;
}

/**
 * Show a new UI dialog;
 *
 * @param {DialogProps} props { id, content, contentProps, onStart, onDrag, onStop, centralize, isDraggable, showOverlay, useLastPosition, defaultPosition, position }
 */
function create({
  id,
  content,
  contentProps,
  onStart,
  onDrag,
  onStop,
  centralize = false,
  useLastPosition = true,
  isDraggable = true,
  showOverlay = false,
  defaultPosition,
  position,
}) {
  return uiDialogServiceImplementation._create({
    id,
    content,
    contentProps,
    onStart,
    onDrag,
    onStop,
    centralize,
    useLastPosition,
    isDraggable,
    showOverlay,
    defaultPosition,
    position,
  });
}

/**
 * Destroys all dialogs, if any
 *
 * @returns void
 */
function dismissAll() {
  return uiDialogServiceImplementation._dismissAll();
}

/**
 * Destroy the dialog, if currently created
 *
 * @returns void
 */
function dismiss({ id }) {
  return uiDialogServiceImplementation._dismiss({ id });
}

/**
 *
 *
 * @param {*} {
 *   dismiss: dismissImplementation,
 *   dismissAll: dismissAllImplementation,
 *   create: createImplementation,
 * }
 */
function setServiceImplementation({
  dismiss: dismissImplementation,
  dismissAll: dismissAllImplementation,
  create: createImplementation,
}) {
  if (dismissImplementation) {
    uiDialogServiceImplementation._dismiss = dismissImplementation;
  }
  if (dismissAllImplementation) {
    uiDialogServiceImplementation._dismissAll = dismissAllImplementation;
  }
  if (createImplementation) {
    uiDialogServiceImplementation._create = createImplementation;
  }
}

export default createUIDialogService;
