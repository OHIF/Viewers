// prettier-ignore
// @ts-nocheck
/**
 * Generates a unique id that has limited chance of collision
 *
 * @see {@link https://stackoverflow.com/a/2117523/1867984|StackOverflow: Source}
 * @returns a v4 compliant GUID
 */
export default function uuidv4(): string {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
