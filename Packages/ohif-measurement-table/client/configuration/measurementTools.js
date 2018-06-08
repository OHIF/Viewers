import { ToolGroupBaseSchema } from '../schema/tools/toolGroupSchema';
import { length } from '../schema/tools/length';
import { ellipticalRoi } from '../schema/tools/ellipticalRoi';
import { rectangleRoi } from '../schema/tools/rectangleRoi';

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
