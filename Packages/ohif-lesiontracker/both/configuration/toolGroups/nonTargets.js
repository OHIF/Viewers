import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { nonTarget } from '../tools/nonTarget';

const NonTargetSchema = new SimpleSchema({
    toolId: {
        type: String,
        label: 'Tool ID'
    },
    toolItemId: {
        type: String,
        label: 'Tool Item ID'
    },
    createdAt: {
        type: Date
    }
});

export const nonTargets = {
    id: 'nonTargets',
    name: 'Non-Targets',
    childTools: [nonTarget],
    schema: NonTargetSchema
};
