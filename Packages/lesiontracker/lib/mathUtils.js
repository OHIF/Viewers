
// Returns sign of number
sign = function(x) {
    return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
};

// Returns intersection points of lines and whether lines are intersected
getLineIntersection = function(point1, point2, point3, point4) {

    var intersectionPoint = {};

    var x1 = point1.x, y1 = point1.y, x2 = point2.x, y2 = point2.y,
        x3 = point3.x, y3 = point3.y, x4 = point4.x, y4 = point4.y;

    var a1, a2, b1, b2, c1, c2; // Coefficients of line equations
    var r1, r2, r3, r4; // Sign values

    var denom, offset, num; //Intermediate values

    // Compute a1, b1, c1, where line joining points 1 and 2 is "a1 x  +  b1 y  +  c1  =  0"
    a1 = y2 - y1;
    b1 = x1 - x2;
    c1 = x2 * y1 - x1 * y2;

    // Compute r3 and r4
    r3 = a1 * x3 + b1 * y3 + c1;
    r4 = a1 * x4 + b1 * y4 + c1;

    /* Check signs of r3 and r4.  If both point 3 and point 4 lie on
     * same side of line 1, the line segments do not intersect.
     */

    if (r3 !== 0 &&
        r4 !== 0 &&
        sign(r3) === sign(r4)) {
        intersectionPoint.x = 0;
        intersectionPoint.y = 0;
        intersectionPoint.intersected = false;
        return intersectionPoint;
    }

    /* Compute a2, b2, c2 */

    a2 = y4 - y3;
    b2 = x3 - x4;
    c2 = x4 * y3 - x3 * y4;

    /* Compute r1 and r2 */

    r1 = a2 * x1 + b2 * y1 + c2;
    r2 = a2 * x2 + b2 * y2 + c2;

    /* Check signs of r1 and r2.  If both point 1 and point 2 lie
     * on same side of second line segment, the line segments do
     * not intersect.
     */

    if (r1 !== 0 &&
        r2 !== 0 &&
        sign(r1) === sign(r2)) {
        intersectionPoint.x = 0;
        intersectionPoint.y = 0;
        intersectionPoint.intersected = false;
        return intersectionPoint;
    }

    /* Line segments intersect: compute intersection point.
     */

    denom = (a1 * b2) - (a2 * b1);

    offset = denom < 0 ? -denom / 2 : denom / 2;

    /* The denom/2 is to get rounding instead of truncating.  It
     * is added or subtracted to the numerator, depending upon the
     * sign of the numerator.
     */

    num = (b1 * c2) - (b2 * c1);
    var x = parseFloat(num / denom);

    num = (a2 * c1) - (a1 * c2);
    var y = parseFloat(num / denom);

    intersectionPoint.x = x;
    intersectionPoint.y = y;
    intersectionPoint.intersected = true;

    return intersectionPoint;
};

// Returns distance between two points
getDistance = function(point1, point2) {
    return Math.sqrt((point1.x - point2.x) * (point1.x - point2.x) + (point1.y - point2.y) * (point1.y - point2.y));
};

// Returns distance from point to a line
getDistanceFromPointToLine = function(ptTest, pt1, pt2) {
    var ptNearest = {};

    // Point on line segment nearest to pt0
    var dx = pt2.x - pt1.x;
    var dy = pt2.y - pt1.y;

    // It's a point, not a line
    if (dx === 0 && dy === 0) {
        ptNearest.x = pt1.x;
        ptNearest.y = pt1.y;
    } else {
        // Parameter
        var t = ((ptTest.x - pt1.x) * dx + (ptTest.y - pt1.y) * dy) / (dx * dx + dy * dy);

        // Nearest point is pt1
        if (t < 0) {
            ptNearest = pt1;
        }
        // Nearest point is pt2
        else if (t > 1) {
            ptNearest = pt2;
        }
        // Nearest point is on the line segment
        else {
            // Parametric equation
            ptNearest.x = (pt1.x + t * dx);
            ptNearest.y = (pt1.y + t * dy);
        }
    }

    var distanceX = ptTest.x - ptNearest.x;
    var distanceY = ptTest.y - ptNearest.y;
    ptNearest.distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    return ptNearest;
};
