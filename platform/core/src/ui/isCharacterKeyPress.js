/**
 * Check if the pressed key combination will result in a character input
 * Got from https://stackoverflow.com/questions/4179708/how-to-detect-if-the-pressed-key-will-produce-a-character-inside-an-input-text
 *
 * @returns {Boolean} Whether the pressed key combination will input a character or not
 */
export default function isCharacterKeyPress(event) {
  if (typeof event.which === 'undefined') {
    // This is IE, which only fires keypress events for printable keys
    return true;
  } else if (typeof event.which === 'number' && event.which > 0) {
    // In other browsers except old versions of WebKit, event.which is
    // only greater than zero if the keypress is a printable key.
    // We need to filter out backspace and ctrl/alt/meta key combinations
    return (
      !event.ctrlKey && !event.metaKey && !event.altKey && event.which !== 8
    );
  }

  return false;
}
