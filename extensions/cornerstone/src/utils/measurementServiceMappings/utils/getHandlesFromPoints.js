export default function getHandlesFromPoints(points) {
  if (points.longAxis && points.shortAxis) {
    const handles = {};
    handles.start = points.longAxis[0];
    handles.end = points.longAxis[1];
    handles.perpendicularStart = points.longAxis[0];
    handles.perpendicularEnd = points.longAxis[1];
    return handles;
  }

  return points
    .map((p, i) => (i % 10 === 0 ? { start: p } : { end: p }))
    .reduce((obj, item) => Object.assign(obj, { ...item }), {});
}
