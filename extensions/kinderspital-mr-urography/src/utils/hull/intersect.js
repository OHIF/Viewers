function ccw(x1, y1, x2, y2, x3, y3) {
  const cw = (y3 - y1) * (x2 - x1) - (y2 - y1) * (x3 - x1);
  return cw > 0 ? true : cw < 0 ? false : true; // colinear
}

function intersect(seg1, seg2) {
  const x1 = seg1[0][0],
    y1 = seg1[0][1],
    x2 = seg1[1][0],
    y2 = seg1[1][1],
    x3 = seg2[0][0],
    y3 = seg2[0][1],
    x4 = seg2[1][0],
    y4 = seg2[1][1];

  return (
    ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4) &&
    ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4)
  );
}

module.exports = intersect;
