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
 * @property {string} [id=null] The dialog id.
 * @property {ReactElement|HTMLElement} [content=null] The dialog content.
 * @property {Object} [contentProps=null] The dialog content props.
 * @property {boolean} [isDraggable=true] Controls if dialog content is draggable or not.
 *  @property {boolean} [showOverlay=false] Controls dialog overlay.
 * @property {ElementPosition} [defaultPosition=null] Specifies the `x` and `y` that the dragged item should start at.
 * @property {ElementPosition} [position=null] If this property is present, the item becomes 'controlled' and is not responsive to user input.
 * @property {Function} [onStart=null] Called when dragging starts. If `false` is returned any handler, the action will cancel.
 * @property {Function} [onStop=null] Called when dragging stops.
 * @property {Function} [onDrag=null] Called while dragging.
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
 * @param {DialogProps} props { id, content, contentProps, onStart, onDrag, onStop, isDraggable, showOverlay, defaultPosition, position }
 */
function create({
  id = null,
  content = null,
  contentProps = null,
  onStart = null,
  onDrag = null,
  onStop = null,
  isDraggable = true,
  showOverlay = false,
  defaultPosition = null,
  position = null,
}) {
  return uiDialogServiceImplementation._create({
    id,
    content,
    contentProps,
    onStart,
    onDrag,
    onStop,
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
