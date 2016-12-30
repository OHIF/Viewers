import { ToolGroupBaseSchema } from './baseSchema';
import { nonTarget } from '../tools/nonTarget';

export const nonTargets = {
    id: 'nonTargets',
    name: 'Non-Targets',
    childTools: [nonTarget],
    schema: ToolGroupBaseSchema
};
