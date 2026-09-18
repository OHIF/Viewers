import allowNativeKeysPlugin from './allowNativeKeysPlugin';

/** Minimal Mousetrap stand-in exposing the prototype the plugin wraps. */
function makeMousetrap(originalReturn = false) {
  const original = jest.fn(() => originalReturn);
  function Mousetrap() {}
  Mousetrap.prototype.stopCallback = original;
  return { Mousetrap, original };
}

/** Builds `<parent><child/></parent>` in the document and returns both. */
function mount(parentAttributes = {}) {
  const parent = document.createElement('div');
  Object.entries(parentAttributes).forEach(([name, value]) => parent.setAttribute(name, value));

  const child = document.createElement('span');
  parent.appendChild(child);
  document.body.appendChild(parent);

  return { parent, child };
}

describe('allowNativeKeysPlugin', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('stops a hotkey that lands inside a modal dialog', () => {
    // A modal renders role="dialog" and focuses its content on open, so the
    // keydown target is the dialog or something inside it.
    const { child } = mount({ role: 'dialog' });
    const { Mousetrap } = makeMousetrap();
    allowNativeKeysPlugin(Mousetrap);

    expect(Mousetrap.prototype.stopCallback.call({}, {}, child, 'ctrl+c')).toBe(true);
  });

  it('stops every combo there, not just the clipboard ones', () => {
    // ctrl+a is the case a selection test could never reach: its native meaning
    // is select-all, so nothing is selected at the moment it is pressed.
    const { parent } = mount({ role: 'dialog' });
    const { Mousetrap } = makeMousetrap();
    allowNativeKeysPlugin(Mousetrap);

    ['ctrl+a', 'ctrl+v', 'ctrl+x', 'ctrl+shift+c', 'r'].forEach(combo => {
      expect(Mousetrap.prototype.stopCallback.call({}, {}, parent, combo)).toBe(true);
    });
  });

  it('stops a hotkey inside an element marked .ohif-text-select', () => {
    const { child } = mount({ class: 'ohif-text-select', tabindex: '-1' });
    const { Mousetrap } = makeMousetrap();
    allowNativeKeysPlugin(Mousetrap);

    expect(Mousetrap.prototype.stopCallback.call({}, {}, child, 'ctrl+c')).toBe(true);
  });

  it('lets a hotkey through everywhere else, so bound commands still fire', () => {
    // A viewport carries neither marker, and a text selection sitting elsewhere
    // in the document is no longer consulted, so its hotkeys are unaffected.
    const { child } = mount({ class: 'viewport-element' });
    const { Mousetrap, original } = makeMousetrap(false);
    allowNativeKeysPlugin(Mousetrap);

    expect(Mousetrap.prototype.stopCallback.call({}, {}, child, 'ctrl+c')).toBe(false);
    expect(original).toHaveBeenCalled();
  });

  it('forwards every argument Mousetrap passes, including the sequence', () => {
    const { Mousetrap, original } = makeMousetrap(false);
    allowNativeKeysPlugin(Mousetrap);

    const event = {};
    Mousetrap.prototype.stopCallback.call({}, event, document.body, 'ctrl+k', 'ctrl+k p');

    expect(original).toHaveBeenCalledWith(event, document.body, 'ctrl+k', 'ctrl+k p');
  });

  it('keeps the wrapped stopCallback in charge outside those regions', () => {
    // The pause plugin's stopCallback sits underneath this one: while paused it
    // returns true for every combo, and that must still win.
    const { Mousetrap } = makeMousetrap(true);
    allowNativeKeysPlugin(Mousetrap);

    expect(Mousetrap.prototype.stopCallback.call({}, {}, document.body, 'ctrl+c')).toBe(true);
  });

  it('tolerates a target with no closest(), such as document', () => {
    const { Mousetrap, original } = makeMousetrap(false);
    allowNativeKeysPlugin(Mousetrap);

    expect(Mousetrap.prototype.stopCallback.call({}, {}, document, 'ctrl+c')).toBe(false);
    expect(original).toHaveBeenCalled();
  });
});
