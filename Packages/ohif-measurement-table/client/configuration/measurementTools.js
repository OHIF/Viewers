import { ToolGroupBaseSchema } from '../schema/toolGroupSchema';
import { default as length } from '../schema/length';
import { default as ellipticalRoi } from '../schema/ellipticalRoi';
import { default as rectangleRoi } from '../schema/rectangleRoi';
import { default as simpleAngle } from '../schema/simpleAngle';

const trackedTools = [
    length,
    ellipticalRoi,
    rectangleRoi,
    simpleAngle
];

export const measurementTools = [{
    id: 'allTools',
    name: 'Measurements',
    childTools: trackedTools,
    schema: ToolGroupBaseSchema
}];
