export default function getHandlesFromPoints(points) {
  return points
    .map((p, i) => (i % 10 === 0 ? { start: p } : { end: p }))
    .reduce((obj, item) => Object.assign(obj, { ...item }), {});
}
