import { cornerstone, cornerstoneMath, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { distanceThreshold } from './definitions';

const pointNearPerpendicular = (element, handles, coords) => {
    const lineSegment = {
        start: cornerstone.pixelToCanvas(element, handles.perpendicularStart),
        end: cornerstone.pixelToCanvas(element, handles.perpendicularEnd)
    };

    const distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);

    return (distanceToPoint < distanceThreshold);
};

export default function(element, data, coords) {
    const { handles } = data;
    const lineSegment = {
        start: cornerstone.pixelToCanvas(element, handles.start),
        end: cornerstone.pixelToCanvas(element, handles.end)
    };

    const distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);

    if (cornerstoneTools.pointInsideBoundingBox(handles.textBox, coords)) {
        return true;
    }

    if (pointNearPerpendicular(element, handles, coords)) {
        return true;
    }

    return (distanceToPoint < distanceThreshold);
}
