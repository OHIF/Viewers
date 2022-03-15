/**
 * Generates a UUID for the enabledElement.
 * @export @public @method
 * @name generateUID
 *
 * @return {String} the UUID.
 */
export default function() {
  // https://stackoverflow.com/a/8809472/9208320 Public Domain/MIT
  /* eslint no-bitwise: ["error", { "allow": ["&","|"] }] */
  let d = new Date().getTime();

  if (
    typeof performance !== 'undefined' &&
    typeof performance.now === 'function'
  ) {
    d += performance.now(); // Use high-precision timer if available
  }
  return 'x.x.x.x.x.x.xxxx.xxx.x.x.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(
    /[xy]/g,
    function(c) {
      const r = (d + Math.random() * 16) % 16 | 0;

      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    }
  );
}
