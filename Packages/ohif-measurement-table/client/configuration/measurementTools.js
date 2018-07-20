import { ToolGroupBaseSchema } from '../schema/toolGroupSchema';
import { length } from '../schema/length';
import { ellipticalRoi } from '../schema/ellipticalRoi';
import { rectangleRoi } from '../schema/rectangleRoi';

const trackedTools = [
    length,
    ellipticalRoi,
    rectangleRoi
];

export const measurementTools = [{
    id: 'allTools',
    name: 'Measurements',
    childTools: trackedTools,
    schema: ToolGroupBaseSchema
}];
