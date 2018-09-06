import { ToolGroupBaseSchema } from '../schema/toolGroupSchema';
import length from '../schema/length';
import ellipticalRoi from '../schema/ellipticalRoi';
import rectangleRoi from '../schema/rectangleRoi';
import simpleAngle from '../schema/simpleAngle';
import arrowAnnotate from '../schema/arrowAnnotate';

const trackedTools = [
    length,
    ellipticalRoi,
    rectangleRoi,
    simpleAngle,
    arrowAnnotate
];

export const measurementTools = [{
    id: 'allTools',
    name: 'Measurements',
    childTools: trackedTools,
    schema: ToolGroupBaseSchema
}];
