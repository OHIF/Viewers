import { ToolGroupBaseSchema } from './baseSchema';
import { length } from '../tools/length';
import { ellipse } from '../tools/ellipse';

export const temp = {
    id: 'temp',
    name: 'Temporary',
    childTools: [length, ellipse],
    schema: ToolGroupBaseSchema
};
