export default function areaOfPolygon(coordinates) {
  // Shoelace algorithm.
  const n = coordinates.length;
  let area = 0.0;
  let j = n - 1;

  for (let i = 0; i < n; i++) {
    area += (coordinates[j][0] + coordinates[i][0]) * (coordinates[j][1] - coordinates[i][1]);
    j = i; // j is previous vertex to i
  }

  // Return absolute value of half the sum
  // (The value is halved as we are summing up triangles, not rectangles).
  return Math.abs(area / 2.0);
}
