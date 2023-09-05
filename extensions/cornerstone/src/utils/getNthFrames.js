/**
 * Returns a re-ordered array consisting of, in order:
 *    1. First few objects
 *    2. Center objects
 *    3. Last few objects
 *    4. nth Objects (n=7), set 2
 *    5. nth Objects set 5,
 *    6. Remaining objects
 * What this does is return the first/center/start objects, as those
 * are often used first, then a selection of objects scattered over the
 * instances in order to allow making requests over a set of image instances.
 *
 * @param {[]} imageIds
 * @returns [] reordered to be an nth selection
 */
export default function getNthFrames(imageIds) {
  const frames = [[], [], [], [], []];
  const centerStart = imageIds.length / 2 - 3;
  const centerEnd = centerStart + 6;

  for (let i = 0; i < imageIds.length; i++) {
    if (i < 2 || i > imageIds.length - 4 || (i > centerStart && i < centerEnd)) {
      frames[0].push(imageIds[i]);
    } else if (i % 7 === 2) {
      frames[1].push(imageIds[i]);
    } else if (i % 7 === 5) {
      frames[2].push(imageIds[i]);
    } else {
      frames[(i % 2) + 3].push(imageIds[i]);
    }
  }
  const ret = [...frames[0], ...frames[1], ...frames[2], ...frames[3], ...frames[4]];
  return ret;
}
