import { cornerstoneMath } from 'meteor/ohif:cornerstone';

// Move long-axis end point
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

    const distanceToLineP2 = distance(start, intersection);
    const newLineLength = distance(start, image);

    if (newLineLength <= distanceToLineP2) {
        return false;
    }

    const dx = (start.x - image.x) / newLineLength;
    const dy = (start.y - image.y) / newLineLength;

    const k = distanceToLineP2 / newLineLength;

    const newIntersection = {
        x: start.x + ((image.x - start.x) * k),
        y: start.y + ((image.y - start.y) * k)
    };

    perpendicularStart.x = newIntersection.x + distanceFromPerpendicularP1 * dy;
    perpendicularStart.y = newIntersection.y - distanceFromPerpendicularP1 * dx;

    perpendicularEnd.x = newIntersection.x - distanceFromPerpendicularP2 * dy;
    perpendicularEnd.y = newIntersection.y + distanceFromPerpendicularP2 * dx;

    return true;
}
