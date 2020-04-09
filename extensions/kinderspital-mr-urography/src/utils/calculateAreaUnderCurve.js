import bSpline from 'b-spline';

const degree = 2;
const sampleSize = 0.001;

export default function calculateAreaUnderCurve(timecourse, P, G) {
  const numTimePoints = timecourse.length;
  const knots = _getKnots(numTimePoints);
  const interpolatedPoints = [];

  const t0 = timecourse[P][0];
  const t1 = timecourse[G][0];

  // Comput b-spline.
  for (let t = 0; t <= 1; t += sampleSize) {
    const point = bSpline(t, degree, timecourse, knots);

    interpolatedPoints.push(point);
  }

  // Trapezium rule
  const halfWidth =
    0.5 * 0.001 * (timecourse[numTimePoints - 1][0] - timecourse[0][0]);

  // Filter to the range we want.
  const range = interpolatedPoints.filter(
    point => point[0] >= t0 && point[0] <= t1
  );

  // Add one of start and end points:
  let yValueSum = range[0][1] + range[range.length - 1][1];

  for (let i = 1; i < range.length - 1; i++) {
    yValueSum += range[i][1] * 2;
  }

  const areaUnderCurve = halfWidth * yValueSum;

  return areaUnderCurve;
}

/**
 * Returns a clamped Knot vector which goes throught first and last point.
 * @param {number} numTimePoints
 * @returns {number[]}
 */
function _getKnots(numTimePoints) {
  const knots = [];

  const equalKnots = degree + 1;
  const knotLength = numTimePoints + equalKnots;
  const interimKnotCount = knotLength - equalKnots * 2;

  let knotIndex = 0;

  for (let i = 0; i < equalKnots; i++) {
    knots.push(knotIndex);
  }

  knotIndex++;

  for (let i = 0; i < interimKnotCount; i++) {
    knots.push(knotIndex);
    knotIndex++;
  }

  for (let i = 0; i < equalKnots; i++) {
    knots.push(knotIndex);
  }

  return knots;
}
