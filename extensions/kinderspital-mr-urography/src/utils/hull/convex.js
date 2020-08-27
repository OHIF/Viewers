function _cross(o, a, b) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function _upperTangent(pointset) {
  const lower = [];
  for (let l = 0; l < pointset.length; l++) {
    while (
      lower.length >= 2 &&
      _cross(lower[lower.length - 2], lower[lower.length - 1], pointset[l]) <= 0
    ) {
      lower.pop();
    }
    lower.push(pointset[l]);
  }
  lower.pop();
  return lower;
}

function _lowerTangent(pointset) {
  const reversed = pointset.reverse(),
    upper = [];
  for (let u = 0; u < reversed.length; u++) {
    while (
      upper.length >= 2 &&
      _cross(upper[upper.length - 2], upper[upper.length - 1], reversed[u]) <= 0
    ) {
      upper.pop();
    }
    upper.push(reversed[u]);
  }
  upper.pop();
  return upper;
}

// pointset has to be sorted by X
function convex(pointset) {
  const upper = _upperTangent(pointset),
    lower = _lowerTangent(pointset);
  const convex = lower.concat(upper);
  convex.push(pointset[0]);
  return convex;
}

module.exports = convex;
