/**
 * Hands a keystroke back to the browser — instead of firing a bound OHIF hotkey
 * — whenever it lands inside a modal dialog, or inside an element explicitly
 * marked as a native-keyboard region.
 *
 * `HotkeysManager` always `preventDefault`s a matched hotkey before running its
 * command (`_bindHotkeys` in `platform/core/src/classes/HotkeysManager.ts`), so a
 * bound keystroke is claimed **app-wide** — including while a modal dialog is
 * open. Two things follow from that:
 *
 *   - Single-key hotkeys (rotate, scroll, layout, …) still fire on the viewport
 *     behind an open modal, even though the modal has focus.
 *   - A mode that binds a combo the browser already owns — `ctrl+c`, `ctrl+a`,
 *     `ctrl+v` — takes select-all, copy and paste away from every dialog too, so
 *     text shown in a modal selects but never copies.
 *
 * Mousetrap's default `stopCallback` already opts keystrokes out of the hotkey
 * system when the target is an `input`, `select`, `textarea` or `contenteditable`
 * element, letting their native action through. This plugin extends that same
 * rule from "the target is editable" to "the target is somewhere the browser's
 * own keyboard behaviour should win".
 *
 * The test is on *where the keystroke landed*, not on what happens to be
 * selected, and not on which combo was pressed. That keeps it predictable: every
 * hotkey is live everywhere except in the regions below, rather than flickering
 * off whenever a stale selection exists somewhere in the document.
 */

/**
 * `[role="dialog"]` covers every modal in the app with no markup changes at all.
 * A `DialogContent` renders that role, carries `tabindex="-1"` and focuses itself
 * on open, so a keydown's target is inside it from the moment the dialog appears.
 * Blocking hotkeys under an open modal is the right default in its own right.
 *
 * `.ohif-text-select` is the opt-in for selectable text that is **not** inside a
 * dialog — a value in a side panel, say. Nothing in this repo uses it yet; add it
 * when such a case turns up. Two things are needed, not one:
 *
 *   1. The class must sit on the element that receives focus, or on an ancestor
 *      of it. A keydown's target *is* `document.activeElement`, so marking a
 *      descendant of the focused element does nothing.
 *   2. That element must be focusable — `tabIndex={-1}` for click-focusable but
 *      out of the tab order, `tabIndex={0}` to make it keyboard-reachable too.
 *      A plain `<div>`/`<span>` never becomes `document.activeElement`; clicking
 *      one leaves focus on `body` or the nearest focusable ancestor, and the
 *      class would never be seen.
 *
 * Give it a visible focus style as well (`focus:ring-*`), so the user can tell
 * that their keystrokes are going to the browser rather than to the viewer — all
 * hotkeys are off while focus sits there, not just the clipboard ones.
 *
 * Note that `tabIndex` alone cannot stand in for the class: it already marks
 * "clickable widget" in several places (measurement rows, study items, the cine
 * player, …), and keying off it would suppress hotkeys on those clicked widgets.
 */
const NATIVE_KEYS_SELECTOR = '[role="dialog"], .ohif-text-select';

function isNativeKeysRegion(element) {
  return typeof element?.closest === 'function' && !!element.closest(NATIVE_KEYS_SELECTOR);
}

export default function allowNativeKeysPlugin(Mousetrap) {
  const _originalStopCallback = Mousetrap.prototype.stopCallback;

  Mousetrap.prototype.stopCallback = function (e, element, combo, sequence) {
    if (isNativeKeysRegion(element)) {
      return true;
    }

    return _originalStopCallback.call(this, e, element, combo, sequence);
  };
}
