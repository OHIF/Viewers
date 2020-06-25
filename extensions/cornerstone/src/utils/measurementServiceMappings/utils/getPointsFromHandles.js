export default function getPointsFromHandles(handles) {
  let points = [];
  Object.keys(handles).map(handle => {
    if (['start', 'end'].includes(handle)) {
      let point = {};
      if (handles[handle].x) point.x = handles[handle].x;
      if (handles[handle].y) point.y = handles[handle].y;
      points.push(point);
    }
  });
  return points;
}
