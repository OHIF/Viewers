import { ToolGroupBaseSchema } from './baseSchema';
import { bidirectional } from '../tools/bidirectional';
import { targetCR } from '../tools/targetCR';
import { targetUN } from '../tools/targetUN';
import { length } from "../tools/length";
import { ellipse } from "../tools/ellipse";

export const targets = {
    id: 'targets',
    name: 'Targets',
    childTools: [bidirectional, targetCR, targetUN, length, ellipse],
    schema: ToolGroupBaseSchema
};
