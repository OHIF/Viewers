import { cornerstoneMath } from 'meteor/ohif:cornerstone';

// Move long-axis start point
export default function(eventData, data) {
    const { distance } = cornerstoneMath.point;
    const { start, end, perpendicularStart, perpendicularEnd } = data.handles;
    const { image } = eventData.currentPoints;

    const longLine = {
        start: {
            x: start.x,
            y: start.y
        },
        end: {
            x: end.x,
            y: end.y
        }
    };

    const perpendicularLine = {
        start: {
            x: perpendicularStart.x,
            y: perpendicularStart.y
        },
        end: {
            x: perpendicularEnd.x,
            y: perpendicularEnd.y
        }
    };

    const intersection = cornerstoneMath.lineSegment.intersectLine(longLine, perpendicularLine);

    const distanceFromPerpendicularP1 = distance(perpendicularStart, intersection);
    const distanceFromPerpendicularP2 = distance(perpendicularEnd, intersection);

    const distanceToLineP2 = distance(end, intersection);
    const newLineLength = distance(end, image);

    if (newLineLength <= distanceToLineP2) {
        return false;
    }

    const dx = (end.x - image.x) / newLineLength;
    const dy = (end.y - image.y) / newLineLength;

    const k = distanceToLineP2 / newLineLength;

    const newIntersection = {
        x: end.x + ((image.x - end.x) * k),
        y: end.y + ((image.y - end.y) * k)
    };

    perpendicularStart.x = newIntersection.x - distanceFromPerpendicularP1 * dy;
    perpendicularStart.y = newIntersection.y + distanceFromPerpendicularP1 * dx;

    perpendicularEnd.x = newIntersection.x + distanceFromPerpendicularP2 * dy;
    perpendicularEnd.y = newIntersection.y - distanceFromPerpendicularP2 * dx;

    return true;
}
