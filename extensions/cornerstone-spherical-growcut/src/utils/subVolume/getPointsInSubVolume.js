export default function getPointsInSubvolume(points, extent) {
  // Deal with the case where the points are an array,
  // Or an object with a start and an end.

  if (Array.isArray(points)) {
    const pointsSubvolume = [];

    points.forEach(point => {
      pointsSubvolume.push({
        x: Math.floor(point.x - extent.topLeft.x),
        y: Math.floor(point.y - extent.topLeft.y)
      });
    });

    return pointsSubvolume;
  }
  const { start, end } = points;

  const startSubVolume = {
    x: Math.floor(start.x - extent.topLeft.x),
    y: Math.floor(start.y - extent.topLeft.y)
  };
  const endSubVolume = {
    x: Math.floor(end.x - extent.topLeft.x),
    y: Math.floor(end.y - extent.topLeft.y)
  };

  return {
    start: startSubVolume,
    end: endSubVolume
  };
}
