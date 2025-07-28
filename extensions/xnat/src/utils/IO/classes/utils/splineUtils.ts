// Minimal Catmull-Rom spline interpolation helper
export function catmullRomSpline(points, numSegments = 20) {
  if (!Array.isArray(points) || points.length < 2) return [];
  const result = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1] || points[i];
    const p3 = points[i + 2] || p2;
    for (let t = 0; t < numSegments; t++) {
      const s = t / numSegments;
      const x = 0.5 * (
        (2 * p1[0]) +
        (-p0[0] + p2[0]) * s +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s * s +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s * s * s
      );
      const y = 0.5 * (
        (2 * p1[1]) +
        (-p0[1] + p2[1]) * s +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s * s +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s * s * s
      );
      result.push({ x, y });
    }
  }
  return result;
} 